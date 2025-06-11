# # backend > ocs > insert_mongo_test.py

# from pymongo import MongoClient
# from datetime import datetime

# # 인증된 MongoDB 접속 URI
# client = MongoClient("mongodb://admin:secret123@localhost:27017/?authSource=admin")
# db = client["ocslog"]
# collection = db["logs"]

# logs = list(collection.find({}, {"_id": 0}))

# # 테스트용 데이터 삽입
# collection.insert_one({
#     "patient_id": "10004M",
#     "doctor_id": "DOC999",
#     "request_type": "LIS",
#     "detail": "CLI 없이 Python으로 삽입!",
#     "created_at": datetime.utcnow()
# })

# print(" MongoDB 데이터 삽입 완료")

# backend > ocs > insert_mongo_test.py

from pymongo import MongoClient
from datetime import datetime, timezone

# MongoDB 연결 설정
mongo_host = "35.255.63.41"
mongo_port = 27017
mongo_user = "ocs_user"
mongo_pass = "ocs_pass"
mongo_db_name = "ocslog"
mongo_collection_name = "logs"  # 원하는 컬렉션 이름

# MongoDB 연결 (Authentication 포함)
client = MongoClient(f"mongodb://{mongo_user}:{mongo_pass}@{mongo_host}:{mongo_port}/{mongo_db_name}")

# DB 및 컬렉션 선택
db = client[mongo_db_name]
collection = db[mongo_collection_name]

# 테스트용 로그 데이터 삽입
log_data = {
    "patient_id": "P001",
    "doctor_id": "D001",
    "request_type": "LAB",
    "request_detail": "혈액 검사 요청",
    "timestamp": datetime.now(timezone.utc)
}

# 삽입
result = collection.insert_one(log_data)

# 결과 확인
print("Inserted ID:", result.inserted_id)

