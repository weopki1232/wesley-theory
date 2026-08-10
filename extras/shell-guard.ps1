# shell-guard.ps1 - PreToolUse guard for Bash / PowerShell calls.
# Blocks (exit 2) only on traps that are recorded incidents in ~/.claude/PITFALLS.md
# and that have a near-zero false-positive rate. stderr is fed back to Claude, which
# then rewrites the command. Source kept pure ASCII on purpose (PITFALLS E1).

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
