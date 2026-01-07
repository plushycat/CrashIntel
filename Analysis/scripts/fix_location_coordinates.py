"""
Fix Location Coordinates Script
================================
Utility script to regenerate geo-accurate coordinates for any dataset.
Maps each Location name to its real-world bounding box in Bangalore.

Can be used standalone or imported as a module for other scripts.
"""

import pandas as pd
import numpy as np
from pymongo import MongoClient
import os

# Real-world bounding boxes for each location in Bangalore
LOCATION_BOUNDS = {
    "Koramangala": {"lat": (12.9279, 12.9459), "lon": (77.6149, 77.6323)},
    "Indiranagar": {"lat": (12.9698, 12.9858), "lon": (77.6354, 77.6544)},
    "Jayanagar": {"lat": (12.9211, 12.9461), "lon": (77.5731, 77.5961)},
    "HSR Layout": {"lat": (12.9066, 12.9266), "lon": (77.6297, 77.6567)},
    "Whitefield": {"lat": (12.9548, 12.9948), "lon": (77.7256, 77.7656)},
}


def generate_location_coords(location: str, seed: int = None) -> tuple:
    """
    Generate random coordinates within the real bounding box for a location.
    Uses seed for reproducibility if provided.
    """
    if location not in LOCATION_BOUNDS:
        return (12.9716, 77.5946)  # Bangalore center fallback

    bounds = LOCATION_BOUNDS[location]
    if seed is not None:
        np.random.seed(seed)

    lat = np.random.uniform(bounds["lat"][0], bounds["lat"][1])
    lon = np.random.uniform(bounds["lon"][0], bounds["lon"][1])
    return (round(lat, 6), round(lon, 6))


def fix_dataframe_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """Fix coordinates in a DataFrame by mapping Location to proper coords."""
    print(f"📍 Fixing coordinates for {len(df)} records...")

    new_lats = []
    new_lons = []

    for idx, row in df.iterrows():
        location = row.get("Location", "")
        seed = row.get("record_id", idx)
        if pd.isna(seed):
            seed = idx
        else:
            seed = (
                int(seed)
                if isinstance(seed, (int, float))
                else hash(str(seed)) % (2**31)
            )

        lat, lon = generate_location_coords(location, seed)
        new_lats.append(lat)
        new_lons.append(lon)

    df["Latitude"] = new_lats
    df["Longitude"] = new_lons
    return df


def fix_csv(csv_path: str = None):
    """Fix coordinates in a CSV file."""
    if csv_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, "..", "Datasets", "cleaned_for_phase_3.csv")

    csv_path = os.path.normpath(csv_path)
    print(f"📂 Loading: {csv_path}")

    df = pd.read_csv(csv_path)
    df = fix_dataframe_coordinates(df)
    df.to_csv(csv_path, index=False)

    print(f"💾 Saved: {csv_path}")
    return df


def fix_mongodb(collection_name: str = "crash_records"):
    """Fix coordinates in a MongoDB collection."""
    try:
        print(f"🔗 Connecting to MongoDB...")
        client = MongoClient(
            "mongodb://localhost:27018/", serverSelectionTimeoutMS=3000
        )
        client.admin.command("ping")

        db = client["crash_db"]
        collection = db[collection_name]
        count = collection.count_documents({})
        print(f"   Found {count} records in {collection_name}")

        if count == 0:
            print("   ⚠️ No records found, skipping...")
            return

        updated = 0
        for loc, bounds in LOCATION_BOUNDS.items():
            records = list(collection.find({"Location": loc}))
            for record in records:
                seed = hash(str(record["_id"])) % (2**31)
                np.random.seed(seed)
                new_lat = round(
                    np.random.uniform(bounds["lat"][0], bounds["lat"][1]), 6
                )
                new_lon = round(
                    np.random.uniform(bounds["lon"][0], bounds["lon"][1]), 6
                )
                collection.update_one(
                    {"_id": record["_id"]},
                    {"$set": {"Latitude": new_lat, "Longitude": new_lon}},
                )
                updated += 1
            print(f"   ✓ {loc}: {len(records)} records")

        print(f"✅ MongoDB updated! ({updated} total)")

    except Exception as e:
        print(f"⚠️ MongoDB error: {e}")


def main():
    print("=" * 60)
    print("🔧 Fix Location Coordinates")
    print("=" * 60)

    fix_csv()
    fix_mongodb()

    print("\n✅ Done! Restart server to see changes.")


if __name__ == "__main__":
    main()
