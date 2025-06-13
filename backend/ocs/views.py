# backend > ocs > views.py

# backend/ocs/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions    import AllowAny
from rest_framework.response       import Response
from rest_framework                import status
from django.core.paginator         import Paginator
from .models                       import OCSLog
from .serializers                 import OCSLogSerializer
from orders.models                import TestOrder

@api_view(['POST'])
@permission_classes([AllowAny])
def create_integration_log(request):
    """
    POST: 들어온 payload(raw_data)를 그대로 OCSLog에 저장
    """
    data = request.data
    try:
        log = OCSLog.objects.create(
            raw_data   = data,
            patient_id = data.get('patient_id'),
            doctor_id  = data.get('doctor_id'),
            system     = data.get('system', 'OCS-Integration')
        )
        return Response({
            'status': 'success',
            'message': '로그가 저장되었습니다.',
            'data': {
                'id':        log.id,
                'timestamp': log.timestamp.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'로그 생성 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def integration_logs(request):
    """
    GET: 저장된 OCSLog 조회
    - 필터: ?patient=이름, ?doctor=이름 (TestOrder에서 UUID 찾아서 매핑)
    """
    qs = OCSLog.objects.all().order_by('-timestamp')

    # 이름 → UUID 매핑 후 필터링
    patient = request.GET.get('patient')
    if patient:
        uuids = TestOrder.objects.filter(
            patient_name__icontains=patient
        ).values_list('patient_id', flat=True).distinct()
        qs = qs.filter(patient_id__in=uuids)

    doctor = request.GET.get('doctor')
    if doctor:
        uuids = TestOrder.objects.filter(
            doctor_name__icontains=doctor
        ).values_list('doctor_id', flat=True).distinct()
        qs = qs.filter(doctor_id__in=uuids)

    # 페이징 처리
    page      = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))
    paginator = Paginator(qs, page_size)
    page_obj  = paginator.get_page(page)

    serializer = OCSLogSerializer(page_obj, many=True)
    return Response({
        'status':    'success',
        'data':      serializer.data,
        'total':     paginator.count,
        'page':      page,
        'page_size': page_size
    }, status=status.HTTP_200_OK)






# backend/ocs/views.py
# backend/ocs/views.py

# import json
# import logging
# import requests
# from datetime import datetime, timedelta
# from django.utils import timezone
# from pymongo import MongoClient
# from django.conf import settings
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from .models import OCSLog
# from openmrs_models.models import Patient, PatientIdentifier


# logger = logging.getLogger(__name__)

# # OpenMRS 설정 가져오기 (settings.EXTERNAL_SERVICES['openmrs'] 형태)
# omrs = settings.EXTERNAL_SERVICES.get('openmrs', {})
# OPENMRS_BASE = f"http://{omrs['host']}:{omrs['port']}/openmrs/ws/rest/v1"
# OPENMRS_AUTH = (omrs['username'], omrs['password'])
# PROVIDER_TIMEOUT = 5  # seconds

# def _fetch_provider_map():
#     """OpenMRS로부터 {uuid: display} 맵을 가져옵니다."""
#     try:
#         resp = requests.get(
#             f"{OPENMRS_BASE}/provider",
#             auth=OPENMRS_AUTH,
#             timeout=PROVIDER_TIMEOUT
#         )
#         resp.raise_for_status()
#         data = resp.json().get('results', resp.json())
#         return {e['uuid']: e.get('display','') for e in data if e.get('uuid')}
#     except Exception as e:
#         logger.warning("의사 매핑 실패: %s", e)
#         return {}
    
    
# @api_view(['POST'])
# def create_log_view(request):
#     """
#     프론트에서 호출할 POST 엔드포인트.
#     body JSON 예시:
#       {
#         "patient_id": "12345",
#         "doctor_id": "abcdef-uuid",
#         "category": "LIS_ORDER",
#         "detail": { ... 자유 형식 객체 ... }
#       }
#     """
#     data = request.data

#     # 필수 필드 유효성 검증 (원하는 대로 추가)
#     if not data.get('patient_id') or not data.get('doctor_id'):
#         return Response(
#             {"error": "patient_id와 doctor_id는 필수입니다."},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     try:
#         log = OCSLog.objects.create(
#             patient_id = data.get('patient_id'),
#             doctor_id  = data.get('doctor_id'),
#             category   = data.get('category', ''),            # ex: "LIS_ORDER"
#             detail     = json.dumps(data.get('detail', {}), ensure_ascii=False),
#             created_at = timezone.now()
#         )
#         return Response(
#             {
#                 "status": "created",
#                 "log_id": log.id
#             },
#             status=status.HTTP_201_CREATED
#         )
#     except Exception as e:
#         logger.error("create_log_view 실패: %s", e)
#         return Response(
#             {"error": "로그 생성 중 오류가 발생했습니다."},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
        
# @api_view(['GET'])
# def combined_log_view(request):
#     # 1) 환자 매핑 준비
#     patients = Patient.objects.prefetch_related('patientidentifier_set').all()
#     patient_map = {}
#     for p in patients:
#         # preferred=True 우선, 없으면 첫 식별자
#         ident = (
#             p.patientidentifier_set.filter(voided=False, preferred=True).first()
#             or p.patientidentifier_set.filter(voided=False).first()
#         )
#         pid = ident.identifier if ident else ''
#         # 이름 가져오기
#         name = getattr(p, 'get_active_name', lambda: None)()
#         full_name = name.get_full_name() if name else ''
#         patient_map[pid] = f"{full_name} ({pid})"

#     # 2) 의사 매핑
#     provider_map = _fetch_provider_map()

#     # 3) MariaDB 로그 쿼리
#     qs = OCSLog.objects.all().order_by('-created_at')
#     if pid := request.GET.get('patient_id'):
#         qs = qs.filter(patient_id=pid)
#     if did := request.GET.get('doctor_id'):
#         qs = qs.filter(doctor_id=did)
#     if sd := request.GET.get('start_date'):
#         qs = qs.filter(created_at__gte=datetime.fromisoformat(sd))
#     if ed := request.GET.get('end_date'):
#         # end_date inclusive
#         end_dt = datetime.fromisoformat(ed) + timedelta(days=1)
#         qs = qs.filter(created_at__lt=end_dt)

#     combined = []
#     # 4) MariaDB 로그 가공
#     for idx, log in enumerate(qs, start=1):
#         combined.append({
#             'no': idx,
#             'patient': patient_map.get(log.patient_id, log.patient_id),
#             'doctor': provider_map.get(log.doctor_uuid, log.doctor_id or ''),
#             'order_type': log.category,
#             'order_and_result': log.detail or '',
#             'diagnosis_detail': "-", 
#             'time': log.created_at.strftime("%Y.%m.%d %H:%M:%S")
#         })

#     # 5) MongoDB 로그 추가
#     try:
#         client = MongoClient(settings.MONGO_URI)
#         coll = client[settings.MONGO_DB][settings.MONGO_COLL]
#         for m in coll.find().sort("timestamp", -1):
#             combined.append({
#                 'no': None,  # 후에 재번호 부여
#                 'patient': patient_map.get(m.get('patient_id',''), m.get('patient_id','')),
#                 'doctor': provider_map.get(m.get('doctor_uuid',''), m.get('doctor_id','')),
#                 'order_type': m.get('step',''),
#                 'order_and_result': json.dumps(m.get('detail', {}), ensure_ascii=False),
#                 'diagnosis_detail': "-",
#                 'time': m.get('timestamp').strftime("%Y.%m.%d %H:%M:%S") if m.get('timestamp') else ''
#             })
#     except Exception as e:
#         logger.warning("MongoDB 로그 추가 실패: %s", e)
#     finally:
#         client.close()

#     # 6) 최종 정렬 & 번호 재부여
#     combined.sort(key=lambda x: x['time'], reverse=True)
#     for i, item in enumerate(combined, start=1):
#         item['no'] = i

#     return Response(combined)



#----------0612-오전-----------
# import json
# import logging
# import requests
# from datetime import datetime
# from pymongo import MongoClient
# from django.conf import settings
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from .models import OCSLog
# from openmrs_models.models import Patient, PatientIdentifier

# logger = logging.getLogger(__name__)

# # EXTERNAL_SERVICES에서 OpenMRS 설정을 읽어 옵니다
# omrs = settings.EXTERNAL_SERVICES.get('openmrs', {})
# OPENMRS_API_BASE = f"http://{omrs['host']}:{omrs['port']}/openmrs/ws/rest/v1"
# OPENMRS_AUTH     = (omrs['username'], omrs['password'])

# def _fetch_provider_map():
#     """ OpenMRS /provider 호출하여 uuid → display 맵 생성 """
#     url = f"{OPENMRS_API_BASE}/provider"
#     resp = requests.get(url, auth=OPENMRS_AUTH, timeout=10)
#     resp.raise_for_status()
#     data = resp.json().get('results', resp.json())
#     return { e['uuid']: e.get('display') for e in data if e.get('uuid') }

# @api_view(['GET'])
# def combined_log_view(request):
#     """
#     GET /api/logs/combined/
#     MariaDB OCSLog + MongoDB logs 컬렉션을 합쳐
#     NO, 환자, 의사, 요청 종류, 요청/결과, 진단 상세, 요청/결과 시간 컬럼을 반환.
#     필터: patient_id, doctor_id, start_date, end_date (ISO date)
#     """

#     # STEP 0: 뷰 진입 확인
#     logger.debug("▶ combined_log_view 진입 확인! 쿼리 파라미터: %s", request.GET.dict())

#     # STEP 1: 환자 매핑
#     patients = list(Patient.objects.all())
#     logger.debug("▶ STEP 1: Patient.objects.all() 개수: %d", len(patients))
#     patient_map = {}
#     for p in patients:
#         name = p.get_active_name().get_full_name() if hasattr(p, 'get_active_name') else ''
#         ident = PatientIdentifier.objects.filter(patient=p, voided=False).first()
#         pid = ident.identifier if ident else ''
#         patient_map[pid] = {'name': name, 'id': pid}

#     # STEP 2: 의사 매핑
#     try:
#         provider_map = _fetch_provider_map()
#         logger.debug("▶ STEP 2: provider_map 크기: %d", len(provider_map))
#     except Exception as e:
#         logger.error("❌ STEP 2 실패 (의사 매핑): %s", e)
#         provider_map = {}

#     # STEP 3: OCSLog 조회 + 필터링
#     qs = OCSLog.objects.all().order_by('-created_at')
#     logger.debug("▶ STEP 3: OCSLog.objects.count(): %d", qs.count())
#     if pid := request.GET.get('patient_id'):
#         qs = qs.filter(patient_id=pid)
#         logger.debug("   → patient_id 필터 적용 후 개수: %d", qs.count())
#     if did := request.GET.get('doctor_id'):
#         qs = qs.filter(doctor_id=did)
#         logger.debug("   → doctor_id 필터 적용 후 개수: %d", qs.count())
#     if sd := request.GET.get('start_date'):
#         qs = qs.filter(created_at__gte=datetime.fromisoformat(sd))
#         logger.debug("   → start_date 필터 적용 후 개수: %d", qs.count())
#     if ed := request.GET.get('end_date'):
#         qs = qs.filter(created_at__lte=datetime.fromisoformat(ed))
#         logger.debug("   → end_date 필터 적용 후 개수: %d", qs.count())

#     # STEP 4: MariaDB 로그로 combined 리스트 생성
#     combined = []
#     for idx, log in enumerate(qs, start=1):
#         combined.append({
#             'no': idx,
#             'patient': f"{patient_map.get(log.patient_id,{}).get('name','')} ({log.patient_id})",
#             'doctor': provider_map.get(log.doctor_uuid, log.doctor_id or ''),
#             'order_type': log.category,
#             'order_and_result': json.dumps(log.detail or {}, ensure_ascii=False),
#             'diagnosis_detail': "-",  # 필요 시 detail에서 꺼낼 수 있음
#             'time': log.created_at.strftime("%Y.%m.%d %H:%M:%S")
#         })
#     logger.debug("▶ STEP 4: MariaDB 기반 combined 개수: %d", len(combined))

#     # STEP 5: MongoDB 로그 추가 (선택사항)
#     try:
#         client = MongoClient(settings.MONGO_URI)
#         coll = client[settings.DB_NAME][settings.COLLECTION_NAME]
#         mongo_count = coll.count_documents({})
#         logger.debug("▶ STEP 5: MongoDB logs 개수: %d", mongo_count)
#         for m in coll.find().sort("timestamp", -1):
#             combined.append({
#                 'no': None,
#                 'patient': patient_map.get(m.get('patient_id'),{}).get('name',''),
#                 'doctor': provider_map.get(m.get('doctor_uuid',''), ''),
#                 'order_type': m.get('step',''),
#                 'order_and_result': json.dumps(m.get('detail', {}), ensure_ascii=False),
#                 'diagnosis_detail': "-",
#                 'time': m.get('timestamp').strftime("%Y.%m.%d %H:%M:%S") if m.get('timestamp') else ''
#             })
#     except Exception as e:
#         logger.error("❌ STEP 5 실패 (MongoDB 추가): %s", e)
#     finally:
#         client.close()

#     # STEP 6: NO 재순번 및 정렬
#     seq = 0
#     for item in combined:
#         seq += 1
#         item['no'] = seq
#     combined.sort(key=lambda x: x['time'], reverse=True)
#     logger.debug("▶ STEP FINAL: 최종 combined 개수: %d", len(combined))

#     return Response(combined)

#----------0611 오후 코드----
# import json
# import requests
# from datetime import datetime
# from pymongo import MongoClient
# from django.conf import settings
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from .models import OCSLog
# from openmrs_models.models import Patient, PatientIdentifier

# # EXTERNAL_SERVICES에서 OpenMRS 설정 읽기
# omrs = settings.EXTERNAL_SERVICES.get('openmrs', {})
# OPENMRS_API_BASE = f"http://{omrs['host']}:{omrs['port']}/openmrs/ws/rest/v1"
# OPENMRS_AUTH     = (omrs['username'], omrs['password'])

# def _fetch_provider_map():
#     """ OpenMRS /provider → {uuid: display} """
#     resp = requests.get(f"{OPENMRS_API_BASE}/provider",
#                         auth=OPENMRS_AUTH, timeout=10)
#     resp.raise_for_status()
#     data = resp.json().get('results', resp.json())
#     return {e['uuid']: e.get('display') for e in data if e.get('uuid')}

# @api_view(['GET'])
# def combined_log_view(request):
#     print("▶ combined_log_view 진입 확인!", request.GET.dict())
#     """
#     GET /api/logs/combined/
#     OCSLog(MariaDB)와 logs(MongoDB)를 합쳐
#     ['no','patient','doctor','order_type','order_and_result',
#      'diagnosis_detail','time'] 형태로 반환.
#     Filters: patient_id, doctor_id, start_date, end_date
#     """
#     # 1) 환자 매핑: {patient_id: {'name':..., 'id':...}}
#     patient_map = {}
#     for p in Patient.objects.all():
#         name = p.get_active_name().get_full_name() if hasattr(p, 'get_active_name') else ''
#         ident = PatientIdentifier.objects.filter(patient=p, voided=False).first()
#         pid = ident.identifier if ident else ''
#         # 여기서 <기본키> 대신 PID(ident.identifier)를 키로 사용
#         patient_map[pid] = {'name': name, 'id': pid}

#     # 2) 의사 매핑
#     provider_map = _fetch_provider_map()

#     # 3) OCSLog 조회 + 필터
#     qs = OCSLog.objects.all().order_by('-created_at')
#     if pid := request.GET.get('patient_id'):
#         qs = qs.filter(patient_id=pid)
#     if did := request.GET.get('doctor_id'):
#         qs = qs.filter(doctor_id=did)
#     if sd := request.GET.get('start_date'):
#         qs = qs.filter(created_at__gte=datetime.fromisoformat(sd))
#     if ed := request.GET.get('end_date'):
#         qs = qs.filter(created_at__lte=datetime.fromisoformat(ed))

#     combined = []
#     for idx, log in enumerate(qs, start=1):
#         combined.append({
#             'no': idx,
#             'patient': f"{patient_map.get(log.patient_id,{}).get('name','')} ({log.patient_id})",
#             'doctor': provider_map.get(log.doctor_uuid, log.doctor_id or ''),
#             'order_type': log.category,
#             'order_and_result': json.dumps(log.detail or {}, ensure_ascii=False),
#             'diagnosis_detail': "-",  # 필요시 detail에서 꺼낼 수 있음
#             'time': log.created_at.strftime("%Y.%m.%d %H:%M:%S")
#         })

#     # 4) MongoDB 로그 추가 (옵션)
#     try:
#         client = MongoClient(settings.MONGO_URI)
#         collection = client[settings.DB_NAME][settings.COLLECTION_NAME]
#         for m in collection.find().sort("timestamp", -1):
#             combined.append({
#                 'no': None,
#                 'patient': patient_map.get(m.get('patient_id'),{}).get('name',''),
#                 'doctor': provider_map.get(m.get('doctor_uuid',''), ''),
#                 'order_type': m.get('step',''),
#                 'order_and_result': json.dumps(m.get('detail', {}), ensure_ascii=False),
#                 'diagnosis_detail': "-",
#                 'time': m.get('timestamp').strftime("%Y.%m.%d %H:%M:%S") if m.get('timestamp') else ''
#             })
#     except Exception:
#         pass
#     finally:
#         if 'client' in locals():
#             client.close()

#     # 5) NO 재순번
#     for i, item in enumerate(combined, start=1):
#         item['no'] = i

#     # 6) 시간 내림차순 정렬
#     combined.sort(key=lambda x: x['time'], reverse=True)

#     return Response(combined)


# ------------0611--------------
# import json
# import requests
# from requests.auth import HTTPBasicAuth
# from rest_framework import status
# from rest_framework.generics import ListAPIView
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from django.utils.dateparse import parse_datetime
# from django.utils.timezone import make_aware
# from datetime import datetime
# from pymongo import MongoClient
# from .mongo_utils import MONGO_URI, DB_NAME, COLLECTION_NAME
# from .models import OCSLog
# from .serializers import OCSLogSerializer
# from openmrs_models.models import Patient, PatientIdentifier

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
#     try:
#         patient_id     = request.GET.get('patient_id')
#         doctor_id      = request.GET.get('doctor_id')
#         step           = request.GET.get('step')
#         start_date_str = request.GET.get('start_date')
#         end_date_str   = request.GET.get('end_date')

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
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # 🔹 GET: LIS + Mongo 로그 통합 조회
# # backend/ocs/views.py
# from django.conf import settings

# @api_view(['GET'])
# def combined_log_view(request):
#     """
#     GET /api/logs/combined/
#     MariaDB의 OCSLog와 MongoDB logs 컬렉션을 통합하여 반환합니다.
#     MongoDB 인증 실패 시에도 빈 Mongo 로그를 무시하고 200 OK 응답을 보냅니다.
#     """
#     # 1) OpenMRS 환자 이름 매핑
#     patient_name_map = {}
#     try:
#         for p in Patient.objects.select_related('patient_id').all():
#             person = p.patient_id
#             uuid = getattr(person, 'uuid', None)
#             name_obj = p.get_active_name()
#             full_name = name_obj.get_full_name() if name_obj else "N/A"
#             ident = PatientIdentifier.objects.filter(patient=p, voided=False, preferred=True).first() \
#                     or PatientIdentifier.objects.filter(patient=p, voided=False).first()
#             pid = getattr(ident, 'identifier', None)
#             if uuid:
#                 patient_name_map[uuid] = {"id": pid, "name": full_name}
#     except Exception as e:
#         return Response(
#             {"error": f"환자 데이터 처리 중 오류 발생: {e}"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

#     # 2) OpenMRS 의료진 이름 매핑
#     doctor_name_map = {}
#     try:
#         resp = requests.get(
#             f"{settings.OPENMRS_URL.rstrip('/')}/provider",
#             auth=(settings.OPENMRS_USER, settings.OPENMRS_PASS),
#             timeout=10
#         )
#         resp.raise_for_status()
#         for d in resp.json().get("results", []):
#             if d.get("uuid") and d.get("display"):
#                 doctor_name_map[d["uuid"]] = d["display"]
#     except Exception:
#         # 매핑 실패 시 무시
#         pass

#     # 3) MariaDB OCSLog 데이터 변환
#     combined = []
#     for log in OCSLog.objects.all().order_by('-created_at'):
#         combined.append({
#             "patient_id":           log.patient_id,
#             "patient_name":         patient_name_map.get(log.patient_uuid, {}).get("name", ""),
#             "doctor_id":            log.doctor_id,
#             "doctor_name":          doctor_name_map.get(log.doctor_uuid, ""),
#             "request_type":         log.step,
#             "request_and_result":   json.dumps(log.detail, ensure_ascii=False) if log.detail else "",
#             "request_and_return_time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
#             "diagnosis_detail":     "-"
#         })

#     # 4) MongoDB 로그 변환
#     client = None
#     try:
#         client = MongoClient(settings.MONGO_URI)
#         collection = client[settings.DB_NAME][settings.COLLECTION_NAME]
#         for m in collection.find().sort("timestamp", -1):
#             combined.append({
#                 "patient_id":           m.get("patient_id", "-"),
#                 "patient_name":         patient_name_map.get(
#                                             m.get("patient_uuid") or m.get("patient_id"), {}
#                                         ).get("name", ""),
#                 "doctor_id":            m.get("doctor_id", "-"),
#                 "doctor_name":          doctor_name_map.get(m.get("doctor_uuid",""), ""),
#                 "request_type":         m.get("step", "-"),
#                 "request_and_result":   json.dumps(m.get("detail", {}), ensure_ascii=False),
#                 "request_and_return_time": (
#                     m.get("timestamp").strftime("%Y-%m-%d %H:%M:%S")
#                     if m.get("timestamp") else "-"
#                 ),
#                 "diagnosis_detail":     "-"
#             })
#     except Exception:
#         # 인증 실패 등 오류 시 Mongo 로그 무시
#         pass
#     finally:
#         if client:
#             client.close()

#     # 5) 시간순 정렬 후 반환
#     combined.sort(key=lambda x: x["request_and_return_time"], reverse=True)
#     return Response(combined, status=status.HTTP_200_OK)


# -----------0610------------
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


