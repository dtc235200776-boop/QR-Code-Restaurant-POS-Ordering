@echo off
setlocal
pushd "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Khong tim thay Node.js. Hay cai Node.js 18 tro len roi chay lai file nay.
  pause
  exit /b 1
)

start "Cloud POS Server" cmd /k node server.js
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/"
endlocal
