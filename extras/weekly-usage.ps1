# weekly-usage.ps1 - sums token usage from Claude Code transcripts for the
# current weekly-budget window and caches the result for the statusline.
# Run with -CalibratePct <n> right after checking /usage to teach it what
# the current spend maps to on your plan's weekly percentage.
# UNTIL YOU CALIBRATE, the percentage does not exist and the statusline shows
# an API-equivalent dollar figure in amber instead. That figure is what the
# same tokens WOULD cost on the API - it is not what your plan charges you.
# Pure ASCII source (Windows PowerShell 5.1 safe).
param(
    [double]$CalibratePct = -1
)

$ErrorActionPreference = 'Stop'

$claudeDir = $env:CLAUDE_CONFIG_DIR
if (-not $claudeDir) { $claudeDir = Join-Path $env:USERPROFILE '.claude' }
$configPath = Join-Path $claudeDir 'weekly-budget.json'
$cacheDir   = Join-Path $claudeDir 'cache'
$cachePath  = Join-Path $cacheDir 'weekly-usage.json'
if (-not (Test-Path $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir | Out-Null }

# ---- config ----
$config = $null
if (Test-Path $configPath) {
    try { $config = (Get-Content $configPath -Raw) | ConvertFrom-Json } catch { $config = $null }
}
if ($null -eq $config) {
    $config = [pscustomobject]@{ reset_dow = $null; reset_hour = $null; scale = $null; cal_note = $null }
}

# ---- window start (UTC) ----
$nowUtc = [DateTime]::UtcNow
if ($config.reset_dow) {
    # most recent occurrence of reset_dow at reset_hour LOCAL time
    $resetHour = 0
    if ($null -ne $config.reset_hour) { $resetHour = [int]$config.reset_hour }
    $nowLocal = Get-Date
    $candidate = $nowLocal.Date.AddHours($resetHour)
    while ($candidate.DayOfWeek.ToString() -ne [string]$config.reset_dow -or $candidate -gt $nowLocal) {
        $candidate = $candidate.AddDays(-1)
    }
    $windowStartUtc = $candidate.ToUniversalTime()
} else {
    # no reset info yet: rolling 7-day window
    $windowStartUtc = $nowUtc.AddDays(-7)
}

# ---- pricing (USD per 1M tokens); cache write 5m=1.25x in, 1h=2x in, read=0.1x in ----
$pricing = @{
    fable  = @{ inp = 10.0; outp = 50.0 }
    opus   = @{ inp = 5.0;  outp = 25.0 }
    sonnet = @{ inp = 3.0;  outp = 15.0 }
    haiku  = @{ inp = 1.0;  outp = 5.0 }
}

function Get-Family([string]$model) {
    if ($model -match 'fable|mythos') { return 'fable' }
    if ($model -match 'opus')         { return 'opus' }
    if ($model -match 'haiku')        { return 'haiku' }
    return 'sonnet'
}

# ---- scan transcripts ----
$entries = @{}   # requestId -> @{ i=..; o=..; cr=..; c5=..; c1=..; m=.. }  (last write wins)
$files = Get-ChildItem (Join-Path $claudeDir 'projects') -Recurse -Filter '*.jsonl' -ErrorAction SilentlyContinue |
         Where-Object { $_.LastWriteTimeUtc -ge $windowStartUtc }

$reTs   = [regex]'"timestamp":"([^"]+)"'
$reReq  = [regex]'"requestId":"([^"]+)"'
$reUuid = [regex]'"uuid":"([^"]+)"'
$reModel= [regex]'"model":"([^"]+)"'
$reIn   = [regex]'"input_tokens":(\d+)'
$reOut  = [regex]'"output_tokens":(\d+)'
$reCr   = [regex]'"cache_read_input_tokens":(\d+)'
$reCw   = [regex]'"cache_creation_input_tokens":(\d+)'
$reC5   = [regex]'"ephemeral_5m_input_tokens":(\d+)'
$reC1   = [regex]'"ephemeral_1h_input_tokens":(\d+)'

foreach ($f in $files) {
    foreach ($line in [System.IO.File]::ReadLines($f.FullName)) {
        if ($line.IndexOf('"type":"assistant"') -lt 0) { continue }
        if ($line.IndexOf('"usage"') -lt 0) { continue }

        $mTs = $reTs.Match($line)
        if (-not $mTs.Success) { continue }
        try {
            $ts = [DateTime]::Parse($mTs.Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture,
                                    [Globalization.DateTimeStyles]::AdjustToUniversal)
        } catch { continue }
        if ($ts -lt $windowStartUtc) { continue }

        $mIn = $reIn.Match($line)
        if (-not $mIn.Success) { continue }

        $key = ''
        $mReq = $reReq.Match($line)
        if ($mReq.Success) { $key = $mReq.Groups[1].Value }
        else {
            $mU = $reUuid.Match($line)
            if ($mU.Success) { $key = $mU.Groups[1].Value } else { continue }
        }

        $model = ''
        $mM = $reModel.Match($line)
        if ($mM.Success) { $model = $mM.Groups[1].Value }

        $g = {
            param($re)
            $m = $re.Match($line)
            if ($m.Success) { [long]$m.Groups[1].Value } else { 0L }
        }
        $c5v = & $g $reC5
        $c1v = & $g $reC1
        $cwv = & $g $reCw
        if (($c5v + $c1v) -eq 0 -and $cwv -gt 0) { $c5v = $cwv }  # no TTL breakdown: treat as 5m

        $entries[$key] = @{
            i  = [long]$mIn.Groups[1].Value
            o  = & $g $reOut
            cr = & $g $reCr
            c5 = $c5v
            c1 = $c1v
            m  = $model
        }
    }
}

# ---- sum cost ----
$cost = 0.0
$totTokens = 0L
$byModel = @{}
foreach ($e in $entries.Values) {
    $fam = Get-Family $e.m
    $p = $pricing[$fam]
    $c = ($e.i * $p.inp + $e.o * $p.outp +
          $e.cr * $p.inp * 0.1 + $e.c5 * $p.inp * 1.25 + $e.c1 * $p.inp * 2.0) / 1000000.0
    $cost += $c
    $totTokens += $e.i + $e.o + $e.cr + $e.c5 + $e.c1
    # accumulate RAW here; rounding the running total each iteration silently
    # discards every sub-cent request (0.001 added to 17.15 rounds straight back
    # to 17.15), which erased cheap Haiku/Sonnet calls from the mix entirely.
    if (-not $byModel.ContainsKey($fam)) { $byModel[$fam] = 0.0 }
    $byModel[$fam] = $byModel[$fam] + $c
}

# ---- calibration ----
if ($CalibratePct -ge 0) {
    if ($cost -le 0) { Write-Output 'Cannot calibrate: computed cost is zero.'; exit 1 }
    $scale = $CalibratePct / $cost
    $config | Add-Member -NotePropertyName scale -NotePropertyValue $scale -Force
    $note = 'calibrated {0}: {1}% at ${2:N2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm'), $CalibratePct, $cost
    $config | Add-Member -NotePropertyName cal_note -NotePropertyValue $note -Force
    [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json))
    Write-Output ("Calibrated: {0}% / `${1:N2} -> scale {2:N4} pct per USD" -f $CalibratePct, $cost, $scale)
}

$pct = $null
if ($null -ne $config.scale -and $config.scale -gt 0) { $pct = [math]::Round($cost * [double]$config.scale) }

# ---- write cache ----
$byModelOut = @{}
foreach ($k in $byModel.Keys) { $byModelOut[$k] = [math]::Round($byModel[$k], 2) }
$cache = [ordered]@{
    ts           = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    window_start = $windowStartUtc.ToString('o')
    cost_usd     = [math]::Round($cost, 2)
    pct          = $pct
    tokens       = $totTokens
    by_model     = $byModelOut
    requests     = $entries.Count
}
[System.IO.File]::WriteAllText($cachePath, ($cache | ConvertTo-Json))
Write-Output ("Weekly usage since {0:yyyy-MM-dd HH:mm}Z: `${1:N2} ({2} requests, {3:N1}M tokens)" -f $windowStartUtc, $cost, $entries.Count, ($totTokens / 1000000.0))
if ($null -ne $pct) { Write-Output ("Estimated weekly plan usage: ~{0}%" -f $pct) }
