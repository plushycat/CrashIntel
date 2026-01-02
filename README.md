# CrashIntel: Privacy-First Road Accident Analysis & Prediction System

## Project Overview

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

## Technologies Used

* **Frontend:** HTML5, CSS3 (Glassmorphism UI), JavaScript (ES6+)
* **Data Science:** Python, Pandas, NumPy, Scikit-learn, Imbalanced-learn
* **Machine Learning:** XGBoost, Random Forest, K-Means Clustering, Apriori
* **Visualization:** Matplotlib, Seaborn, Folium (Maps)

---

## How to Run (Demo Mode)

Since the project includes a client-side inference engine for demonstration purposes, no complex backend setup is required for the presentation.

1.  **Clone the Repository:**
    ```bash
    git clone
