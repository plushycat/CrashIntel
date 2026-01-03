import json
import os
import re


def refine_notebooks():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    analysis_dir = os.path.dirname(script_dir)

    files = [
        "Phase 1_mongo.ipynb",
        "Phase 2_mongo.ipynb",
        "Phase 3_mongo.ipynb",
        "Phase 4_mongo.ipynb",
    ]

    # Professional Code Block
    mongo_code_block = [
        "# --- DATA LOADING ---\n",
        "# We are loading the dataset from the local MongoDB instance within the repository.\n",
        "# This ensures consistency and avoids dependency on external CSV files.\n",
        "\n",
        "from pymongo import MongoClient\n",
        "import pandas as pd\n",
        "\n",
        "# Connect to the local MongoDB instance running on port 27018\n",
        "client = MongoClient('mongodb://localhost:27018/')\n",
        "db = client['crash_db']\n",
        "collection = db['crash_records']\n",
        "\n",
        "# Fetch all records, excluding the internal MongoDB '_id' field\n",
        "data = list(collection.find({}, {'_id': 0}))\n",
        "\n",
        "# Convert to Pandas DataFrame for analysis\n",
        "df = pd.DataFrame(data)\n",
        "\n",
        'print(f"✅ Successfully loaded {len(df)} records from the local MongoDB instance.")\n',
    ]

    for filename in files:
        filepath = os.path.join(analysis_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename} (not found)")
            continue

        print(f"Refining {filename}...")

        with open(filepath, "r", encoding="utf-8") as f:
            notebook = json.load(f)

        cells = notebook.get("cells", [])
        modified = False

        for cell in cells:
            if cell["cell_type"] == "code":
                source = cell.get("source", [])
                source_text = "".join(source)

                # Check for CSV loading (Phase 1 might still have it)
                has_csv = (
                    "read_csv" in source_text
                    or "integrated_traffic_dataset (1).csv" in source_text
                    or "cleaned_for_phase_3.csv" in source_text
                )

                # Check for previous update (to refine it)
                has_mongo = "MongoClient" in source_text

                if has_csv and not has_mongo:
                    # Case 1: Needs fresh update (Phase 1)
                    print(f"  Updating {filename} to use MongoDB (was CSV)...")
                    # Replace entire content of this cell with our block?
                    # Or keep imports if they are valid. Phase 1 has 'import pandas as pd' inside.
                    # Our block includes imports. Let's fully replace the logic.

                    # If the cell has other logic (like duplicate checking in Phase 1), preserve it?
                    # Phase 1 cell has: load -> duplicate check -> save excel.
                    # We should only replace the loading part.

                    new_source = []
                    # We inject our block at the top (after existing imports if any, or just at top)
                    # Phase 1 has imports at top.

                    # Better strategy: Replace the specific lines that load CSV, keep the rest.

                    in_csv_block = False
                    start_msg_printed = False

                    for line in source:
                        if "import pandas" in line:
                            # We'll rely on our block's imports or keep them.
                            # If we duplicate imports it's fine.
                            continue  # Skip existing pandas import to avoid dupes if we add ours

                        if "read_csv" in line or "file_name =" in line:
                            if not start_msg_printed:
                                new_source.extend(mongo_code_block)
                                start_msg_printed = True
                            continue  # Skip the old CSV lines

                        new_source.append(line)

                    cell["source"] = new_source
                    modified = True

                elif has_mongo:
                    # Case 2: Already updated, but needs refinement (remove old comments, insert new block)
                    print(f"  Refining {filename} comments...")

                    # We will regenerate the cell source.
                    # We look for where we injected the code and replace that chunk with the new professional chunk.
                    # And remove any lines that contain "# [REPLACED]" or the commented out csv lines.

                    new_source = []
                    block_added = False

                    for line in source:
                        # Remove artifact lines
                        if "# [REPLACED]" in line:
                            continue
                        if "[UPDATED] Load data" in line:
                            continue  # Skip old header

                        # Detect if this is part of the old mongo block we added
                        if (
                            "client = " in line
                            or "db =" in line
                            or "collection =" in line
                            or "mongodb://localhost:27018" in line
                        ):
                            if not block_added:
                                new_source.extend(mongo_code_block)
                                block_added = True
                            continue  # Skip old mongo lines

                        # specific cleanup for imports we added
                        if (
                            "from pymongo import MongoClient" in line
                            or "import pandas as pd" in line
                        ):
                            if not block_added:  # Add block triggers on imports too
                                new_source.extend(mongo_code_block)
                                block_added = True
                            continue

                        # clean up other generated lines
                        if (
                            "Exclude _id field" in line
                            or "Loading into DataFrame" in line
                            or "print(f'✅ Loaded" in line
                        ):
                            continue

                        # Keep other lines (the rest of the notebook logic)
                        new_source.append(line)

                    cell["source"] = new_source
                    modified = True

        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(notebook, f, indent=1)
            print(f"  Saved refined notebook: {filename}")
        else:
            print(f"  No changes needed for {filename}")


if __name__ == "__main__":
    refine_notebooks()
