@echo off
title Excel SQL Tool - Restart

:: ANSI escape code
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

:: Get LAN IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v /c:"127.0."') do (
    set "IP=%%a"
    goto :got_ip
)
:got_ip
set "IP=%IP: =%"

echo.
echo   %ESC%[36m===================================%ESC%[0m
echo   %ESC%[36m       Excel SQL Generator%ESC%[0m
echo   %ESC%[36m       v1.0 - Restarting...%ESC%[0m
echo   %ESC%[90m       Designed by XWR%ESC%[0m
echo   %ESC%[36m===================================%ESC%[0m
echo.
echo   %ESC%[33m[1/3]%ESC%[0m Stopping old processes...

taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo         %ESC%[32mPython stopped.%ESC%[0m
) else (
    echo         %ESC%[90mNo running process found.%ESC%[0m
)

echo.
echo   %ESC%[33m[2/3]%ESC%[0m Starting service...
echo.
echo   %ESC%[36m+--------------------------------------+%ESC%[0m
echo     Local:  %ESC%[90mhttp://127.0.0.1:5000%ESC%[0m
echo     LAN:    %ESC%[90mhttp://%IP%:5000%ESC%[0m
echo   %ESC%[36m+--------------------------------------+%ESC%[0m
echo.
echo   %ESC%[33m[3/3]%ESC%[0m %ESC%[32mReady!%ESC%[0m Press Ctrl+C to stop.
echo.
echo   %ESC%[36m===========================================%ESC%[0m
echo.

python app.py
