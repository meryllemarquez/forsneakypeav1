# Phase 0 baseline: backend latency measurement (Windows).
#
#   $env:BACKEND_URL = "https://<service>.onrender.com/api/v1"
#   $env:TOKEN = "<jwt>"        # optional
#   .\scripts\measure.ps1
#
# RUNS (env, default 5) = requests per endpoint. COLD_ONLY=1 runs only the
# unauthenticated probe. Times are milliseconds: connect / first byte / total.
$ErrorActionPreference = 'Stop'
if (-not $env:BACKEND_URL) { throw 'Set $env:BACKEND_URL, e.g. https://your-service.onrender.com/api/v1' }
$Base  = $env:BACKEND_URL.TrimEnd('/')
$Runs  = if ($env:RUNS) { [int]$env:RUNS } else { 5 }
$Token = $env:TOKEN

function Measure-Request([string]$Url, [string[]]$Extra = @()) {
  $out = & curl.exe -s -o NUL --max-time 90 @Extra `
    -w '%{time_connect} %{time_starttransfer} %{time_total} %{http_code}' $Url
  $p = $out -split ' '
  [pscustomobject]@{
    Connect = [math]::Round([double]$p[0] * 1000, 0, 'AwayFromZero')
    Ttfb    = [math]::Round([double]$p[1] * 1000, 0, 'AwayFromZero')
    Total   = [math]::Round([double]$p[2] * 1000, 0, 'AwayFromZero')
    Code    = $p[3]
  }
}

function Get-Median($v) {
  $s = @($v | Sort-Object); $n = $s.Count
  if ($n % 2) { $s[($n - 1) / 2] } else { [math]::Floor(($s[$n / 2 - 1] + $s[$n / 2]) / 2) }
}

Write-Host "Backend: $Base"
Write-Host "Date:    $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))`n"

# Unauthenticated probe: rejected (401/403) without touching the DB, so it
# isolates server wake-up + network (cold start) from query time.
Write-Host '== Unauthenticated probe (cold start) =='
$r = Measure-Request "$Base/memories/folders"
Write-Host ("GET /memories/folders (no token)  connect={0}ms  ttfb={1}ms  total={2}ms  http={3}`n" -f $r.Connect, $r.Ttfb, $r.Total, $r.Code)

if ($env:COLD_ONLY -eq '1') { return }
if (-not $Token) { Write-Host 'TOKEN not set - skipping authenticated Home page endpoints.'; return }

# Endpoints HomePage.jsx loads in parallel on mount.
$Endpoints = @(
  '/memories/folders?includeArchived=false',
  '/dates?includeArchived=false',
  '/love-board/notes'
)

Write-Host "== Home page endpoints ($Runs runs each, median ms) =="
'{0,-42} {1,8} {2,8} {3,8}  {4}' -f 'endpoint', 'connect', 'ttfb', 'total', 'http'
foreach ($ep in $Endpoints) {
  $rs = 1..$Runs | ForEach-Object { Measure-Request "$Base$ep" @('-H', "Authorization: Bearer $Token") }
  '{0,-42} {1,8} {2,8} {3,8}  {4}' -f $ep, (Get-Median $rs.Connect), (Get-Median $rs.Ttfb), (Get-Median $rs.Total), $rs[-1].Code
}
