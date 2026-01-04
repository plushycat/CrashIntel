# Analysis and Prediction of Road Traffic Accident Severity in Bangalore
# CrashIntel: Privacy-First Road Accident Analysis & Prediction System

## Project Overview

This project performs a comprehensive analysis of road accident data in Bangalore to identify high-risk patterns and hotspots. It evolves from raw data cleaning and exploratory analysis into a **modern, interactive web dashboard**. 

The solution combines advanced data science techniques (Spatial Clustering, Association Rule Mining) with a full-stack web application to visualize crash data dynamically.

---

## Project Phases
**CrashIntel** is a comprehensive system designed to analyze road accident data in Bengaluru, identify high-risk hotspots, and predict accident severity using Machine Learning.

What sets this project apart is its **Hybrid Privacy-First Architecture**. It is designed for law enforcement use, ensuring that sensitive accident data (e.g., casualty counts, exact locations) is processed locally on the user's machine, while the interface is delivered via the cloud.

---

## Key Features

### 1. Advanced Data Analysis (EDA)
* **Hotspot Detection:** Identifies 6 distinct accident clusters in Bengaluru using **K-Means Clustering**.
* **Root Cause Analysis:** Uses **Apriori Algorithm** (Association Rule Mining) to find hidden patterns (e.g., `{Motorcycle + Wet Road} -> {Serious Injury}`).
* **Temporal Analysis:** Visualizes accident trends by time of day, revealing a significant spike in fatal accidents between **11 PM - 3 AM**.

### 2. Privacy-First Predictive Engine
* **Local Processing:** The inference engine runs locally to prevent data leakage.
* **Severity Prediction:** Uses an **XGBoost** model to classify accidents as *Minor, Serious, or Fatal* based on speed, weather, and vehicle type.
* **Demo Mode:** Includes a specialized demonstration module allowing users to simulate various accident scenarios interactively.

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

## System Architecture

The project follows a **Split-Stack Architecture** to guarantee data sovereignty:

* **Cloud Layer (Blue Zone):**
    * **Frontend:** HTML/CSS/JS hosted on Vercel/GitHub Pages.
    * **Auth:** Supabase for identity management (optional/simulated).
* **Local Layer (Green Zone):**
    * **Inference:** JavaScript/Python logic running client-side.
    * **Data:** Sensitive inputs never leave the browser session.

---

## Project Structure

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1 & 2** | **Data Cleaning & Imputation:** Handling missing values using Decision Tree Regressors and engineering features like `Time_of_Day`. | Completed |
| **Phase 3** | **Pattern Discovery:** 30+ EDA questions answered, Spatial Clustering (K-Means), and Outlier Detection (LOF). | Completed |
| **Phase 4** | **Predictive Modeling:** Training XGBoost & Random Forest models. Addressing class imbalance using SMOTE/SMOTEENN. | Completed |
| **Phase 5** | **Web Dashboard:** Interactive dashboard for Risk Analysis and Temporal Trends. | Completed |

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
* **Frontend:** HTML5, CSS3 (Glassmorphism UI), JavaScript (ES6+)
* **Data Science:** Python, Pandas, NumPy, Scikit-learn, Imbalanced-learn
* **Machine Learning:** XGBoost, Random Forest, K-Means Clustering, Apriori
* **Visualization:** Matplotlib, Seaborn, Folium (Maps)

---

## How to Run (Demo Mode)

### Prerequisities
*   Python 3.9+
*   MongoDB (Optional - system will fallback to CSV if not running)

### Quick Start (Windows)
Double-click the `run_server.bat` file in the root directory to instantly start the backend server.

### 1. Backend Setup (Manual)
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
Since the project includes a client-side inference engine for demonstration purposes, no complex backend setup is required for the presentation.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/plushycat/CrashIntel.git](https://github.com/plushycat/CrashIntel.git)
    cd CrashIntel
    ```

2.  **Launch the Dashboard:**
    * Simply double-click **`predictive-ra.html`** (or `Final_Demo.html`) to open it in your web browser.
    * *Optional:* For the best visual experience, run via a local server:
        ```bash
        # If using Python
        python -m http.server 8000
        # Then open http://localhost:8000
        ```

3.  **Test the Prediction:**
    * Select a location (e.g., *Hebbal Flyover*).
    * Adjust the **Speed Slider**.
    * Click **"Analyze Risk"** to see the AI severity classification.

---

## Key Analytical Findings

* **Nighttime Risk:** Fatal accidents are disproportionately high between **11 PM and 3 AM** due to lower traffic density allowing for higher speeds.
* **High-Risk Profiles:**
    * **Speed:** Impact speeds >80 km/h have a near-exponential correlation with fatality risk.
    * **Vulnerability:** Two-wheelers account for the highest percentage of severe injuries in wet conditions.
* **Hotspots:** Specific junctions (e.g., Silk Board, K.R. Puram) show cluster patterns distinct from highway accidents (NICE Road).

---

## Future Scope

* Integration of real-time traffic API data (Google Maps/Mapbox).
* Deployment of the Python FastAPI backend for centralized model retraining.
* Expansion of the dataset to include granular features like "Seatbelt Usage" and "Driver Fatigue Levels."

---

