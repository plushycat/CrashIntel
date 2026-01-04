# Web Project (Phase 5)

This folder contains the frontend and backend integration for the **CrashIntel** dashboard.

## Overview
The web application serves as the user interface for the crash analysis system.
- **Backend**: FastAPI (Python) serving REST APIs.
- **Frontend**: HTML/JS/CSS (Leaflet Map, Dashboard).

## Features
- **Interactive Map**: 20,000+ crash points rendered via Canvas.
- **Deep Dive Stats**: Real-time statistics based on map view.
- **Predictive Risk Assessment**: ML-powered severity prediction.

## How to Run

### 1. Start the Backend Server
This is critical for the map and predictions to work.

**From the ROOT directory of the repository:**
```bash
python -m uvicorn scripts.main:app --app-dir web-project --port 8001
```

### 2. Open the Frontend
Simply open the HTML files in `src/` folder in your browser.
- **Dashboard**: `src/dashboard.html`
- **Landing**: `src/index.html`

*Recommendation: Use a local HTTP server (like VS Code "Live Server") for the best experience.*