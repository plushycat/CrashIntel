import json
import os
import re


def update_markdown():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    analysis_dir = os.path.dirname(script_dir)

    files = [
        "Phase 1_mongo.ipynb",
        "Phase 2_mongo.ipynb",
        "Phase 3_mongo.ipynb",
        "Phase 4_mongo.ipynb",
    ]

    replacements = {
        "read_csv": "MongoDB query",
        "Load the dataset": "Load the dataset from MongoDB",
        "Loads the dataset": "Loads the dataset from MongoDB",
        "loading the csv": "loading from MongoDB",
        "read the csv": "read from existing MongoDB collection",
        "from the CSV": "from the Mongo database",
        "in the CSV": "in the database",
    }

    for filename in files:
        filepath = os.path.join(analysis_dir, filename)
        if not os.path.exists(filepath):
            continue

        print(f"Checking markdown in {filename}...")

        with open(filepath, "r", encoding="utf-8") as f:
            notebook = json.load(f)

        cells = notebook.get("cells", [])
        modified = False

        for cell in cells:
            if cell["cell_type"] == "markdown":
                source = cell.get("source", [])
                new_source = []
                cell_modified = False

                for line in source:
                    original_line = line
                    for old, new in replacements.items():
                        if old in line or old.lower() in line.lower():
                            # Simple string replacement (case insensitive if poss, but simple is safer)
                            # Let's just do direct replacement for now or regex
                            pattern = re.compile(re.escape(old), re.IGNORECASE)
                            line = pattern.sub(new, line)

                    if line != original_line:
                        cell_modified = True
                    new_source.append(line)

                if cell_modified:
                    cell["source"] = new_source
                    modified = True

        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(notebook, f, indent=1)
            print(f"  Updated markdown in {filename}")
        else:
            print(f"  No markdown updates needed for {filename}")


if __name__ == "__main__":
    update_markdown()
