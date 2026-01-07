"""
Data Version Setup Script
=========================
Creates and manages two versions of the dataset:
1. ORIGINAL - Random coordinates (as originally generated)
2. GEOFIXED - Geo-accurate coordinates (clustered by location)

This script sets up both CSV files and MongoDB collections.
"""

import pandas as pd
import numpy as np
from pymongo import MongoClient
import os
import shutil

# Real-world bounding boxes for Bangalore locations
LOCATION_BOUNDS = {
    "Koramangala": {"lat": (12.9279, 12.9459), "lon": (77.6149, 77.6323)},
    "Indiranagar": {"lat": (12.9698, 12.9858), "lon": (77.6354, 77.6544)},
    "Jayanagar": {"lat": (12.9211, 12.9461), "lon": (77.5731, 77.5961)},
    "HSR Layout": {"lat": (12.9066, 12.9266), "lon": (77.6297, 77.6567)},
    "Whitefield": {"lat": (12.9548, 12.9948), "lon": (77.7256, 77.7656)},
}


def generate_geofixed_coords(location: str, seed: int) -> tuple:
    """Generate coordinates within the real bounding box for a location."""
    if location not in LOCATION_BOUNDS:
        return (12.9716, 77.5946)

    bounds = LOCATION_BOUNDS[location]
    np.random.seed(seed)
    lat = np.random.uniform(bounds["lat"][0], bounds["lat"][1])
    lon = np.random.uniform(bounds["lon"][0], bounds["lon"][1])
    return (round(lat, 6), round(lon, 6))


def setup_csv_versions():
    """Create both CSV versions."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(script_dir, "..", "Datasets")

    original_source = os.path.join(datasets_dir, "integrated_traffic_dataset (1).csv")
    csv_original = os.path.join(datasets_dir, "cleaned_for_phase_3_original.csv")
    csv_geofixed = os.path.join(datasets_dir, "cleaned_for_phase_3_geofixed.csv")
    csv_active = os.path.join(datasets_dir, "cleaned_for_phase_3.csv")

    print("=" * 60)
    print("📁 SETTING UP CSV VERSIONS")
    print("=" * 60)

    # Load the current active CSV (which has the processing from Phase 2)
    if os.path.exists(csv_active):
        df_active = pd.read_csv(csv_active)
        print(f"   Loaded active CSV: {len(df_active)} records")
    else:
        # Fall back to original source
        df_active = pd.read_csv(original_source)
        print(f"   Loaded from source: {len(df_active)} records")

    # Check if we need to restore original coords from source
    df_source = pd.read_csv(original_source)

    # Create ORIGINAL version (with random coords from source)
    print("\n1️⃣ Creating ORIGINAL version (random coords)...")
    df_original = df_active.copy()
    # Restore original Latitude/Longitude from source
    if "Latitude" in df_source.columns and "Longitude" in df_source.columns:
        # Match by record_id if available
        if "record_id" in df_original.columns and "record_id" in df_source.columns:
            coord_map = df_source.set_index("record_id")[
                ["Latitude", "Longitude"]
            ].to_dict("index")
            for idx, row in df_original.iterrows():
                rid = row.get("record_id")
                if rid in coord_map:
                    df_original.at[idx, "Latitude"] = coord_map[rid]["Latitude"]
                    df_original.at[idx, "Longitude"] = coord_map[rid]["Longitude"]
        else:
            # Direct copy by index
            df_original["Latitude"] = df_source["Latitude"].values[: len(df_original)]
            df_original["Longitude"] = df_source["Longitude"].values[: len(df_original)]

    df_original.to_csv(csv_original, index=False)
    print(f"   ✓ Saved: {csv_original}")

    # Create GEOFIXED version
    print("\n2️⃣ Creating GEOFIXED version (clustered by location)...")
    df_geofixed = df_active.copy()
    for idx, row in df_geofixed.iterrows():
        location = row.get("Location", "")
        seed = (
            int(row.get("record_id", idx)) if not pd.isna(row.get("record_id")) else idx
        )
        lat, lon = generate_geofixed_coords(location, seed)
        df_geofixed.at[idx, "Latitude"] = lat
        df_geofixed.at[idx, "Longitude"] = lon

    df_geofixed.to_csv(csv_geofixed, index=False)
    print(f"   ✓ Saved: {csv_geofixed}")

    print("\n✅ CSV versions created!")
    return csv_original, csv_geofixed, csv_active


def setup_mongodb_versions():
    """Create both MongoDB collection versions."""
    print("\n" + "=" * 60)
    print("🗄️ SETTING UP MONGODB VERSIONS")
    print("=" * 60)

    try:
        client = MongoClient(
            "mongodb://localhost:27018/", serverSelectionTimeoutMS=3000
        )
        client.admin.command("ping")
        db = client["crash_db"]

        # Get current data
        current_col = db["crash_records"]
        current_count = current_col.count_documents({})
        print(f"   Current crash_records: {current_count} documents")

        if current_count == 0:
            print("   ⚠️ No data in MongoDB, loading from CSV...")
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(
                script_dir, "..", "Datasets", "integrated_traffic_dataset (1).csv"
            )
            df = pd.read_csv(csv_path)
            df = df.where(pd.notnull(df), None)
            records = df.to_dict(orient="records")
            current_col.insert_many(records)
            current_count = current_col.count_documents({})
            print(f"   Loaded {current_count} records from CSV")

        # 1. Create ORIGINAL collection (with random coords from source)
        print("\n1️⃣ Creating crash_records_original...")
        original_col = db["crash_records_original"]
        original_col.drop()  # Clear if exists

        # Load from source CSV
        script_dir = os.path.dirname(os.path.abspath(__file__))
        source_csv = os.path.join(
            script_dir, "..", "Datasets", "integrated_traffic_dataset (1).csv"
        )
        df_source = pd.read_csv(source_csv)
        df_source = df_source.where(pd.notnull(df_source), None)

        # Copy current documents but restore original coords
        all_docs = list(current_col.find({}, {"_id": 0}))
        source_coords = {
            r.get("record_id"): (r.get("Latitude"), r.get("Longitude"))
            for r in df_source.to_dict(orient="records")
            if r.get("record_id")
        }

        for doc in all_docs:
            rid = doc.get("record_id")
            if rid in source_coords:
                doc["Latitude"], doc["Longitude"] = source_coords[rid]

        if all_docs:
            original_col.insert_many(all_docs)
        print(f"   ✓ Created with {original_col.count_documents({})} documents")

        # 2. Create GEOFIXED collection
        print("\n2️⃣ Creating crash_records_geofixed...")
        geofixed_col = db["crash_records_geofixed"]
        geofixed_col.drop()

        all_docs = list(current_col.find({}, {"_id": 0}))
        for i, doc in enumerate(all_docs):
            location = doc.get("Location", "")
            seed = hash(str(doc.get("record_id", i))) % (2**31)
            if location in LOCATION_BOUNDS:
                bounds = LOCATION_BOUNDS[location]
                np.random.seed(seed)
                doc["Latitude"] = round(
                    np.random.uniform(bounds["lat"][0], bounds["lat"][1]), 6
                )
                doc["Longitude"] = round(
                    np.random.uniform(bounds["lon"][0], bounds["lon"][1]), 6
                )

        if all_docs:
            geofixed_col.insert_many(all_docs)
        print(f"   ✓ Created with {geofixed_col.count_documents({})} documents")

        print("\n✅ MongoDB versions created!")
        print("   Collections: crash_records_original, crash_records_geofixed")

    except Exception as e:
        print(f"⚠️ MongoDB setup failed: {e}")
        print("   (CSV versions were still created)")


def main():
    print("\n" + "=" * 60)
    print("🔧 DATA VERSION SETUP")
    print("=" * 60)
    print("\nThis will create versioned copies of your data:")
    print("  • CSV: cleaned_for_phase_3_original.csv")
    print("  • CSV: cleaned_for_phase_3_geofixed.csv")
    print("  • MongoDB: crash_records_original")
    print("  • MongoDB: crash_records_geofixed")
    print()

    setup_csv_versions()
    setup_mongodb_versions()

    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print("\nUse 'switch_data_version.bat' to switch between versions.")
    print()


if __name__ == "__main__":
    main()
