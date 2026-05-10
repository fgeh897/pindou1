$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8124

Set-Location $root

$addresses = ipconfig |
  Select-String "IPv4 Address[^\:]*:\s*([0-9\.]+)" |
  ForEach-Object { $_.Matches[0].Groups[1].Value } |
  Where-Object {
    $_ -notlike "127.*" -and
    $_ -notlike "169.254.*" -and
    $_ -notlike "198.18.*"
  } |
  Select-Object -Unique

Write-Host ""
Write-Host "Tablet server starting..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This computer only (fixed URL every time):" -ForegroundColor Yellow
Write-Host ""
Write-Host ("  http://localhost:{0}/index-local-browser.html" -f $port) -ForegroundColor Green
Write-Host ("  http://localhost:{0}/index-tablet-standalone.html" -f $port) -ForegroundColor Green
Write-Host ""

Write-Host "Phone / tablet on the same Wi-Fi (use current LAN IP):" -ForegroundColor Yellow
Write-Host ""

foreach ($ip in $addresses) {
  Write-Host ("  http://{0}:{1}/index-local-browser.html" -f $ip, $port) -ForegroundColor Green
  Write-Host ("  http://{0}:{1}/index-tablet-standalone.html" -f $ip, $port) -ForegroundColor Green
  Write-Host ""
}

Write-Host "Note:" -ForegroundColor Yellow
Write-Host "  localhost only works on this computer itself."
Write-Host "  If the Wi-Fi changes, the LAN IP may change too."
Write-Host ""
Write-Host "Keep this window open while using the tablet." -ForegroundColor Yellow
Write-Host "This version also exposes OCR API at /api/ocr/palette-card." -ForegroundColor Yellow
Write-Host ""

python .\pindou_server.py --host 0.0.0.0 --port $port
