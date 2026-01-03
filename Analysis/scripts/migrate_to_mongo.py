import os
import pandas as pd
from pymongo import MongoClient


def migrate_csv_to_mongo():
    # 1. Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "..", "Datasets", "cleaned_for_phase_3.csv")
    csv_path = os.path.normpath(csv_path)

    print(f"Reading CSV from: {csv_path}")

    # 2. Read CSV
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} rows from CSV.")
    except FileNotFoundError:
        print("Error: CSV file not found.")
        return
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # 3. Connect to MongoDB
    # Assuming local instance at default port
    mongo_uri = "mongodb://localhost:27018/"
    db_name = "crash_db"
    collection_name = "crash_records"

    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        # Check connection
        client.admin.command("ping")
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("Make sure your local MongoDB server is running.")
        return

    # 4. Prepare data
    # Convert DataFrame to list of dictionaries (records)
    # NaN values can be an issue for JSON/Mongo, but PyMongo handles valid types.
    # Pandas usually leaves NaNs as float('nan'). Mongo can handle nulls but strict JSON cannot.
    # It's safer to fillna or let PyMongo handle it (it might reject NaN).
    # Let's replace NaN with None for safety.
    df_clean = df.where(pd.notnull(df), None)

    records = df_clean.to_dict(orient="records")

    # 5. Insert into MongoDB
    # Option: clear existing data to avoid duplicates on re-run
    delete_result = collection.delete_many({})
    print(f"Cleared {delete_result.deleted_count} existing documents.")

    if records:
        insert_result = collection.insert_many(records)
        print(f"Successfully inserted {len(insert_result.inserted_ids)} documents.")
    else:
        print("No records to insert.")

    # 6. Verification
    count = collection.count_documents({})
    print(f"Verification: Collection '{collection_name}' now has {count} documents.")


if __name__ == "__main__":
    migrate_csv_to_mongo()
