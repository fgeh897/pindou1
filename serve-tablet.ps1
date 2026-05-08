$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8124

Set-Location $root

$addresses = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -ExpandProperty IPAddress -Unique

Write-Host ""
Write-Host "Tablet server starting..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Open one of these URLs on your tablet browser:" -ForegroundColor Yellow
Write-Host ""

foreach ($ip in $addresses) {
  Write-Host ("  http://{0}:{1}/index-local-browser.html" -f $ip, $port) -ForegroundColor Green
  Write-Host ("  http://{0}:{1}/index-tablet-standalone.html" -f $ip, $port) -ForegroundColor Green
  Write-Host ""
}

Write-Host "Recommended on tablet:" -ForegroundColor Yellow
Write-Host ("  http://localhost:{0}/index-tablet-standalone.html" -f $port)
Write-Host ""
Write-Host "Keep this window open while using the tablet." -ForegroundColor Yellow
Write-Host "This version also exposes OCR API at /api/ocr/palette-card." -ForegroundColor Yellow
Write-Host ""

python .\pindou_server.py --host 0.0.0.0 --port $port
