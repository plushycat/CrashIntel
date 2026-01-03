import json
import os
import re


def update_notebooks():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    analysis_dir = os.path.dirname(script_dir)

    files = [
        "Phase 1_mongo.ipynb",
        "Phase 2_mongo.ipynb",
        "Phase 3_mongo.ipynb",
        "Phase 4_mongo.ipynb",
    ]

    mongo_code_block = [
        "\n",
        "# [UPDATED] Load data from local MongoDB (Port 27018)\n",
        "from pymongo import MongoClient\n",
        "import pandas as pd\n",
        "\n",
        "client = MongoClient('mongodb://localhost:27018/')\n",
        "db = client['crash_db']\n",
        "collection = db['crash_records']\n",
        "\n",
        "# Exclude _id field and load to DataFrame\n",
        "data = list(collection.find({}, {'_id': 0}))\n",
        "df = pd.DataFrame(data)\n",
        "print(f'✅ Loaded {len(df)} records from MongoDB.')\n",
    ]

    for filename in files:
        filepath = os.path.join(analysis_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename} (not found)")
            continue

        print(f"Processing {filename}...")

        with open(filepath, "r", encoding="utf-8") as f:
            notebook = json.load(f)

        cells = notebook.get("cells", [])
        modified = False

        for cell in cells:
            if cell["cell_type"] == "code":
                source = cell.get("source", [])
                source_text = "".join(source)

                # Check for various CSV loading patterns or the filename
                if "cleaned_for_phase_3.csv" in source_text:
                    print(f"  Found CSV load in cell. replacing...")

                    new_source = []
                    for line in source:
                        if "read_csv" in line:
                            new_source.append(f"# {line.rstrip()} # [REPLACED]\n")
                        else:
                            new_source.append(line)

                    new_source.extend(mongo_code_block)

                    cell["source"] = new_source
                    modified = True

        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(notebook, f, indent=1)
            print(f"  Saved updates to {filename}")
        else:
            print(f"  No CSV loading code found to replace in {filename}")


if __name__ == "__main__":
    update_notebooks()
