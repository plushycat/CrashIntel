import json
import re
import os
from pymongo import MongoClient

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NOTEBOOK_PATH = os.path.join(BASE_DIR, "..", "Phase 3.ipynb")
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, "phase3_faq.json")


def extract_faqs_from_notebook(notebook_path):
    print(f"Reading notebook from: {notebook_path}")
    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    faqs = []
    current_q = None

    # Regex to capture "Question X: ..."
    # Handles variations like "**Question 1:**" or "**Question 1:**"
    q_pattern = re.compile(r"\*\*Question\s*(\d+):(.+?)\*\*")

    for cell in nb["cells"]:
        if cell["cell_type"] == "markdown":
            source = "".join(cell["source"]).strip()

            # Check for Question Header
            match = q_pattern.search(source)
            if match:
                # Save previous question if exists
                if current_q:
                    faqs.append(current_q)

                q_id = int(match.group(1))
                q_text = match.group(2).strip()

                current_q = {
                    "id": q_id,
                    "question": q_text,
                    "insight": "",
                    "images": [],
                }
                continue

            # If we are inside a question, append text to insight
            # Heuristic: If it doesn't look like a header or new section
            if current_q:
                # Basic cleaning of markdown
                clean_text = source.replace("**", "").replace("#", "").strip()
                if clean_text:
                    current_q["insight"] += clean_text + "\n\n"

    # Append the last one
    if current_q:
        faqs.append(current_q)

    print(f"Extracted {len(faqs)} questions.")
    return faqs


def save_to_mongo(faqs):
    print("Connecting to MongoDB...")
    try:
        client = MongoClient(
            "mongodb://localhost:27018/", serverSelectionTimeoutMS=3000
        )
        db = client["crash_db"]
        collection = db["phase3_faq"]

        # Clear existing
        collection.delete_many({})

        # Insert new
        if faqs:
            collection.insert_many(faqs)
            print(
                f"Successfully inserted {len(faqs)} records into MongoDB 'phase3_faq'."
            )
        else:
            print("No FAQs extracted to insert.")

    except Exception as e:
        print(f"MongoDB Error: {e}")


def save_to_json(faqs):
    data = {"total": len(faqs), "faq": faqs}
    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f"Saved JSON to: {JSON_OUTPUT_PATH}")


if __name__ == "__main__":
    if os.path.exists(NOTEBOOK_PATH):
        faqs = extract_faqs_from_notebook(NOTEBOOK_PATH)

        # 1. Update Mongo
        save_to_mongo(faqs)

        # 2. Update JSON (for backup/fallback)
        save_to_json(faqs)
    else:
        print(f"Error: Notebook not found at {NOTEBOOK_PATH}")
