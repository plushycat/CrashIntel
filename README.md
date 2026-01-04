# Analysis and Prediction of Road Traffic Accident Severity in Bangalore
# CrashIntel: Privacy-First Road Accident Analysis & Prediction System

## Project Overview

**CrashIntel** is a comprehensive full-stack system designed to analyze road accident data in Bengaluru. It identifies high-risk hotspots, visualizes crash patterns, and predicts accident severity using Machine Learning.

The project combines advanced data science (Spatial Clustering, Association Rule Mining) with a modern **interactive web dashboard**.

---

## 🚀 Key Features

### 1. Interactive Crash Map (New!)
*   **High Performance**: Renders **20,085+ accident points** seamlessly using Leaflet Canvas technology (60fps).
*   **Deep Dive Analytics**:
    *   **Viewport Mode**: Statistics (Total Accidents, Fatalities, Most Common Cause) update automatically as you pan/zoom.
    *   **Click-to-Analyze (Local Mode)**: Click any point to create a **persistent analysis circle**.
    *   **Dynamic Radius**: The analysis area adjusts intelligently based on zoom (from **1.5km** regional view down to **500m** street view).
    *   **Persistence**: Your map position, zoom level, and active selection are **auto-saved** and restored on reload.
    *   **Clear Selection**: Easily reset to global view with a floating control.

### 2. Privacy-First Predictive Engine
*   **Severity Prediction**: An **XGBoost** model classifies accidents as *Minor, Serious, or Fatal* based on user inputs (Speed, Weather, Vehicle).
*   **Local Processing**: Inference runs locally to ensure data privacy.

### 3. Advanced Data Analysis
*   **Hotspot Detection**: **K-Means Clustering** identifies major accident zones.
*   **Root Cause Analysis**: **Apriori Algorithm** uncovers hidden patterns (e.g., `{Wet Road + Two Wheeler} -> {High Injury Risk}`).
*   **Temporal Analysis**: Visualizes critical time windows (e.g., the **11 PM - 3 AM** fatal crash spike).

---

## 🛠️ Technical Stack

### Backend
*   **FastAPI**: High-performance Python API server.
*   **MongoDB**: Primary database for scalable data storage (Auto-detects version).
*   **Fallback system**: Automatically switches to CSV data if MongoDB is unavailable.
*   **Data Science**: Pandas, NumPy, Scikit-learn, Imbalanced-learn.

### Frontend
*   **Leaflet.js**: Canvas-based map rendering.
*   **HTML5 / CSS3**: Glassmorphism UI design.
*   **JavaScript (ES6+)**: Custom logic with `localStorage` persistence.
*   **Supabase**: Authentication (Social/Email login).

---

## ⚡ How to Run

### Quick Start (Windows)
We have automated the entire startup process.

1.  **Double-click** `run_server.bat` in the root directory.
    *   It auto-detects your MongoDB installation (Checks v8.0 - v6.0).
    *   Starts the Database.
    *   Starts the Python Backend API (Port 8001).
2.  **Open** the Dashboard:
    *   Go to `web-project/src/index.html` in your browser.

### Manual Startup (Advanced)
If you cannot run the `.bat` file or prefer manual control:

**1. Start MongoDB**
Start your local MongoDB instance on port **27018**:
```bash
mongod --dbpath database/data --port 27018
```
*Note: If `mongod` is not in your PATH, use the full path (e.g., `"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"`).*

**2. Start Backend API**
Run the FastAPI server using Uvicorn:
```bash
# Install dependencies first
pip install -r requirements.txt

# Run the server
python -m uvicorn scripts.main:app --app-dir web-project --port 8001
```

---

## 📊 Key Analytical Findings

*   **The "Accuracy Paradox"**: Initial models achieved 95% accuracy but missed 100% of fatal crashes due to class imbalance. We addressed this using **SMOTE** and **F1-Score optimization**.
*   **Nighttime Risk**: Fatal accidents are disproportionately high between **11 PM and 3 AM** due to speeding on empty roads.
*   **Speed Impact**: Impact speeds >80 km/h show a near-exponential correlation with fatality risk.

---

## 📂 Project Structure

| Module | Description |
| :--- | :--- |
| **Analysis/** | Jupyter Notebooks for EDA, Clustering (K-Means), and Association Rules (Apriori). |
| **web-project/scripts/** | `main.py` (FastAPI Backend) and machine learning models. |
| **web-project/src/** | Frontend source code (`dashboard.html`, `dashboard.js`, CSS). |
| **database/** | MongoDB data storage (Local). |

---

## Future Scope
*   Integration of real-time traffic API data.
*   Deployment of the backend for centralized model retraining.
*   Expansion of dataset features (Seatbelt usage, Driver fatigue).
