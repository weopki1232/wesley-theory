# Claude Code statusline - styled, color-coded.
# Source kept pure-ASCII; glyphs built from code points so Windows
# PowerShell 5.1 does not mangle them when reading the file.
$ErrorActionPreference = 'SilentlyContinue'

# emit UTF-8 bytes so the glyphs render in the terminal
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch {}

# ---- glyphs ----
$gDiamond = [char]0x25C6   # diamond
$gPipe    = [char]0x2502   # vertical bar separator
$gFill    = [char]0x25B0   # filled bar segment
$gEmpty   = [char]0x25B1   # empty bar segment
$gClock   = [char]0x25F7   # estimate marker

# ---- ANSI helpers (256-color) ----
$E = [char]27
function Fg([int]$c, [string]$t) { "$E[38;5;${c}m$t$E[0m" }
function Bold([string]$t)        { "$E[1m$t$E[0m" }

# palette
$cModel = 141   # purple
$cDir   = 45    # cyan
$cCost  = 78    # green
$cEst   = 214   # amber (estimate / forecast)
$cSep   = 240   # dim gray
$sep    = Fg $cSep "  $gPipe  "

# ---- parse stdin ----
$raw  = [Console]::In.ReadToEnd()
$data = $raw | ConvertFrom-Json

# ---- model ----
$model = $data.model.display_name
if (-not $model) { $model = 'Claude' }
$modelPart = Fg $cModel ("$gDiamond " + (Bold $model))

# ---- directory ----
$dir = $data.workspace.current_dir
if (-not $dir) { $dir = $data.cwd }
$dirName = if ($dir) { Split-Path $dir -Leaf } else { '?' }
$dirPart = Fg $cDir "~/$dirName"

# ---- cost ----
$cost = $data.cost.total_cost_usd
if ($null -eq $cost) { $cost = 0 }
$costPart = Fg $cCost ('${0:N2}' -f [double]$cost)

# ---- planned-work estimate (written by Claude after planning) ----
$root = $PSScriptRoot
if (-not $root) { $root = Join-Path $env:USERPROFILE '.claude' }
$ep = Join-Path $root 'estimate.json'
if (Test-Path $ep) {
    try { $est = (Get-Content $ep -Raw) | ConvertFrom-Json } catch { $est = $null }
    if ($est -and ($null -ne $est.est_cost -or $null -ne $est.est_tokens)) {
        # auto-clear safety net: hide a stale estimate (ts older than TTL)
        $fresh = $true
        $ttlMin = 45
        if ($null -ne $est.ts) {
            $ageMin = ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [long]$est.ts) / 60
            if ($ageMin -gt $ttlMin) { $fresh = $false }
        }
        if ($fresh) {
            $bits = @()
            if ($null -ne $est.est_cost)   { $bits += ('~${0:N2}' -f [double]$est.est_cost) }
            if ($null -ne $est.est_tokens) { $bits += ('{0}k' -f [math]::Round([double]$est.est_tokens / 1000)) }
            $costPart += '  ' + (Fg $cEst ("$gClock est " + ($bits -join ' / ')))
        }
    }
}

# ---- weekly budget (cache written by tools\weekly-usage.ps1) ----
$wkPart = ''
$wkCache = Join-Path $root 'cache\weekly-usage.json'
$wkStale = $true
if (Test-Path $wkCache) {
    try { $wk = (Get-Content $wkCache -Raw) | ConvertFrom-Json } catch { $wk = $null }
    if ($wk -and $null -ne $wk.ts) {
        $wkAgeMin = ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [long]$wk.ts) / 60
        $wkStale = ($wkAgeMin -gt 30)
        if ($null -ne $wk.pct) {
            $wc = if     ($wk.pct -lt 60) { 78  }   # green
                  elseif ($wk.pct -lt 85) { 220 }   # yellow
                  else                    { 196 }   # red
            $wkPart = Fg $wc ('wk ~{0}%' -f [int]$wk.pct)
        } elseif ($null -ne $wk.cost_usd) {
            # uncalibrated: show estimated API-equivalent cost in amber
            $wkPart = Fg $cEst ('wk ~${0:N0}' -f [double]$wk.cost_usd)
        }
    }
}
if ($wkStale) {
    # refresh in the background, at most once per 10 minutes
    $wkLock = Join-Path $root 'cache\weekly-refresh.lock'
    $spawn = $true
    if (Test-Path $wkLock) {
        if (((Get-Date) - (Get-Item $wkLock).LastWriteTime).TotalMinutes -lt 10) { $spawn = $false }
    }
    if ($spawn) {
        try {
            Set-Content -Path $wkLock -Value (Get-Date -Format 'o') -Force
            Start-Process powershell -WindowStyle Hidden -ArgumentList @(
                '-NoProfile', '-File', (Join-Path $root 'tools\weekly-usage.ps1')
            ) | Out-Null
        } catch {}
    }
}

# ---- context % + bar ----
$ctxPart = ''
$tp = $data.transcript_path
if ($tp -and (Test-Path $tp)) {
    $lines = @(Get-Content $tp -Tail 100)
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -notmatch 'usage') { continue }
        try { $obj = $lines[$i] | ConvertFrom-Json } catch { continue }
        $u = $obj.message.usage
        if ($u -and $u.input_tokens) {
            $ctx = [int]$u.input_tokens `
                 + [int]$u.cache_read_input_tokens `
                 + [int]$u.cache_creation_input_tokens
            $pct = [math]::Round(($ctx / 200000) * 100)
            if ($pct -gt 100) { $pct = 100 }

            # color by fill level
            $c = if     ($pct -lt 50) { 78  }   # green
                 elseif ($pct -lt 80) { 220 }   # yellow
                 else                 { 196 }   # red

            # 6-segment bar
            $seg    = [math]::Round($pct / 100 * 6)
            $filled = [string]$gFill * $seg
            $empty  = [string]$gEmpty * (6 - $seg)
            $bar    = (Fg $c $filled) + (Fg $cSep $empty)
            $ctxPart = "$bar " + (Fg $c "$pct%")
            break
        }
    }
}

# ---- assemble ----
$parts = @($modelPart, $dirPart)
if ($ctxPart) { $parts += $ctxPart }
$parts += $costPart
if ($wkPart) { $parts += $wkPart }
[Console]::Out.Write(($parts -join $sep))
