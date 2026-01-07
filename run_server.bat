@echo off
setlocal

echo ===================================================
echo   CrashIntel - Full Stack Startup
echo ===================================================
echo.

:: ===================================================
:: DATA VERSION SELECTION
:: ===================================================
echo Choose data version:
echo   [1] GEOFIXED  - Geo-accurate coords (clustered by location) [DEFAULT]
echo   [2] ORIGINAL  - Random coords (original synthetic data)
echo   [3] Skip      - Use current active data
echo.
set /p dataChoice="Enter choice (1/2/3) [default=1]: "

if "%dataChoice%"=="" set dataChoice=1

if "%dataChoice%"=="1" (
    echo.
    echo Switching to GEOFIXED version...
    python Analysis\scripts\switch_data_version.py geofixed
    echo.
) else if "%dataChoice%"=="2" (
    echo.
    echo Switching to ORIGINAL version...
    python Analysis\scripts\switch_data_version.py original
    echo.
) else (
    echo.
    echo Using current active data...
    echo.
)

echo ===================================================

:: Set paths
set "SCRIPT_DIR=%~dp0"
set "DB_DIR=%SCRIPT_DIR%database\data"

:: Ensure data directory exists
if not exist "%DB_DIR%" (
    mkdir "%DB_DIR%"
    echo Created data directory: %DB_DIR%
)

:: Find MongoDB executable (check 8.2 first, then others)
if exist "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" (
    set "MONGOD_EXE=C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    set "MONGOD_EXE=C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    set "MONGOD_EXE=C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
    set "MONGOD_EXE=C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
) else (
    echo [WARNING] MongoDB not found. Backend will use CSV fallback.
    goto :start_backend
)

:: Start MongoDB in background
echo [1/2] Starting MongoDB on port 27018...
echo       Data Path: %DB_DIR%
start "CrashIntel MongoDB" /MIN "%MONGOD_EXE%" --port 27018 --dbpath "%DB_DIR%" --bind_ip 127.0.0.1

:: Wait for MongoDB to initialize
echo       Waiting 3 seconds for database to initialize...
timeout /t 3 /nobreak >nul

:start_backend
echo.
echo [2/2] Starting Backend Server on port 8001...
echo       Press Ctrl+C to stop.
echo.
python -m uvicorn scripts.main:app --app-dir web-project --port 8001

pause
