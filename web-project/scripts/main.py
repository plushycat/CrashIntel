import os
import json
import pandas as pd
import numpy as np
from pymongo import MongoClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from typing import Optional, List, Dict

# --- 1. INITIALIZE APP ---
app = FastAPI()

# --- 2. SECURITY (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all HTML files to access this API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. GLOBAL VARIABLES ---
model = None
encoders = {}
dataset = pd.DataFrame()


# --- 4. SMART DATA LOADING ---
def load_and_train():
    global dataset, model, encoders

    # B. LOAD DATA
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27018/")
    db = client["crash_db"]
    collection = db["crash_records"]

    print("📂 Connecting to Local MongoDB...")

    # Fetch data (exclude _id)
    data = list(collection.find({}, {"_id": 0}))

    if not data:
        raise Exception("MongoDB collection 'crash_records' is empty!")

    df = pd.DataFrame(data)
    dataset = df.copy()
    print(f"✅ Dataset loaded from MongoDB! ({len(df)} records)")

    # C. TRAIN MODEL (For Predictive RA)
    print("🤖 Training Prediction Model...")

    # Select features
    features = ["Location", "Vehicle_Type", "Weather_Condition"]
    target = "Accident_Severity"

    # Drop rows with missing values in these columns to prevent errors
    df_clean = df.dropna(subset=features + [target]).copy()

    # Encode text to numbers (e.g., "Car" -> 1)
    for col in features:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        encoders[col] = le

    # Train Random Forest
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(df_clean[features], df_clean[target])
    print("✅ AI Model Ready!")


# Run setup immediately on startup
load_and_train()


# --- 5. HELPER FUNCTIONS ---
def clean_nans(data_list):
    """Converts NaN values to None so JSON doesn't break."""
    for record in data_list:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    return data_list


# --- 6. API ENDPOINTS ---


@app.get("/")
def home():
    """Simple check to see if server is online."""
    status = "Online" if not dataset.empty else "Online (No Data)"
    return {"status": status, "records": len(dataset)}


@app.get("/search")
def search_data(
    location: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    weather: Optional[str] = None,
):
    """
    Filters data for the Dashboard 'Search' tab.
    """
    if dataset.empty:
        return []

    results = dataset.copy()

    # Apply filters if provided
    if location and location != "All Locations":
        results = results[
            results["Location"].astype(str).str.lower() == location.lower()
        ]

    if vehicle_type and vehicle_type != "All Vehicles":
        results = results[
            results["Vehicle_Type"].astype(str).str.lower() == vehicle_type.lower()
        ]

    if weather and weather != "All Weathers":
        results = results[
            results["Weather_Condition"].astype(str).str.lower() == weather.lower()
        ]

    # Limit to 100 rows for speed
    return clean_nans(results.head(100).to_dict(orient="records"))


@app.get("/predict")
def predict_severity(location: str, vehicle_type: str, weather: str):
    """
    Predicts accident severity for the 'Predictive RA' page.
    """
    if model is None:
        return {"error": "Model not trained."}

    try:
        # Encode inputs
        loc_code = encoders["Location"].transform([location])[0]
        veh_code = encoders["Vehicle_Type"].transform([vehicle_type])[0]
        wea_code = encoders["Weather_Condition"].transform([weather])[0]

        # Predict
        prediction = model.predict([[loc_code, veh_code, wea_code]])[0]

        # Calculate Confidence
        probs = model.predict_proba([[loc_code, veh_code, wea_code]])[0]
        confidence = round(np.max(probs) * 100, 1)

        return {
            "prediction": prediction,
            "confidence": f"{confidence}%",
            "details": f"High probability of {prediction} for {vehicle_type} in {location}.",
        }
    except Exception as e:
        # This handles new values (e.g., a Location not in the training data)
        return {"error": "Unknown input value. Try options from the dropdowns."}


@app.get("/analyze/temporal")
def analyze_temporal(granularity: str = "Hourly"):
    """
    Aggregates data for the 'Temporal' page.
    Returns counts by Hour or Day of Week.
    """
    if dataset.empty:
        return {"error": "No data"}

    data = dataset.copy()
    stats = {}

    try:
        if granularity == "Hourly":
            # Group by Hour of Day
            counts = data["Hour_of_Day"].value_counts().sort_index()
            stats = {
                "labels": [f"{h}:00" for h in counts.index],
                "values": counts.values.tolist(),
                "peak_label": f"{counts.idxmax()}:00",
                "peak_value": int(counts.max()),
            }

        elif granularity == "Daily":
            # Group by Day of Week (Sorting needs care to be Mon-Sun)
            order = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ]
            counts = data["Day_of_Week"].value_counts()
            # Reindex to ensure correct order
            counts = counts.reindex(order).fillna(0)

            stats = {
                "labels": counts.index.tolist(),
                "values": counts.values.tolist(),
                "peak_label": counts.idxmax(),
                "peak_value": int(counts.max()),
            }

        return stats

    except Exception as e:
        return {"error": str(e)}


@app.get("/api/phase3/faq")
def get_phase3_faq():
    """
    Returns all 30 analysis questions and insights from Phase 3 notebook
    for the Temporal Analysis FAQ page.
    """
    try:
        # Get the folder where THIS script (main.py) lives
        current_script_dir = os.path.dirname(os.path.abspath(__file__))

        # Path to the FAQ JSON file
        faq_path = os.path.join(
            current_script_dir,
            "..",
            "..",
            "Analysis",
            "scripts",
            "phase3_faq.json",
        )
        faq_path = os.path.normpath(faq_path)

        with open(faq_path, "r", encoding="utf-8") as f:
            faq_data = json.load(f)

        return faq_data

    except FileNotFoundError:
        return {"error": "FAQ data file not found. Run phase3_faq_extractor.py first."}
    except Exception as e:
        return {"error": str(e)}
