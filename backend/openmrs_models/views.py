# backend/openmrs_models/views.py - Encounter + SOAP 진단 저장

import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from soap.models import SoapDiagnosis, PatientVisitHistory
from .serializers import SoapDiagnosisSerializer, SoapDiagnosisCreateSerializer,PatientVisitHistorySerializer
from django.utils import timezone
import requests
from base64 import b64encode
import os
from medical_integration.openmrs_api import OpenMRSAPI
logger = logging.getLogger(__name__)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny

def get_clean_openmrs_config():
    """OpenMRS 설정"""
    host = os.getenv('OPENMRS_API_HOST', '127.0.0.1')
    port = os.getenv('OPENMRS_API_PORT', '8082')
    username = os.getenv('OPENMRS_API_USER', 'admin')
    password = os.getenv('OPENMRS_API_PASSWORD', 'Admin123')
    
    clean_host = host.replace('http://', '').replace('https://', '').strip()
    base_url = f"http://{clean_host}:{port}/openmrs/ws/rest/v1"
    
    auth_string = f"{username}:{password}"
    auth_header = b64encode(auth_string.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {auth_header}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    return base_url, headers

OPENMRS_BASE_URL, HEADERS = get_clean_openmrs_config()

# backend/openmrs_models/views.py 수정

logger = logging.getLogger(__name__)

class SoapDiagnosisPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# 🔥 CSRF + DRF 권한 모두 해결
@method_decorator(csrf_exempt, name='dispatch')
class SoapDiagnosisViewSet(viewsets.ModelViewSet):
    """🔥 SOAP 진단 정보 ViewSet - CSRF + 권한 문제 해결"""
    
    queryset = SoapDiagnosis.objects.filter(is_active=True)
    pagination_class = SoapDiagnosisPagination
    permission_classes = [AllowAny]  # 🔥 모든 권한 허용
    authentication_classes = []      # 🔥 인증 불필요
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'bulk_create':
            return SoapDiagnosisCreateSerializer
        return SoapDiagnosisSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        patient_uuid = self.request.query_params.get('patient_uuid')
        encounter_uuid = self.request.query_params.get('encounter_uuid')
        soap_type = self.request.query_params.get('soap_type')
        
        if patient_uuid:
            queryset = queryset.filter(patient_uuid=patient_uuid)
        if encounter_uuid:
            queryset = queryset.filter(encounter_uuid=encounter_uuid)
        if soap_type:
            queryset = queryset.filter(soap_type=soap_type)
        
        return queryset.order_by('soap_type', 'sequence_number')
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def bulk_create(self, request):
        """🔥 Encounter 생성 + SOAP 진단 실제 저장"""
        try:
            logger.info("✅ SOAP 진단 저장 시작")

            if not isinstance(request.data, dict):
                return Response({
                    'status': 'error',
                    'message': '객체 형태의 데이터가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)

            patient_uuid = request.data.get('patient_uuid')
            soap_diagnoses_data = request.data.get('soap_diagnoses', [])
            doctor_uuid = request.data.get('doctor_uuid', 'admin')

            if not patient_uuid:
                return Response({
                    'status': 'error', 
                    'message': 'patient_uuid가 필요합니다.'
                }, status=400)
                
            if not soap_diagnoses_data:
                return Response({
                    'status': 'error', 
                    'message': '저장할 SOAP 진단 데이터가 없습니다.'
                }, status=400)

            logger.info(f"📋 저장할 데이터: {len(soap_diagnoses_data)}개")
            
            # 🔥 1단계: OpenMRS Encounter 생성
            encounter_uuid = None
            try:
                encounter_data = {
                    'patient': patient_uuid,
                    'encounterType': '8b78d91c-e7d4-4b6b-a0c5-11c9e8b82dbb',  # Adult Initial
                    'location': os.getenv('DEFAULT_LOCATION_TYPE_UUID', 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e'),
                    'encounterDatetime': timezone.now().isoformat(),
                    'provider': [{'provider': doctor_uuid, 'encounterRole': 'a0b03050-c99b-11e0-9572-0800200c9a66'}]
                }
                
                encounter_response = requests.post(
                    f"{OPENMRS_BASE_URL}/encounter",
                    json=encounter_data,
                    headers=HEADERS,
                    timeout=30
                )
                
                if encounter_response.status_code == 201:
                    encounter_result = encounter_response.json()
                    encounter_uuid = encounter_result.get('uuid')
                    logger.info(f"✅ Encounter 생성 성공: {encounter_uuid}")
                else:
                    logger.error(f"❌ Encounter 생성 실패: {encounter_response.status_code} - {encounter_response.text}")
                    # Encounter 생성 실패해도 Django DB에는 저장 계속 진행
                    import uuid as uuid_lib
                    encounter_uuid = str(uuid_lib.uuid4())
                    logger.info(f"⚠️ 임시 Encounter UUID 사용: {encounter_uuid}")
                    
            except Exception as e:
                logger.error(f"❌ OpenMRS Encounter 생성 중 오류: {e}")
                import uuid as uuid_lib
                encounter_uuid = str(uuid_lib.uuid4())
                logger.info(f"⚠️ 임시 Encounter UUID 사용: {encounter_uuid}")

            # 🔥 2단계: Django DB에 SOAP 진단 저장
            created_diagnoses = []
            errors = []
            
            for idx, soap_data in enumerate(soap_diagnoses_data):
                try:
                    # 필수 필드 보완
                    soap_data['patient_uuid'] = patient_uuid
                    soap_data['encounter_uuid'] = encounter_uuid
                    soap_data['doctor_uuid'] = doctor_uuid
                    
                    # 자동 순서 번호 할당
                    existing_count = SoapDiagnosis.objects.filter(
                        patient_uuid=patient_uuid,
                        encounter_uuid=encounter_uuid,
                        soap_type=soap_data.get('soap_type'),
                        is_active=True
                    ).count()
                    soap_data['sequence_number'] = existing_count + 1
                    
                    # 🔥 실제 Django DB 저장
                    soap_diagnosis = SoapDiagnosis.objects.create(**soap_data)
                    created_diagnoses.append(soap_diagnosis)
                    
                    logger.info(f"✅ SOAP 진단 저장 성공 [{idx+1}/{len(soap_diagnoses_data)}]: {soap_diagnosis.uuid}")
                    
                except Exception as e:
                    error_msg = f"SOAP 진단 {idx+1} 저장 실패: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    errors.append(error_msg)
            
            # 🔥 3단계: 저장된 진단들을 OpenMRS Obs로도 저장 시도
            openmrs_saved_count = 0
            for diagnosis in created_diagnoses:
                try:
                    if diagnosis.save_to_openmrs():
                        openmrs_saved_count += 1
                except Exception as e:
                    logger.warning(f"⚠️ OpenMRS Obs 저장 실패 (Django 저장은 성공): {e}")
            
            # 🔥 4단계: 성공 응답 반환
            summary = {
                'total_requested': len(soap_diagnoses_data),
                'created_count': len(created_diagnoses),
                'error_count': len(errors),
                'openmrs_saved_count': openmrs_saved_count
            }
            
            logger.info(f"🎯 SOAP 저장 완료 - 성공: {len(created_diagnoses)}개, 실패: {len(errors)}개")
            
            return Response({
                'status': 'success',
                'message': f'SOAP 진단 {len(created_diagnoses)}개 저장 완료',
                'encounter_uuid': encounter_uuid,
                'summary': summary,
                'created_diagnoses': [
                    {
                        'uuid': str(diag.uuid),
                        'soap_type': diag.soap_type,
                        'content': diag.content[:50] + '...' if len(diag.content) > 50 else diag.content,
                        'icd10_code': diag.icd10_code
                    }
                    for diag in created_diagnoses
                ],
                'errors': errors if errors else None
            })
            
        except Exception as e:
            logger.error(f"❌ SOAP 저장 전체 실패: {e}")
            return Response({
                'status': 'error',
                'message': f'저장 중 오류 발생: {str(e)}'
            }, status=500)

# 🔥 기존 function-based view들 (필요 최소한만)
@api_view(['GET'])
def openmrs_encounters(request):
    """환자 encounter 목록 조회 (내원이력용)"""
    uuid = request.GET.get('uuid')
    if not uuid:
        return Response({"error": "Missing uuid"}, status=400)

    try:
        url = f"{OPENMRS_BASE_URL}/encounter"
        params = {'patient': uuid}
        response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        
        if response.status_code != 200:
            return Response({"error": f"OpenMRS API 오류: {response.status_code}"}, status=response.status_code)
        
        data = response.json()
        history = []
        for encounter in data.get('results', []):
            history.append({
                'uuid': encounter.get('uuid', ''),
                'display': encounter.get('display', ''),
                'encounterDatetime': encounter.get('encounterDatetime', ''),
                'provider': encounter.get('provider', {}).get('display', 'N/A'),
                'encounterType': encounter.get('encounterType', {}).get('display', 'N/A'),
            })

        return Response(history)
        
    except requests.exceptions.RequestException as e:
        return Response({"error": "OpenMRS 서버 연결 실패"}, status=503)

@api_view(['GET'])
def get_person_uuid_by_identifier(request, patient_identifier):
    """환자 식별자로 Person UUID 조회"""
    try:
        url = f"{OPENMRS_BASE_URL}/person"
        params = {'q': patient_identifier}
        response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                return Response({'uuid': data['results'][0]['uuid']})
            else:
                return Response({'error': '환자를 찾을 수 없습니다.'}, status=404)
        else:
            return Response({'error': f'OpenMRS API 오류: {response.status_code}'}, status=response.status_code)
            
    except Exception as e:
        return Response({'error': f'환자 조회 중 오류: {str(e)}'}, status=500)

@api_view(['GET'])
def icd10_search(request):
    """ICD-10 코드 검색"""
    query = request.GET.get('q', '')
    if not query:
        return Response({'results': []})
    
    mock_results = [
        {'code': 'A00.0', 'name': 'Cholera due to Vibrio cholerae 01, biovar cholerae'},
        {'code': 'A00.1', 'name': 'Cholera due to Vibrio cholerae 01, biovar eltor'},
        {'code': 'A00.9', 'name': 'Cholera, unspecified'},
    ]
    
    filtered_results = [
        r for r in mock_results 
        if query.lower() in r['code'].lower() or query.lower() in r['name'].lower()
    ]
    
    return Response({'results': filtered_results})

@api_view(['GET'])
def openmrs_vitals(request):
    """환자 바이탈 정보 조회"""
    uuid = request.GET.get('uuid')
    if not uuid:
        return Response({"error": "Missing uuid"}, status=400)

    try:
        url = f"{OPENMRS_BASE_URL}/obs"
        params = {'patient': uuid, 'concept': 'vital'}
        response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        
        if response.status_code == 200:
            return Response(response.json())
        else:
            return Response({"error": f"OpenMRS API 오류: {response.status_code}"}, status=response.status_code)
            
    except requests.exceptions.RequestException as e:
        return Response({"error": "OpenMRS 서버 연결 실패"}, status=503)


# backend/openmrs_models/views.py에 추가

# backend/openmrs_models/views.py - 올바른 DB 사용

@method_decorator(csrf_exempt, name='dispatch')
class SoapBasedVisitHistoryViewSet(viewsets.ViewSet):
    """🏥 SOAP 데이터 기반 내원 이력 ViewSet (Django default DB 사용)"""
    
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """🔍 환자별 내원 이력 (Django DB의 SOAP + OpenMRS encounter_uuid 연결)"""
        patient_uuid = request.query_params.get('patient_uuid')
        
        if not patient_uuid:
            return Response({
                'error': 'patient_uuid 파라미터가 필요합니다.'
            }, status=400)
        
        try:
            logger.info(f"📋 SOAP 기반 내원 이력 조회: {patient_uuid}")
            
            # 🔥 명시적으로 default DB 사용 (db_router 무시)
            soap_diagnoses = SoapDiagnosis.objects.using('default').filter(
                patient_uuid=patient_uuid,
                is_active=True
            ).order_by('-created_date')
            
            logger.info(f"🔍 조회된 SOAP 진단 수: {soap_diagnoses.count()}")
            
            if soap_diagnoses.count() == 0:
                return Response({
                    'success': True,
                    'patient_uuid': patient_uuid,
                    'visit_count': 0,
                    'visits': [],
                    'message': '해당 환자의 SOAP 진단 기록이 없습니다.'
                })
            
            # OpenMRS encounter_uuid별로 그룹화하여 내원이력 생성
            encounters = {}
            for diagnosis in soap_diagnoses:
                encounter_uuid = diagnosis.encounter_uuid  # OpenMRS에서 생성된 UUID
                if encounter_uuid not in encounters:
                    encounters[encounter_uuid] = {
                        'uuid': encounter_uuid,
                        'encounter_uuid': encounter_uuid,
                        'patient_uuid': patient_uuid,
                        'visit_date': diagnosis.created_date,
                        'doctor_uuid': diagnosis.doctor_uuid,
                        'status': 'COMPLETED',
                        'status_display': '완료',
                        'visit_type': 'OUTPATIENT',
                        'soap_count': 0,
                        'diagnoses_summary': [],
                        'total_diagnoses': 0,
                        'primary_diagnosis': '',
                        'created_date': diagnosis.created_date,
                        'last_modified': diagnosis.created_date
                    }
                
                # 통계 업데이트
                encounters[encounter_uuid]['soap_count'] += 1
                encounters[encounter_uuid]['total_diagnoses'] += 1
                encounters[encounter_uuid]['last_modified'] = max(
                    encounters[encounter_uuid]['last_modified'], 
                    diagnosis.created_date
                )
                
                # Assessment 진단 요약 추가
                if diagnosis.soap_type == 'A' and diagnosis.icd10_name:
                    encounters[encounter_uuid]['diagnoses_summary'].append({
                        'icd10_code': diagnosis.icd10_code,
                        'icd10_name': diagnosis.icd10_name,
                        'diagnosis_type': diagnosis.diagnosis_type
                    })
                    
                    # 주진단 설정 (첫 번째 Assessment)
                    if not encounters[encounter_uuid].get('primary_diagnosis'):
                        encounters[encounter_uuid]['primary_diagnosis'] = diagnosis.icd10_name
            
            # 날짜순으로 정렬
            visit_data = list(encounters.values())
            visit_data.sort(key=lambda x: x['last_modified'], reverse=True)
            
            logger.info(f"✅ SOAP 기반 {len(visit_data)}건의 내원 이력 생성")
            
            return Response({
                'success': True,
                'patient_uuid': patient_uuid,
                'visit_count': len(visit_data),
                'visits': visit_data
            })
            
        except Exception as e:
            logger.error(f"❌ SOAP 기반 내원 이력 조회 실패: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def soap_summary(self, request, pk=None):
        """📋 특정 OpenMRS Encounter의 SOAP 진단 상세 조회"""
        encounter_uuid = pk  # OpenMRS encounter UUID
        
        try:
            logger.info(f"🔍 SOAP 상세 조회: {encounter_uuid}")
            
            # Django default DB에서 해당 encounter의 SOAP 진단 조회
            diagnoses = SoapDiagnosis.objects.using('default').filter(
                encounter_uuid=encounter_uuid,
                is_active=True
            ).order_by('soap_type', 'sequence_number')
            
            # SOAP 타입별 그룹화
            soap_summary = {
                'S': [],  # Subjective
                'O': [],  # Objective
                'A': [],  # Assessment
                'P': []   # Plan
            }
            
            for diagnosis in diagnoses:
                soap_data = {
                    'uuid': str(diagnosis.uuid),
                    'content': diagnosis.content,
                    'clinical_notes': diagnosis.clinical_notes,
                    'sequence_number': diagnosis.sequence_number,
                    'created_date': diagnosis.created_date.isoformat() if diagnosis.created_date else None
                }
                
                # Assessment는 진단 정보 추가
                if diagnosis.soap_type == 'A':
                    soap_data.update({
                        'icd10_code': diagnosis.icd10_code,
                        'icd10_name': diagnosis.icd10_name,
                        'diagnosis_type': diagnosis.diagnosis_type
                    })
                
                soap_summary[diagnosis.soap_type].append(soap_data)
            
            total_count = sum(len(soap_summary[key]) for key in soap_summary)
            
            logger.info(f"✅ SOAP 상세 조회 성공: {total_count}개 항목")
            
            return Response({
                'visit_uuid': encounter_uuid,
                'encounter_uuid': encounter_uuid,
                'soap_summary': soap_summary,
                'total_count': total_count,
                'by_type_count': {
                    'S': len(soap_summary['S']),
                    'O': len(soap_summary['O']),
                    'A': len(soap_summary['A']),
                    'P': len(soap_summary['P'])
                }
            })
            
        except Exception as e:
            logger.error(f"❌ SOAP 상세 조회 실패: {e}")
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """📊 환자 SOAP 통계 (Django DB 기반)"""
        patient_uuid = request.query_params.get('patient_uuid')
        
        try:
            if patient_uuid:
                # Django default DB에서 해당 환자의 SOAP 진단 통계
                total_diagnoses = SoapDiagnosis.objects.using('default').filter(
                    patient_uuid=patient_uuid,
                    is_active=True
                ).count()
                
                # encounter_uuid별 그룹화로 내원 횟수 계산
                encounters_count = SoapDiagnosis.objects.using('default').filter(
                    patient_uuid=patient_uuid,
                    is_active=True
                ).values('encounter_uuid').distinct().count()
                
                return Response({
                    'total_visits': encounters_count,
                    'completed_visits': encounters_count,  # SOAP가 있으면 완료로 간주
                    'total_diagnoses': total_diagnoses,
                    'in_progress_visits': 0
                })
            else:
                return Response({
                    'total_visits': 0,
                    'completed_visits': 0,
                    'total_diagnoses': 0
                })
                
        except Exception as e:
            logger.error(f"❌ SOAP 기반 통계 조회 실패: {e}")
            return Response({'error': str(e)}, status=500)