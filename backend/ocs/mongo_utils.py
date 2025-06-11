# mongo_utils.py
from pymongo import MongoClient
from datetime import datetime
import os

# 환경 변수 또는 기본값
MONGO_URI        = os.getenv("MONGO_URI", "mongodb://ocs_user:ocs_pass@localhost:27017/?authSource=ocslog")
DB_NAME          = "ocslog"
COLLECTION_NAME  = "logs"

def insert_log_to_mongo(
    category,
    step,
    patient_uuid=None,
    patient_id=None,
    doctor_uuid=None,
    doctor_id=None,
    detail=None
):
    client = None
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        logs_collection = db[COLLECTION_NAME]
        
        log_data = {
            "category":      category,
            "step":          step,
            "patient_uuid":  patient_uuid,
            "patient_id":    patient_id,
            "doctor_uuid":   doctor_uuid,
            "doctor_id":     doctor_id,
            "detail":        detail,
            "timestamp":     datetime.utcnow()
        }

        result = logs_collection.insert_one(log_data)
        print(f"[Mongo] 로그 삽입 완료: {result.inserted_id}")
        return True
    
    except Exception as e:
        print(f"[Mongo] 로그 삽입 실패: {e}")
        return False

    finally:
        if client:
            client.close()
