# # backend > ocs > views.py

###################

# ✅ views.py 수정 (LIS 전용으로 리팩토링)
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from datetime import datetime
from pymongo import MongoClient
from .models import LISLog
from .serializers import LISLogSerializer
from django.utils.timezone import make_aware
from dateutil import parser as date_parser
from orders.models import TestOrder
import re
from django.db.models import Q

# 🔹 클래스 기반: LISLog만 조회
class LISLogListAPIView(ListAPIView):
    serializer_class = LISLogSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return LISLog.objects.filter(patient_id=patient_id).order_by('-created_at')
        return LISLog.objects.all().order_by('-created_at')

# 🔹 POST: LISLog 저장용
@api_view(['POST'])
def create_log_view(request):
    try:
        data = request.data
        patient_id = data.get('patient_id', '')
        doctor_id = data.get('doctor_id', '')
        order_id = data.get('order_id')
        sample_id = data.get('sample_id')
        step = data.get('step', '')  # 'order', 'sample', 'result'
        request_detail = data.get('request_detail', '')
        result_detail = data.get('result_detail', '')

        if not all([patient_id, doctor_id, step]):
            return Response({"error": "필수 필드가 누락되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

        log = LISLog.objects.create(
            step=step,
            patient_id=patient_id,
            doctor_id=doctor_id,
            order_id=order_id,
            sample_id=sample_id,
            request_detail=request_detail,
            result_detail=result_detail,
        )

        return Response({"message": "로그 저장 완료", "log_id": log.id}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 🔹 GET: LISLog 조회 + 필터
@api_view(['GET'])
def get_logs_view(request):
    """
    GET /api/logs/?patient_id=...&doctor_id=...&step=...&start_date=...&end_date=...
    """
    try:
        patient_id = request.GET.get('patient_id')
        doctor_id = request.GET.get('doctor_id')
        step = request.GET.get('step')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        logs = LISLog.objects.all()

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
        serializer = LISLogSerializer(logs, many=True)
        return Response(serializer.data, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# 🔹 GET: LIS + Mongo 로그 통합 조회
@api_view(['GET'])
def combined_log_view(request):
    ### 0. 이름 매핑
    # 환자 이름 매핑
    patient_name_map = {}
    for p in Patient.objects.select_related('patient_id').all():
        uuid = p.patient_id.uuid
        name = p.get_active_name().get_full_name() if p.get_active_name() else "N/A"
        patient_name_map[uuid] = name

    # 의사 이름 매핑 (REST API 통해 OpenMRS에서 요청)
    doctor_name_map = {}
    try:
        res = requests.get(
            'http://35.225.63.41:8082/openmrs/ws/rest/v1/provider', # 또는 localhost:8082/openmrs/ws/rest/v1/porivider
            auth=HTTPBasicAuth('admin', 'Admin123'),
            headers={"Accept": "application/json"}
        )
        if res.status_code == 200:
            for d in res.json().get("results", []):
                if d["uuid"] and d["display"]:
                    doctor_name_map[d["uuid"]] = d["display"]
    except Exception as e:
        print("의사 이름 매핑 실패:", e)

    ### 1. LIS 로그
    lis_logs = LISLog.objects.all().order_by('-created_at')
    lis_data = [
        {
            "patient_id": log.patient_id,
            "patient_name": patient_name_map.get(log.patient_id, ""),
            "doctor_id": log.doctor_id,
            "doctor_name": doctor_name_map.get(log.doctor_id, ""),
            "request_type": "검사",
            "request_and_result": f"{log.request_detail or ''}\n{log.result_detail or ''}".strip(),
            "request_and_return_time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "diagnosis_detail": "-",
        }
        for log in lis_logs
    ]

    ### 2. Mongo 로그
    mongo_data = []
    try:
        client = MongoClient("mongodb://ocs_user:ocs_pass@localhost:27017/?authSource=ocslog")
        db = client["ocslog"]
        collection = db["logs"]
        mongo_logs = collection.find().sort("timestamp", -1)

        for log in mongo_logs:
            mongo_data.append({
                "patient_id": log.get("patient_id", "-"),
                "patient_name": patient_name_map.get(log.get("patient_id", ""), ""),
                "doctor_id": log.get("doctor_id", "-"),
                "doctor_name": doctor_name_map.get(log.get("doctor_id", ""), ""),
                "request_type": log.get("request_type", "-"),
                "request_and_result": log.get("request_detail", "-"),
                "request_and_return_time": log.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if log.get("timestamp") else "-",
                "diagnosis_detail": log.get("diagnosis_detail", "-"),
            })

    except Exception as e:
        print("MongoDB 연결 오류:", e)

    ### 3. 통합 및 반환
    combined = lis_data + mongo_data
    combined.sort(key=lambda x: x["request_and_return_time"], reverse=True)
    return Response(combined, status=200)

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


