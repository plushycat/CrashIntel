"""
Phase 3 FAQ Extractor
Extracts the 30 analysis questions, insights, AND graphs from Phase 3.ipynb.
Saves data as JSON and extracts images to the web project assets folder.
"""

import json
import re
import os
import base64


def extract_phase3_faq():
    """Extract questions, insights, and images from Phase 3 notebook."""

    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    notebook_path = os.path.join(script_dir, "..", "Phase 3.ipynb")
    json_output_path = os.path.join(script_dir, "phase3_faq.json")

    # Image output directory (in web-project)
    img_output_dir = os.path.join(
        script_dir, "..", "..", "web-project", "src", "assets", "images", "faq"
    )

    # Create image directory if it doesn't exist
    if not os.path.exists(img_output_dir):
        os.makedirs(img_output_dir)
        print(f"📁 Created directory: {img_output_dir}")

    # Load the notebook
    try:
        with open(notebook_path, "r", encoding="utf-8") as f:
            notebook = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Notebook not found at {notebook_path}")
        return []

    cells = notebook["cells"]
    faq_items = []

    current_question = None
    current_insight = None
    current_images = []  # List of image filenames
    current_question_num = 0

    def save_faq_item():
        if current_question is not None:
            faq_items.append(
                {
                    "id": current_question_num,
                    "question": current_question,
                    "insight": current_insight or "Analysis pending.",
                    "images": current_images.copy(),
                }
            )

    for i, cell in enumerate(cells):
        source = cell.get("source", [])
        if isinstance(source, list):
            text = "".join(source)
        else:
            text = source

        # 1. Check for Question
        # Matches:
        # - **Question 30: Text** (Group 1='30', Group 3='Text')
        # - *Question 24: Text*   (Group 1='24', Group 3='Text')
        # - **19. Text**          (Group 2='19', Group 3='Text')
        # - ## Question 10: Text  (Group 1='10', Group 3='Text')
        regex = r"(?:(?:\*\*|\*|#+)\s*Question\s+(\d+)[:\.]|(?:\*\*)(\d+)\.)\s*(.+?)(?:(?:\*\*|\*)|$)"
        question_match = re.search(regex, text, re.IGNORECASE | re.DOTALL)

        if question_match:
            # Parse new number early
            q_num_str = question_match.group(1) or question_match.group(2)
            new_q_num = int(q_num_str)

            # Stop if we reset to Q1 after finding Q25+ (Phase 3B steps)
            if new_q_num == 1 and any(item["id"] >= 25 for item in faq_items):
                print(
                    f"   [Stop] Found Q1 after Q25+ (Cell {i}), assuming Phase 3B. Saving and stopping."
                )
                save_faq_item()  # Save the pending last question (e.g. Q30)
                current_question = None  # Prevent saving the 'new' Q1 at the end
                break

            # Save previous FAQ item
            save_faq_item()

            # Start new
            current_question_num = new_q_num
            current_question = question_match.group(3).strip()
            # Cleanup question text if it has trailing ** or *
            current_question = re.sub(r"(\*\*|\*)$", "", current_question).strip()

            current_insight = None
            current_images = []
            print(
                f"   [Cell {i}] Found Q{current_question_num}: {current_question.replace(chr(10), ' ')[:60]}..."
            )
            continue

        # Only process content if we are inside a question block
        if current_question:

            # 2. Check for Insight (Markdown)
            if cell["cell_type"] == "markdown":
                if any(
                    x in text
                    for x in [
                        "Insight",
                        "I found",
                        "I observed",
                        "### Answer",
                        "**Answer**",
                    ]
                ):
                    # Clean up insight text
                    cleaned_text = (
                        text.replace("Insight", "")
                        .replace("### Answer", "")
                        .replace("**Answer**", "")
                        .replace("\n\n", "\n")
                        .strip()
                    )
                    cleaned_text = re.sub(r"\*\*", "", cleaned_text)  # Remove bold
                    cleaned_text = re.sub(
                        r"^\s*[-_]+\s*$", "", cleaned_text, flags=re.MULTILINE
                    )  # Remove dividers

                    # Accumulate insight if spread across multiple markdown cells (or overwrite? usually one block)
                    # Let's overwrite/set if not set, effectively taking the last one or we could append.
                    # Usually the insight is a single block.
                    current_insight = cleaned_text.strip()

            # 3. Check for Images (Code Output)
            elif cell["cell_type"] == "code":
                outputs = cell.get("outputs", [])
                for output in outputs:
                    data = output.get("data", {})
                    # Check for PNG
                    if "image/png" in data:
                        img_data_b64 = data["image/png"]
                        img_filename = (
                            f"q{current_question_num}_chart_{len(current_images)+1}.png"
                        )
                        img_path = os.path.join(img_output_dir, img_filename)

                        try:
                            with open(img_path, "wb") as img_file:
                                img_file.write(base64.b64decode(img_data_b64))

                            # Add relative path for frontend usage
                            # Frontend is at src/, images at src/assets/images/faq
                            current_images.append(f"assets/images/faq/{img_filename}")
                            # print(f"   🖼️ Saved image: {img_filename}")
                        except Exception as e:
                            print(
                                f"   ⚠️ Error saving image for Q{current_question_num}: {e}"
                            )

    # Save last item if loop finished naturally
    if current_question:
        save_faq_item()

    # Save extracted data to JSON
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump({"faq": faq_items, "total": len(faq_items)}, f, indent=2)

    print(f"✅ Extracted {len(faq_items)} FAQ items to {json_output_path}")
    print(f"Total images saved in {img_output_dir}")

    return faq_items


if __name__ == "__main__":
    extract_phase3_faq()
