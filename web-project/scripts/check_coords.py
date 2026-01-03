import pandas as pd
import os

try:
    path = r"c:\Users\Asus\OneDrive\Documents\GitHub\CrashIntel\Analysis\Datasets\cleaned_for_phase_3.csv"
    if not os.path.exists(path):
        print("File not found")
    else:
        df = pd.read_csv(path)
        print(f"Total Rows: {len(df)}")
        valid_df = df.dropna(subset=["Latitude", "Longitude"])
        print(f"Valid Coords: {len(valid_df)}")
except Exception as e:
    print("Error:", e)
