from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Optional

# 1. Initialize the App
app = FastAPI()

# 2. Setup CORS (Security)
# This allows your HTML/JS frontend to communicate with this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin (e.g., your local HTML file)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# 3. Load the Dataset
# We load this ONCE when the server starts to make searches fast
try:
    df = pd.read_csv(
        r"C:\Users\Asus\OneDrive\Documents\GitHub\CrashIntel\Analysis\Datasets\cleaned_for_phase_3.csv"
    )
    print("✅ Dataset loaded successfully!")
except FileNotFoundError:
    print("❌ Error: 'cleaned_for_phase_3.csv' not found. Please check the file name.")
    df = pd.DataFrame()  # Create empty dataframe to prevent crash


# Helper: Clean up data for JSON (JSON cannot read 'NaN' values)
def clean_nans(data_list):
    for record in data_list:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    return data_list


# 4. The API Endpoint
@app.get("/search")
def search_data(
    location: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    weather: Optional[str] = None,
):
    """
    Filters the dataset based on the provided parameters.
    """
    # Start with the full dataset
    results = df.copy()

    # Apply Location Filter (Case-insensitive)
    if location and location != "":
        results = results[results["Location"].str.lower() == location.lower()]

    # Apply Vehicle Filter
    if vehicle_type and vehicle_type != "":
        results = results[results["Vehicle_Type"].str.lower() == vehicle_type.lower()]

    # Apply Weather Filter
    if weather and weather != "":
        results = results[results["Weather_Condition"].str.lower() == weather.lower()]

    # Limit results to 100 to avoid freezing the browser if too many match
    results = results.head(100)

    # Convert to Dictionary format for JSON response
    data = results.to_dict(orient="records")
    return clean_nans(data)


# 5. Root Endpoint (Just to check if it's running)
@app.get("/")
def home():
    return {"message": "Traffic Data API is running. Go to /search to filter data."}
