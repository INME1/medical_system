# backend/ocs/test_insert_log.py

from mongo_utils import insert_log_to_mongo

# 테스트용 로그 데이터
success = insert_log_to_mongo(
    patient_id="P002",
    doctor_id="D002",
    request_type="X-RAY",
    request_detail="흉부 엑스레이 요청"
)

if success:
    print("✅ 로그가 MongoDB에 성공적으로 저장되었습니다.")
else:
    print("❌ 로그 저장 실패.")
