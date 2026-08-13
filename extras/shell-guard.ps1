# shell-guard.ps1 - PreToolUse guard for Bash / PowerShell calls.
# stderr is fed back to Claude, which then rewrites the command or asks the user.
# Source kept pure ASCII on purpose (PITFALLS E1).
#
# TWO contracts live in this file, on purpose, because they earn their place
# differently:
#
#   1. RECORDED TRAPS - blocks only on incidents written up in ~/.claude/PITFALLS.md,
#      with a near-zero false-positive rate. These commands fail SILENTLY, so the
#      rule is only added after something has actually gone wrong.
#
#   2. DESTRUCTIVE GIT - blocks commands that succeed and discard work. These are
#      NOT recorded incidents and must never be added to PITFALLS.md, which is
#      dated-incidents-only. The incident that would earn one of these rules is
#      also the incident that destroys the work, so it is written in advance.
#      This is CLAUDE.md's "confirm before anything irreversible" made mechanical.
#      Adapted from mattpocock/skills misc/git-guardrails-claude-code (2026-08-13).

$ErrorActionPreference = 'Stop'

try { $raw = [Console]::In.ReadToEnd() } catch { exit 0 }
if (-not $raw) { exit 0 }
try { $in = $raw | ConvertFrom-Json } catch { exit 0 }

$tool = [string]$in.tool_name
$cmd  = [string]$in.tool_input.command
if (-not $cmd) { exit 0 }

$hits = New-Object System.Collections.ArrayList
function Flag($rule, $msg) { [void]$hits.Add("[$rule] $msg") }

if ($tool -eq 'Bash') {

    # D2 - Bash eats backslashes in Windows paths (C:UsersYouProjects...)
    if ($cmd -match '[A-Za-z]:\\' -or $cmd -match '\\Users\\') {
        Flag 'PITFALLS D2' ('Windows backslash path in a Bash command. Bash eats the ' +
            'backslashes (C:\Users\You arrives as C:UsersYou). Use forward slashes ' +
            '(/c/Users/You/...) or run this through the PowerShell tool.')
    }

    # D1 - cd does not persist and breaks later relative paths
    if ($cmd -match '(?m)^\s*cd\s+[^\r\n]+&&') {
        Flag 'PITFALLS D1' ('"cd X && ..." changes cwd for the rest of the block and ' +
            'silently breaks later relative paths. Use absolute paths, or git -C <path>.')
    }

    # D4 - Git Bash grep -P with unicode ranges returns nothing instead of erroring
    if ($cmd -match 'grep[^\r\n|]*-[A-Za-z]*P' -and $cmd -match '\\x\{') {
        Flag 'PITFALLS D4' ('grep -P with \x{...} unicode ranges silently returns ' +
            'nothing on Git Bash - it does not error. Use the Grep tool (ripgrep) instead.')
    }

    # D4 - jq is not installed in this Git Bash
    if ($cmd -match '(^|[\s|;&(])jq\s') {
        Flag 'PITFALLS D4' ('jq is not installed in this Git Bash. Use PowerShell ' +
            'ConvertFrom-Json instead.')
    }
}

if ($tool -eq 'PowerShell') {

    # E1/E2 - non-ASCII in a command PowerShell 5.1 will read as cp1252
    if ($cmd -match '[^\x00-\x7F]' -and $cmd -match '(Out-File|Set-Content|Add-Content|>>?\s)') {
        Flag 'PITFALLS E1/E2' ('Non-ASCII characters in a command that writes a file. ' +
            'PowerShell 5.1 is cp1252 here - em dashes and Thai text get mangled. Use the ' +
            'Write/Edit tool, or [char]0xNNNN, or pass -Encoding utf8 explicitly.')
    }
}

# ---------------------------------------------------------------------------
# Contract 2: destructive git. Tool-agnostic - the command reads the same in
# Bash and PowerShell. Not PITFALLS entries; see the header.
# ---------------------------------------------------------------------------

$gitPrefix = 'git\s+(-C\s+\S+\s+)?'

# Blank out commit-message payloads before scanning. A message that MENTIONS a
# destructive command is not one - the first real commit written after these
# rules landed was blocked by its own changelog. Only -m/--message arguments are
# stripped, deliberately: their contents are never executed, so this cannot be
# used as a bypass the way stripping every quoted string could.
$gitScan = $cmd
foreach ($p in @(
    '(?s)(-m|--message)\s+@''.*?''@',
    '(?s)(-m|--message)\s+"[^"]*"',
    '(?s)(-m|--message)\s+''[^'']*'''
)) { $gitScan = [regex]::Replace($gitScan, $p, '$1 <msg>') }

# Discards uncommitted work in the working tree / index.
if ($gitScan -match ($gitPrefix + 'reset\b[^\r\n]*--hard')) {
    Flag 'GIT' ('"git reset --hard" discards uncommitted work with no undo. Ask the ' +
        'user first. If they want it, they run it themselves.')
}
if ($gitScan -match ($gitPrefix + 'checkout\s+--\s')) {
    Flag 'GIT' ('"git checkout -- <path>" overwrites the file from HEAD and the ' +
        'current contents are gone. Ask the user first.')
}
if ($gitScan -match ($gitPrefix + 'restore\b') -and $gitScan -notmatch '--staged') {
    Flag 'GIT' ('"git restore" without --staged discards working-tree changes. Ask ' +
        'the user first. ("git restore --staged" only unstages and is allowed.)')
}
if ($gitScan -match ($gitPrefix + 'clean\b[^\r\n]*\s-[A-Za-z]*f')) {
    Flag 'GIT' ('"git clean -f" deletes untracked files off disk. Ask the user first, ' +
        'and show them "git clean -n" output before they decide.')
}

# Rewrites or deletes history that other copies depend on.
if ($gitScan -match ($gitPrefix + 'push\b[^\r\n]*(--force|\s-f\b)')) {
    Flag 'GIT' ('Force-push rewrites remote history. Ask the user first. Note plain ' +
        '"git push" is allowed - only the force variants are blocked.')
}
# (?-i) because -match is case-insensitive by default here, and "git branch -d"
# is the safe merged-only delete that must stay allowed.
if ($gitScan -match ($gitPrefix + 'branch\b[^\r\n]*\s(?-i)-D\b')) {
    Flag 'GIT' ('"git branch -D" force-deletes a branch even if unmerged. Use -d, or ' +
        'ask the user.')
}

# F5 - headless=new produced "NO FILE" on this machine
if ($cmd -match '--headless=new') {
    Flag 'PITFALLS F5' ('--headless=new produced no output file here. Use plain ' +
        '--headless with --no-sandbox and an explicit --user-data-dir.')
}

if ($hits.Count -eq 0) { exit 0 }

[Console]::Error.WriteLine("Blocked by shell-guard - known recorded trap:")
foreach ($h in $hits) { [Console]::Error.WriteLine("  " + $h) }
[Console]::Error.WriteLine("Rewrite the command and retry. Full catalogue: ~/.claude/PITFALLS.md")
exit 2
