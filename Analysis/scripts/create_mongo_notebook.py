import json
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_NB = os.path.join(BASE_DIR, "..", "Phase 3.ipynb")
TARGET_NB = os.path.join(BASE_DIR, "..", "Phase 3_mongo.ipynb")

# New MongoDB Loading Code
MONGO_CODE = [
    "# --- DATA LOADING ---\\n",
    "# We are loading the dataset from the local MongoDB instance within the repository.\\n",
    "# This ensures consistency and avoids dependency on external CSV files.\\n",
    "\\n",
    "from pymongo import MongoClient\\n",
    "import pandas as pd\\n",
    "import numpy as np\\n",
    "import matplotlib.pyplot as plt\\n",
    "import seaborn as sns\\n",
    "\\n",
    "# Connect to the local MongoDB instance running on port 27018\\n",
    "client = MongoClient('mongodb://localhost:27018/')\\n",
    "db = client['crash_db']\\n",
    "collection = db['crash_records']\\n",
    "\\n",
    "# Fetch all records, excluding the internal MongoDB '_id' field\\n",
    "data = list(collection.find({}, {'_id': 0}))\\n",
    "\\n",
    "# Convert to Pandas DataFrame for analysis\\n",
    "df = pd.DataFrame(data)\\n",
    "\\n",
    'print(f"✅ Successfully loaded {len(df)} records from the local MongoDB instance.")\\n',
    "\\n",
    "# Set visual style\\n",
    'sns.set_theme(style="whitegrid")',
]


def convert_notebook():
    if not os.path.exists(SOURCE_NB):
        print(f"Error: Source notebook not found at {SOURCE_NB}")
        return

    print(f"Reading {SOURCE_NB}...")
    with open(SOURCE_NB, "r", encoding="utf-8") as f:
        nb = json.load(f)

    # Find and replace the loading cell
    # We look for a code cell containing 'pd.read_csv'
    replaced = False
    for cell in nb["cells"]:
        if cell["cell_type"] == "code":
            source_str = "".join(cell["source"])
            if "pd.read_csv" in source_str and "cleaned_for_phase_3.csv" in source_str:
                print("Found CSV loading cell. Replacing with MongoDB code...")
                cell["source"] = MONGO_CODE
                # Clear outputs to avoid confusion (optional, but cleaner)
                cell["outputs"] = []
                cell["execution_count"] = None
                replaced = True
                break

    if not replaced:
        print(
            "Warning: Could not find the specific CSV loading cell. Checking for generic load..."
        )
        # Fallback: Replace the first code cell that imports pandas?
        # Or just append to top? Let's stick to the specific check first.
        # If the user renamed the csv or something, we might miss it.
        # Let's try to find ANY cell with pd.read_csv
        for cell in nb["cells"]:
            if cell["cell_type"] == "code":
                source_str = "".join(cell["source"])
                if "pd.read_csv" in source_str:
                    print("Found generic CSV loading cell. Replacing...")
                    cell["source"] = MONGO_CODE
                    cell["outputs"] = []
                    cell["execution_count"] = None
                    replaced = True
                    break

    if replaced:
        print(f"Writing to {TARGET_NB}...")
        with open(TARGET_NB, "w", encoding="utf-8") as f:
            json.dump(nb, f, indent=1)
        print("Done! Phase 3_mongo.ipynb created.")
    else:
        print("❌ Could not identify which cell to replace.")


if __name__ == "__main__":
    convert_notebook()
