@echo off
title Excel SQL Tool - Restart

:: Get LAN IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v /c:"127.0."') do (
    set "IP=%%a"
    goto :got_ip
)
:got_ip
set "IP=%IP: =%"

echo.
echo   ===========================================
echo          Excel SQL Generator
echo          v1.0 - Restarting...
echo          Design by XWR
echo   ===========================================
echo.
echo   [1/3] Stopping old processes...

taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo         Python stopped.
) else (
    echo         No running process found.
)

echo.
echo   [2/3] Starting service...
echo.
echo   +--------------------------------------+
echo     Local:  http://127.0.0.1:5000           
echo     LAN:    http://%IP%:5000                 
echo   +--------------------------------------+
echo.
echo   [3/3] Ready! Press Ctrl+C to stop.
echo.
echo   ===========================================
echo.

python app.py
