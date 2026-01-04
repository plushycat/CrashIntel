import json
import re
import os
import base64
from pymongo import MongoClient

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NOTEBOOK_PATH = os.path.join(BASE_DIR, "..", "Phase 3.ipynb")
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, "phase3_faq.json")
# Target directory for images: web-project/src/assets/images/analysis
IMAGE_OUTPUT_DIR = os.path.abspath(
    os.path.join(
        BASE_DIR, "..", "..", "web-project", "src", "assets", "images", "analysis"
    )
)


def extract_faqs_from_notebook(notebook_path):
    print(f"Reading notebook from: {notebook_path}")

    # Ensure image directory exists
    if not os.path.exists(IMAGE_OUTPUT_DIR):
        try:
            os.makedirs(IMAGE_OUTPUT_DIR)
            print(f"Created image directory: {IMAGE_OUTPUT_DIR}")
        except OSError as e:
            print(f"Error creating image directory: {e}")
            return []

    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    faqs = []
    current_q = None

    # Regex to capture "Question X: ..."
    # Support multiple formats:
    # 1. **Question 1:** or **Question 1:**
    # 2. **19.** or 19. (at start of line or following newline)
    q_pattern_1 = re.compile(r"\*\*Question\s*(\d+):(.+?)\*\*")
    q_pattern_2 = re.compile(r"(?:^|\n)(\d+)\.\s+(.+?)(?:\n|$)")
    q_pattern_3 = re.compile(r"\*\*(\d+)\.\s+(.+?)\*\*")

    for cell in nb["cells"]:
        # 1. Handle Markdown Cells (Headers & Insights)
        if cell["cell_type"] == "markdown":
            source = "".join(cell["source"]).strip()

            # Check for Question Header (Try strict first, then loose)
            match = q_pattern_1.search(source)
            if not match:
                match = q_pattern_3.search(source)  # **19. Question**
            if not match:
                # Be careful with "1. " as it might be a list.
                # But typically Question headers are top level.
                # Let's check if the number is > previous ID to avoid false positives on lists inside answers?
                # Or just check if it matches the expected next ID.
                # For now, let's just try to match "19. " style if it looks like a header.
                m = q_pattern_2.search(source)
                if m:
                    # heuristic: determine if it's really a question header
                    # Check if the text length is substantial or looks like a question
                    q_id = int(m.group(1))
                    # Only accept if it's the expected next number (Sequential check)
                    # This prevents matching "1. Section Name" after Question 30
                    if current_q and q_id == current_q["id"] + 1:
                        match = m
                    elif not current_q and q_id == 1:
                        match = m

            if match:
                q_id = int(match.group(1))

                # Double check monotonicity to strict avoid resets
                # (e.g. if regex 1 matched "Question 1" again at end)
                if current_q and q_id <= current_q["id"]:
                    continue

                # Save previous question if exists
                if current_q:
                    faqs.append(current_q)

                q_text = match.group(2).strip()

                current_q = {
                    "id": q_id,
                    "question": q_text,
                    "insight": "",
                    "images": [],
                }

                # Advanced split logic for pattern 2 (inline headers)
                if match == q_pattern_2.search(source):
                    parts = q_pattern_2.split(source)
                    # 0:pre-text, 1:id, 2:text, 3:post-text

                    if len(parts) >= 3 and len(faqs) > 0:
                        # Append text before this header to PREVIOUS question
                        if len(parts[0].strip()) > 0:
                            faqs[-1]["insight"] += parts[0].strip() + "\n\n"

                    q_text = parts[2].strip()
                    initial_insight = parts[3].strip() if len(parts) > 3 else ""
                    current_q["question"] = q_text
                    current_q["insight"] = initial_insight

                continue
            # If we are inside a question, append text to insight
            if current_q:
                clean_text = source.replace("**", "").replace("#", "").strip()
                if clean_text:
                    current_q["insight"] += clean_text + "\n\n"

        # 2. Handle Code Cells (Images/Plots)
        elif cell["cell_type"] == "code" and current_q:
            outputs = cell.get("outputs", [])
            for output in outputs:
                # Check for standard display_data or execute_result
                data = output.get("data", {})
                if "image/png" in data:
                    try:
                        # Extract base64 encoded string
                        img_b64 = data["image/png"]
                        img_data = base64.b64decode(img_b64)

                        # Generate filename: q{id}_plot_{index}.png
                        img_index = len(current_q["images"]) + 1
                        img_filename = f"q{current_q['id']}_plot_{img_index}.png"
                        img_path = os.path.join(IMAGE_OUTPUT_DIR, img_filename)

                        # Save Image
                        with open(img_path, "wb") as img_file:
                            img_file.write(img_data)

                        # Add relative path to question object (for frontend)
                        # Frontend is in src/, so assets/images/analysis/ is correct
                        relative_path = f"assets/images/analysis/{img_filename}"
                        current_q["images"].append(relative_path)
                        print(f"Saved image: {img_filename}")

                    except Exception as e:
                        print(f"Failed to save image for Q{current_q['id']}: {e}")

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
    # Remove _id fields from mongo objects before saving to JSON
    # (Mongo adds _id automatically, but it's not JSON serializable by default)
    json_faqs = []
    for faq in faqs:
        faq_copy = faq.copy()
        if "_id" in faq_copy:
            del faq_copy["_id"]
        json_faqs.append(faq_copy)

    data = {"total": len(json_faqs), "faq": json_faqs}
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
