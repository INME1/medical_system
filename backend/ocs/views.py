# backend > ocs > views.py

# backend/ocs/views.py

import json
import requests
from requests.auth import HTTPBasicAuth
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
from datetime import datetime
from pymongo import MongoClient
from .mongo_utils import MONGO_URI, DB_NAME, COLLECTION_NAME
from .models import OCSLog
from .serializers import OCSLogSerializer
from openmrs_models.models import Patient, PatientIdentifier

# 🔹 클래스 기반: OCSLog만 조회
class OCSLogListAPIView(ListAPIView):
    serializer_class = OCSLogSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return OCSLog.objects.filter(patient_id=patient_id).order_by('-created_at')
        return OCSLog.objects.all().order_by('-created_at')

# 🔹 POST: OCSLog 저장용
@api_view(['POST'])
def create_log_view(request):
    try:
        data = request.data
        category     = data.get('category', 'LIS')
        step         = data.get('step', '')
        patient_uuid = data.get('patient_uuid')
        patient_id   = data.get('patient_id')
        doctor_uuid  = data.get('doctor_uuid')
        doctor_id    = data.get('doctor_id')
        detail       = data.get('detail', {})

        if not all([patient_id, doctor_id, step]):
            return Response({"error": "필수 필드가 누락되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

        log = OCSLog.objects.create(
            category     = category,
            step         = step,
            patient_uuid = patient_uuid,
            patient_id   = patient_id,
            doctor_uuid  = doctor_uuid,
            doctor_id    = doctor_id,
            detail       = detail,
        )
        return Response({"message": "로그 저장 완료", "log_id": log.id}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 🔹 GET: OCSLog 조회 + 필터
@api_view(['GET'])
def get_logs_view(request):
    try:
        patient_id     = request.GET.get('patient_id')
        doctor_id      = request.GET.get('doctor_id')
        step           = request.GET.get('step')
        start_date_str = request.GET.get('start_date')
        end_date_str   = request.GET.get('end_date')

        logs = OCSLog.objects.all()
        if patient_id:
            logs = logs.filter(patient_id=patient_id)
        if doctor_id:
            logs = logs.filter(doctor_id=doctor_id)
        if step:
            logs = logs.filter(step=step)
        if start_date_str:
            dt = parse_datetime(start_date_str)
            if dt:
                logs = logs.filter(created_at__gte=make_aware(dt))
        if end_date_str:
            dt = parse_datetime(end_date_str)
            if dt:
                logs = logs.filter(created_at__lte=make_aware(dt))

        logs = logs.order_by('-created_at')
        serializer = OCSLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 🔹 GET: LIS + Mongo 로그 통합 조회
# backend/ocs/views.py
from django.conf import settings

@api_view(['GET'])
def combined_log_view(request):
    """
    GET /api/logs/combined/
    MariaDB의 OCSLog와 MongoDB logs 컬렉션을 통합하여 반환합니다.
    MongoDB 인증 실패 시에도 빈 Mongo 로그를 무시하고 200 OK 응답을 보냅니다.
    """
    # 1) OpenMRS 환자 이름 매핑
    patient_name_map = {}
    try:
        for p in Patient.objects.select_related('patient_id').all():
            person = p.patient_id
            uuid = getattr(person, 'uuid', None)
            name_obj = p.get_active_name()
            full_name = name_obj.get_full_name() if name_obj else "N/A"
            ident = PatientIdentifier.objects.filter(patient=p, voided=False, preferred=True).first() \
                    or PatientIdentifier.objects.filter(patient=p, voided=False).first()
            pid = getattr(ident, 'identifier', None)
            if uuid:
                patient_name_map[uuid] = {"id": pid, "name": full_name}
    except Exception as e:
        return Response(
            {"error": f"환자 데이터 처리 중 오류 발생: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # 2) OpenMRS 의료진 이름 매핑
    doctor_name_map = {}
    try:
        resp = requests.get(
            f"{settings.OPENMRS_URL.rstrip('/')}/provider",
            auth=(settings.OPENMRS_USER, settings.OPENMRS_PASS),
            timeout=10
        )
        resp.raise_for_status()
        for d in resp.json().get("results", []):
            if d.get("uuid") and d.get("display"):
                doctor_name_map[d["uuid"]] = d["display"]
    except Exception:
        # 매핑 실패 시 무시
        pass

    # 3) MariaDB OCSLog 데이터 변환
    combined = []
    for log in OCSLog.objects.all().order_by('-created_at'):
        combined.append({
            "patient_id":           log.patient_id,
            "patient_name":         patient_name_map.get(log.patient_uuid, {}).get("name", ""),
            "doctor_id":            log.doctor_id,
            "doctor_name":          doctor_name_map.get(log.doctor_uuid, ""),
            "request_type":         log.step,
            "request_and_result":   json.dumps(log.detail, ensure_ascii=False) if log.detail else "",
            "request_and_return_time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "diagnosis_detail":     "-"
        })

    # 4) MongoDB 로그 변환
    client = None
    try:
        client = MongoClient(settings.MONGO_URI)
        collection = client[settings.DB_NAME][settings.COLLECTION_NAME]
        for m in collection.find().sort("timestamp", -1):
            combined.append({
                "patient_id":           m.get("patient_id", "-"),
                "patient_name":         patient_name_map.get(
                                            m.get("patient_uuid") or m.get("patient_id"), {}
                                        ).get("name", ""),
                "doctor_id":            m.get("doctor_id", "-"),
                "doctor_name":          doctor_name_map.get(m.get("doctor_uuid",""), ""),
                "request_type":         m.get("step", "-"),
                "request_and_result":   json.dumps(m.get("detail", {}), ensure_ascii=False),
                "request_and_return_time": (
                    m.get("timestamp").strftime("%Y-%m-%d %H:%M:%S")
                    if m.get("timestamp") else "-"
                ),
                "diagnosis_detail":     "-"
            })
    except Exception:
        # 인증 실패 등 오류 시 Mongo 로그 무시
        pass
    finally:
        if client:
            client.close()

    # 5) 시간순 정렬 후 반환
    combined.sort(key=lambda x: x["request_and_return_time"], reverse=True)
    return Response(combined, status=status.HTTP_200_OK)



# import requests
# import json
# from requests.auth import HTTPBasicAuth
# from rest_framework import status
# from rest_framework.generics import ListAPIView
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from django.utils.dateparse import parse_datetime
# from datetime import datetime
# from pymongo import MongoClient
# from .mongo_utils import MONGO_URI, DB_NAME, COLLECTION_NAME
# from .models import OCSLog
# from .serializers import OCSLogSerializer
# from django.utils.timezone import make_aware
# from dateutil import parser as date_parser
# from orders.models import TestOrder
# from django.db.models import Q
# from openmrs_models.models import Patient, Person, PersonName, PatientIdentifier 
# from .mongo_utils import insert_log_to_mongo


# # 🔹 클래스 기반: OCSLog만 조회
# class OCSLogListAPIView(ListAPIView):
#     serializer_class = OCSLogSerializer

#     def get_queryset(self):
#         patient_id = self.request.query_params.get('patient_id')
#         if patient_id:
#             return OCSLog.objects.filter(patient_id=patient_id).order_by('-created_at')
#         return OCSLog.objects.all().order_by('-created_at')

# # 🔹 POST: OCSLog 저장용
# @api_view(['POST'])
# def create_log_view(request):
#     try:
#         data = request.data
#         # 필수: category, step, patient_uuid or patient_id
#         category     = data.get('category', 'LIS')
#         step         = data.get('step', '')
#         patient_uuid = data.get('patient_uuid')
#         patient_id   = data.get('patient_id')
#         doctor_uuid  = data.get('doctor_uuid')
#         doctor_id    = data.get('doctor_id')
#         detail       = data.get('detail', {})

#         if not all([patient_id, doctor_id, step]):
#             return Response({"error": "필수 필드가 누락되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

#         log = OCSLog.objects.create(
#             category     = category,
#             step         = step,
#             patient_uuid = patient_uuid,
#             patient_id   = patient_id,
#             doctor_uuid  = doctor_uuid,
#             doctor_id    = doctor_id,
#             detail       = detail,
#         )

#         return Response({"message": "로그 저장 완료", "log_id": log.id}, status=status.HTTP_201_CREATED)

#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # 🔹 GET: OCSLog 조회 + 필터
# @api_view(['GET'])
# def get_logs_view(request):
#     """
#     GET /api/logs/?patient_id=...&doctor_id=...&step=...&start_date=...&end_date=...
#     """
#     try:
#         patient_id = request.GET.get('patient_id')
#         doctor_id = request.GET.get('doctor_id')
#         step = request.GET.get('step')
#         start_date_str = request.GET.get('start_date')
#         end_date_str = request.GET.get('end_date')

#         logs = OCSLog.objects.all()

#         if patient_id:
#             logs = logs.filter(patient_id=patient_id)
#         if doctor_id:
#             logs = logs.filter(doctor_id=doctor_id)
#         if step:
#             logs = logs.filter(step=step)
#         if start_date_str:
#             dt = parse_datetime(start_date_str)
#             if dt:
#                 logs = logs.filter(created_at__gte=make_aware(dt))
#         if end_date_str:
#             dt = parse_datetime(end_date_str)
#             if dt:
#                 logs = logs.filter(created_at__lte=make_aware(dt))

#         logs = logs.order_by('-created_at')
#         serializer = OCSLogSerializer(logs, many=True)
#         return Response(serializer.data, status=200)

#     except Exception as e:
#         return Response({"error": str(e)}, status=500)

# # 🔹 GET: LIS + Mongo 로그 통합 조회
# @api_view(['GET'])
# def combined_log_view(request):
#     patient_name_map = {}
#     try:
#         print("=== 환자 목록 조회 시작 (patient_name_map) ===")
#         patients = Patient.objects.select_related('patient_id').all() # 변경: select_related('patient_id') 추가 (기존: Patient.objects.all())
#         print(f"조회된 Patient 객체 수: {patients.count()}")
#         for p in patients:
#             print(f"처리 중인 Patient 객체: {p}")
#             print(f"Patient 객체의 속성: {dir(p)}")
#             print(f"Patient 객체의 __dict__: {p.__dict__}")

#             uuid = None
#             name = "N/A"

#             person_obj = p.patient_id # 변경: Person 객체에 접근 (기존: p 직접 접근)
#             uuid = getattr(person_obj, 'uuid', None) # 변경: Person 객체에서 uuid 가져오기 (기존: p에서 uuid 가져오기)

#             active_name_obj = p.get_active_name() # 변경: Patient 객체의 get_active_name() 사용 (기존: p에서 직접 display/get_active_name 시도)
#             full_name = active_name_obj.get_full_name() if active_name_obj else "N/A" # 변경: get_full_name() 호출 (기존: p에서 직접 display/get_active_name 시도)

#             patient_identifier_obj = PatientIdentifier.objects.filter(patient=p, voided=False, preferred=True).first() # 변경: PatientIdentifier 모델에서 preferred identifier 조회 (기존: 없었음)
#             if not patient_identifier_obj:
#                 patient_identifier_obj = PatientIdentifier.objects.filter(patient=p, voided=False).first() # 변경: preferred가 없을 경우 다른 identifier 조회 (기존: 없었음)
            
#             patient_id_from_openmrs = getattr(patient_identifier_obj, 'identifier', 'N/A') # 변경: identifier 속성 사용 (기존: p.patient_id 직접 사용 또는 파싱)

#             if uuid:
#                 patient_name_map[uuid] = {
#                     "id": patient_id_from_openmrs, # 변경: PatientIdentifier에서 가져온 ID 사용 (기존: p.patient_id 또는 파싱된 ID)
#                     "name": full_name # 변경: get_full_name()으로 얻은 이름 사용 (기존: 파싱된 이름 또는 p.display)
#                 }
#             print(f"Mapped Patient - UUID: {uuid}, ID: {patient_id_from_openmrs}, Name: {full_name}") # 변경: 출력 메시지에 ID 추가 (기존: UUID, Name만 출력)

#     except Exception as e:
#         print(f"❌ 환자 이름 매핑 실패 (백엔드): {e}")
#         return Response({"error": f"환자 데이터 처리 중 오류 발생: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#     # 의사 이름 매핑 (REST API 통해 OpenMRS에서 요청)
#     doctor_name_map = {}
#     try:
#         res = requests.get(
#             'http://35.225.63.41:8082/openmrs/ws/rest/v1/provider', # 또는 localhost:8082/openmrs/ws/rest/v1/porivider
#             auth=HTTPBasicAuth('admin', 'Admin123'),
#             headers={"Accept": "application/json"}
#         )
#         if res.status_code == 200:
#             for d in res.json().get("results", []):
#                 if d["uuid"] and d["display"]:
#                     doctor_name_map[d["uuid"]] = d["display"]
#     except Exception as e:
#         print("의사 이름 매핑 실패:", e)

#     ### 1. LIS 로그
#     lis_logs = OCSLog.objects.all().order_by('-created_at')
#     lis_data = [
#         {
#             "patient_id": log.patient_id,
#             "patient_name": patient_name_map.get(log.patient_id, ""),
#             "doctor_id": log.doctor_id,
#             "doctor_name": doctor_name_map.get(log.doctor_id, ""),
#             "request_type": log.step,
#             "request_and_result": (
#                 json.dumps(log.detail, ensure_ascii=False)
#                 if log.detail else ""
#             ),
#             "request_and_return_time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
#             "diagnosis_detail": "-",
         
#         }
#         for log in lis_logs
#     ]

#     ### 2. Mongo 로그
#     mongo_data = []
#     try:
#         # client = MongoClient("mongodb://ocs_user:ocs_pass@localhost:27017/?authSource=ocslog") # 기존 코드
#         client = MongoClient(MONGO_URI) # 변경: mongo_util.py에서 임포트한 MONGO_URI 사용 (기존: 하드코딩된 문자열)
#         db = client[DB_NAME] # 변경: DB_NAME 사용 (기존: "ocslog" 하드코딩)
#         collection = db[COLLECTION_NAME] # 변경: COLLECTION_NAME 사용 (기존: "logs" 하드코딩)
#         mongo_logs = collection.find().sort("timestamp", -1)

#         for log in mongo_logs:
#             mongo_data.append({
#                 "patient_id": log.get("patient_id", "-"),
#                 "patient_name": patient_name_map.get(log.get("patient_id", ""), {}).get("name", ""),
#                 "doctor_id": log.get("doctor_id", "-"),
#                 "doctor_name": doctor_name_map.get(log.get("doctor_id", ""), ""),
#                 "request_type": log.get("step", "-"),
#                 "request_and_result": json.dumps(log.get("detail", {}), ensure_ascii=False),
#                 "request_and_return_time": log.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if log.get("timestamp") else "-",
#                 "diagnosis_detail": "-",  # 필요시 detail 내부 필드로 대체 # "diagnosis_detail": log.get("diagnosis_detail", "-"),
#             })
#         print(f"조회된 Mongo 로그 객체 수: {len(mongo_data)}")

#     except Exception as e:
#         print(f"MongoDB 연결 오류: {e}")
#         mongo_data = []

#     finally: # 변경: client.close()를 위한 finally 블록 추가 (기존: 없었음)
#         if 'client' in locals() and client: # 변경: client가 정의되었고 유효한지 확인 (기존: 없었음)
#             client.close() # 변경: MongoDB 연결 닫기 (기존: 없었음)

#     ### 3. 통합 및 반환
#     combined = lis_data + mongo_data
#     combined.sort(key=lambda x: x["request_and_return_time"], reverse=True)
#     return Response(combined, status=200)

#-------------20250609------------#    
# @api_view(['GET'])
# def combined_log_view(request):
#     # 1. MariaDB: LISLog
#     lis_logs = LISLog.objects.all().order_by('-created_at')
#     lis_data = [
#         {
#             "patient_id": log.patient_id,
#             "doctor_id": log.doctor_id,
#             "request_type": "검사",
#             "request_and_result": f"{log.request_detail or ''}\n{log.result_detail or ''}".strip(),
#             "request_and_return_time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
#             "diagnosis_detail": "-",
#         }
#         for log in lis_logs
#     ]

#     # 2. MongoDB: OCS 로그
#     try:
#         client = MongoClient("mongodb://ocs_user:ocs_pass@localhost:27017/?authSource=ocslog")
#         db = client["ocslog"]
#         collection = db["logs"]
#         mongo_logs = collection.find().sort("timestamp", -1)

#         mongo_data = []
#         for log in mongo_logs:
#             mongo_data.append({
#                 "patient_id": log.get("patient_id", "-"),
#                 "doctor_id": log.get("doctor_id", "-"),
#                 "request_type": log.get("request_type", "-"),
#                 "request_and_result": log.get("request_detail", "-"),
#                 "request_and_return_time": log.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if log.get("timestamp") else "-",
#                 "diagnosis_detail": log.get("diagnosis_detail", "-"),
#             })

#     except Exception as e:
#         print("MongoDB 연결 오류:", e)
#         mongo_data = []

#     # 3. 통합 및 정렬
#     combined = lis_data + mongo_data
#     combined.sort(key=lambda x: x["request_and_return_time"], reverse=True)

#     return Response(combined, status=200)


