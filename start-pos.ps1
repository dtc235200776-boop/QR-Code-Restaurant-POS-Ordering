$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Khong tim thay Node.js 18 tro len. Hay cai Node.js roi chay lai.' -ForegroundColor Red
    exit 1
}

$projectPath = $PSScriptRoot
$buildVersion = '2026-11-03-guest-room-qr-realtime-1'
$readyPort = $null

# Reuse a matching current server if it is already running.
foreach ($port in 3010..3000) {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 1
        if ($health.ok -and $health.version -eq $buildVersion) { $readyPort = $port; break }
    } catch { }
}

# The previous build used a shared PIN. Stop only a stale Node server that
# answers as this hotel application, so the updated role accounts can use 3000.
if (-not $readyPort) {
    foreach ($port in 3010..3000) {
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 1
            if (-not $health.ok -or $health.version -eq $buildVersion -or $health.app -notlike '*Cloud Hotel*') { continue }
            $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop | Select-Object -First 1
            if (-not $listener -or -not $listener.OwningProcess) { continue }
            $owner = Get-Process -Id $listener.OwningProcess -ErrorAction Stop
            if ($owner.ProcessName -ne 'node') { continue }
            Stop-Process -Id $owner.Id -Force -ErrorAction Stop
            Write-Host "Da dong may chu khach san cu tren cong $port de nap ban cap nhat." -ForegroundColor Yellow
            Start-Sleep -Milliseconds 400
        } catch { }
    }
}

if (-not $readyPort) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$projectPath`" && node server.js" -WorkingDirectory $projectPath
}

for ($attempt = 0; $attempt -lt 30 -and -not $readyPort; $attempt++) {
    foreach ($port in 3010..3000) {
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 1
            if ($health.ok -and $health.version -eq $buildVersion) { $readyPort = $port; break }
        } catch { }
    }
    if (-not $readyPort) { Start-Sleep -Milliseconds 500 }
}

if ($readyPort) {
    Write-Host "Mo trang chu tai http://localhost:$readyPort/ tren Chrome..."
    try {
        Start-Process "chrome.exe" "http://localhost:$readyPort/"
    } catch {
        Start-Process "http://localhost:$readyPort/"
    }
} else {
    Write-Host 'May chu chua san sang. Kiem tra loi trong cua so Cloud POS Server.' -ForegroundColor Red
    exit 1
}
