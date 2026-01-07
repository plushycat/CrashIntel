@echo off
title CrashIntel - Data Version Switcher
color 0A

echo.
echo ============================================================
echo                 CRASHINTEL DATA VERSION SWITCHER
echo ============================================================
echo.
echo Choose which dataset version to use:
echo.
echo   [1] ORIGINAL  - Random coordinates (original synthetic data)
echo   [2] GEOFIXED  - Geo-accurate coordinates (clustered by location)
echo.
echo ============================================================
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Switching to ORIGINAL version...
    python Analysis\scripts\switch_data_version.py original
) else if "%choice%"=="2" (
    echo.
    echo Switching to GEOFIXED version...
    python Analysis\scripts\switch_data_version.py geofixed
) else (
    echo.
    echo Invalid choice! Please enter 1 or 2.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo.
set /p restart="Restart the server now? (Y/N): "

if /i "%restart%"=="Y" (
    echo.
    echo Restarting server...
    
    REM Kill existing uvicorn processes
    taskkill /F /IM uvicorn.exe 2>nul
    taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
    
    REM Start fresh
    echo Starting server on port 8001...
    start "CrashIntel API" cmd /k "cd /d %~dp0 && python -m uvicorn web-project.scripts.main:app --reload --port 8001"
    
    echo.
    echo Server started! API available at http://127.0.0.1:8001
)

echo.
echo Done!
pause
