# Analysis and Prediction of Road Traffic Accident Severity in Bangalore

## Description

This project performs a comprehensive analysis of road accident data in Bangalore to identify high-risk patterns and hotspots. It evolves from raw data cleaning and exploratory analysis into a **modern, interactive web dashboard**. 

The solution combines advanced data science techniques (Spatial Clustering, Association Rule Mining) with a full-stack web application to visualize crash data dynamically.

---

## Project Phases

This project follows a 5-phase structure:

1.  **Phase 1 & 2: Data Preprocessing & Cleaning**
    *   cleaning, imputation, and feature engineering on the raw dataset.
2.  **Phase 3: Exploratory Analysis & Pattern Discovery**
    *   **Spatial Clustering (K-means):** Identifying 6 distinct accident hotspots.
    *   **Association Rule Mining (Apriori):** Finding distinct cause-effect patterns (e.g., *Wet Road + Motorcycle -> Serious Injury*).
3.  **Phase 4: Predictive Modeling**
    *   Attempting severity prediction using Random Forest and XGBoost (noted limitations due to dataset class imbalance).
4.  **Phase 5: Web Integration (Current State)**
    *   **Backend:** A **FastAPI** server that exposes machine learning models and refined datasets via REST APIs.
    *   **Frontend:** A responsive Dashboard built with **HTML5, CSS3, and JavaScript**.
    *   **Visualization:** An interactive **Leaflet Map** rendering over **20,000 accident points** with heatmap-like density effects, strictly bound to the Bangalore region.

---

## Technical Stack

### Data Science & Backend
*   **Python 3.x**: Core logic.
*   **Pandas & NumPy**: Data manipulation.
*   **Scikit-learn**: Machine Learning (Random Forest, K-Means, LOF).
*   **FastAPI**: High-performance API server.
*   **MongoDB**: Primary database (with automatic CSV fallback).

### Frontend
*   **HTML5 / CSS3**: Responsive Glassmorphism UI.
*   **JavaScript (ES6+)**: Dynamic logic.
*   **Leaflet.js**: Interactive maps with Canvas rendering for high performance.
*   **Chart.js**: Statistical visualizations.

---

## Key Features

*   **Interactive Crash Map**: 
    *   Visualizes the **entire dataset (20,085 records)**.
    *   Uses **Canvas rendering** to maintain 60fps performance.
    *   Smart interactions: Panning or clicking the map automatically updates "Deep Dive" statistics based on the visible area.
*   **Predictive Risk Assessment**:
    *   A dedicated module to predict accident severity based on user inputs (Location, Vehicle, Weather).
*   **Temporal Analysis**:
    *   Visual breakdown of accidents by Hour of Day and Day of Week.

---

## Setup & How to Run

### Prerequisities
*   Python 3.9+
*   MongoDB (Optional - system will fallback to CSV if not running)

### 1. Backend Setup
1.  Navigate to the root directory.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Ensure fastapi, uvicorn, pymongo, pandas, scikit-learn are included)*
3.  Start the API Server:
    ```bash
    # Run from the root directory
    python -m uvicorn scripts.main:app --app-dir web-project --port 8001
    ```
    *Note: We use port **8001** to avoid conflicts.*

### 2. Frontend Setup
1.  Navigate to `web-project/src`.
2.  Open `dashboard.html` (or `index.html`) directly in your browser.
    *   *For best results, use a simple HTTP server (e.g., Live Server in VS Code).*

---

## Key Findings

*   **High Risk Hours:** Fatal accidents cluster significantly during **Nighttime (11 PM - 3 AM)**.
*   **Hotspots:** 6 specific geographic clusters identified via K-Means.
*   **Prediction Limits:** Predicting "Fatal" accidents remains challenging (F1-Score ~9.5%) due to the rarity of the event class, despite advanced resampling techniques.
