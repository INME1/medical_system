# mongo_utils.py
from pymongo import MongoClient
from datetime import datetime

def insert_log_to_mongo(patient_id, doctor_id, request_type, request_detail):
    try:
        client = MongoClient(
            "mongodb://ocs_user:ocs_pass@localhost:27017/?authSource=ocslog"
        )
        db = client["ocslog"]
        logs_collection = db["logs"]

        log_data = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "request_type": request_type,
            "request_detail": request_detail,
            "timestamp": datetime.utcnow()
        }

        result = logs_collection.insert_one(log_data)
        print("Inserted ID:", result.inserted_id)
        return True
    except Exception as e:
        print("MongoDB Insert Error:", e)
        return False
