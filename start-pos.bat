@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-pos.ps1"
if errorlevel 1 pause
endlocal
