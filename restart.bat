@echo off
echo ========================================
echo   Restart Service
echo ========================================
echo.

echo [1/3] Stopping Python processes...
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   Python processes stopped
) else (
    echo   No running Python processes found
)

echo.
echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting service...
echo.
echo Service URLs:
echo   - Local: http://127.0.0.1:5000
echo   - LAN: http://[your IP]:5000
echo.
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

python app.py

pause
