@echo off
echo Starting CrashIntel Backend Server on Port 8001...
python -m uvicorn scripts.main:app --app-dir web-project --port 8001
pause
