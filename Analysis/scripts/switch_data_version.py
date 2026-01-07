"""
Switch Data Version Script
==========================
Switches the active dataset between ORIGINAL and GEOFIXED versions.
Used by switch_data_version.bat
"""

import sys
import os
import shutil
from pymongo import MongoClient


def switch_csv(version: str):
    """Switch the active CSV to the specified version."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(script_dir, "..", "Datasets")

    csv_original = os.path.join(datasets_dir, "cleaned_for_phase_3_original.csv")
    csv_geofixed = os.path.join(datasets_dir, "cleaned_for_phase_3_geofixed.csv")
    csv_active = os.path.join(datasets_dir, "cleaned_for_phase_3.csv")

    source = csv_original if version == "original" else csv_geofixed

    if not os.path.exists(source):
        print(f"❌ Source file not found: {source}")
        print("   Run setup_data_versions.py first!")
        return False

    shutil.copy(source, csv_active)
    print(f"✓ CSV switched to {version.upper()}")
    return True


def switch_mongodb(version: str):
    """Switch the active MongoDB collection to the specified version."""
    try:
        client = MongoClient(
            "mongodb://localhost:27018/", serverSelectionTimeoutMS=3000
        )
        client.admin.command("ping")
        db = client["crash_db"]

        source_name = f"crash_records_{version}"
        source_col = db[source_name]
        active_col = db["crash_records"]

        if source_col.count_documents({}) == 0:
            print(f"❌ Source collection '{source_name}' is empty!")
            print("   Run setup_data_versions.py first!")
            return False

        # Clear active and copy from source
        active_col.drop()

        # Copy all documents
        docs = list(source_col.find({}, {"_id": 0}))
        if docs:
            active_col.insert_many(docs)

        print(f"✓ MongoDB switched to {version.upper()} ({len(docs)} records)")
        return True

    except Exception as e:
        print(f"⚠️ MongoDB switch failed: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python switch_data_version.py <original|geofixed>")
        sys.exit(1)

    version = sys.argv[1].lower()
    if version not in ["original", "geofixed"]:
        print(f"❌ Invalid version: {version}")
        print("   Use 'original' or 'geofixed'")
        sys.exit(1)

    print(f"\n🔄 Switching to {version.upper()} version...")
    print("=" * 50)

    csv_ok = switch_csv(version)
    mongo_ok = switch_mongodb(version)

    print("=" * 50)
    if csv_ok or mongo_ok:
        print(f"✅ Switched to {version.upper()} version!")
        print("\n⚠️ IMPORTANT: Restart the server to apply changes!")
    else:
        print("❌ Switch failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
