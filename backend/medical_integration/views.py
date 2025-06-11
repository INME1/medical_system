from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging
from django.conf import settings
from datetime import datetime
from .openmrs_api import OpenMRSAPI
from .orthanc_api import OrthancAPI
from .models import PatientMapping, Alert
from .serializers import AlertSerializer
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from .dicom_patient_mapper import DicomPatientMapper
from rest_framework.views import APIView
import tempfile
import os
import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import RequestException, ConnectionError, Timeout
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger('medical_integration')

@api_view(['GET'])
def health_check(request):
    """시스템 상태 확인"""
    return Response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Django 의료 통합 API'
    })

@api_view(['GET'])
def test_all_connections(request):
    """모든 외부 서비스 연결 테스트"""
    results = {'openmrs': False, 'orthanc': False}
    try:
        openmrs_api = OpenMRSAPI()
        session_info = openmrs_api.get_session()
        if session_info and not session_info.get('error'):
            results['openmrs'] = True
            logger.info("OpenMRS 연결 성공")
    except Exception as e:
        logger.error(f"OpenMRS 연결 실패: {e}")
    try:
        orthanc_api = OrthancAPI()
        if orthanc_api.test_connection():
            results['orthanc'] = True
            logger.info("Orthanc 연결 성공")
    except Exception as e:
        logger.error(f"Orthanc 연결 실패: {e}")
    return Response({'status': 'success' if all(results.values()) else 'partial' if any(results.values()) else 'failure','connections': results})

# Alert API Views
class UrgentAlertList(APIView):
    """읽지 않은 알림 전체 리스트 조회"""
    def get(self, request):
        qs = Alert.objects.filter(is_read=False).order_by('-created_at')
        data = AlertSerializer(qs, many=True).data
        return Response(data)

class UrgentAlertCount(APIView):
    """읽지 않은 알림 개수 조회"""
    def get(self, request):
        count = Alert.objects.filter(is_read=False).count()
        return Response({'count': count})

class AlertMarkRead(APIView):
    """특정 알림을 읽음 처리"""
    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        alert.is_read = request.data.get('is_read', True)
        alert.save()
        return Response({'success': True})

@api_view(['GET'])
def search_patients(request):
    """OpenMRS에서 환자 검색"""
    query = request.GET.get('q', '')
    if not query:
        return Response({'error': '검색어(q)가 필요합니다'}, status=status.HTTP_400_BAD_REQUEST)
    api = OpenMRSAPI()
    results = api.search_patients(query)
    if results is None:
        return Response({'error': '환자 검색에 실패했습니다'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    patients=[]
    for result in results.get('results', []):
        display_name = result.get('display','')
        identifiers = result.get('identifiers',[])
        primary=None; all_ids=[]
        for idf in identifiers:
            val=idf.get('identifier')
            if val: all_ids.append(val)
            if idf.get('preferred') and not primary: primary=val
        if not primary and all_ids: primary=all_ids[0]
        patients.append({
            'uuid': result.get('uuid'),
            'patient_identifier': primary,
            'all_identifiers': all_ids,
            'name': display_name,
            'display': display_name,
            'gender': result.get('person',{}).get('gender'),
            'birthdate': result.get('person',{}).get('birthdate'),
            'age': result.get('person',{}).get('age'),
            'identifiers': identifiers
        })
    logger.info(f"환자 검색 결과: {len(patients)}명 (검색어: {query})")
    return Response({'results':patients,'total':len(patients),'search_query':query})

@api_view(['GET'])
def get_patient(request, uuid):
    """UUID로 환자 상세 정보 조회"""
    api = OpenMRSAPI()
    patient = api.get_patient(uuid)
    
    if patient is None:
        return Response({'error': f'UUID {uuid}인 환자를 찾을 수 없습니다'}, status=status.HTTP_404_NOT_FOUND)
    
    # 환자 데이터 형식 지정
    formatted_patient = {
        'uuid': patient.get('uuid'),
        'identifier': next((id.get('identifier') for id in patient.get('identifiers', [])), None),
        'identifiers': [
            {
                'identifier': id.get('identifier'),
                'identifierType': id.get('identifierType', {}).get('display')
            } for id in patient.get('identifiers', [])
        ],
        'name': f"{patient.get('person', {}).get('preferredName', {}).get('givenName', '')} {patient.get('person', {}).get('preferredName', {}).get('familyName', '')}",
        'names': [
            {
                'givenName': name.get('givenName'),
                'middleName': name.get('middleName'),
                'familyName': name.get('familyName'),
                'preferred': name.get('preferred', False)
            } for name in patient.get('person', {}).get('names', [])
        ],
        'gender': patient.get('person', {}).get('gender'),
        'birthdate': patient.get('person', {}).get('birthdate'),
        'age': patient.get('person', {}).get('age'),
        'addresses': [
            {
                'address1': addr.get('address1'),
                'address2': addr.get('address2'),
                'cityVillage': addr.get('cityVillage'),
                'stateProvince': addr.get('stateProvince'),
                'country': addr.get('country'),
                'postalCode': addr.get('postalCode'),
                'preferred': addr.get('preferred', False)
            } for addr in patient.get('person', {}).get('addresses', [])
        ],
        'attributes': [
            {
                'attributeType': attr.get('attributeType', {}).get('display'),
                'value': attr.get('value')
            } for attr in patient.get('person', {}).get('attributes', [])
        ],
        'dead': patient.get('person', {}).get('dead', False),
        'deathDate': patient.get('person', {}).get('deathDate'),
        'causeOfDeath': patient.get('person', {}).get('causeOfDeath', {}).get('display') if patient.get('person', {}).get('causeOfDeath') else None
    }
    
    return Response(formatted_patient)

@api_view(['GET'])
def get_patient_by_identifier(request, identifier):
    """Patient Identifier로 환자 조회"""
    try:
        api = OpenMRSAPI()
        patient = api.get_patient_by_identifier(identifier)
        
        if not patient:
            return Response({
                'error': f'Patient Identifier "{identifier}"에 해당하는 환자를 찾을 수 없습니다'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 환자 데이터 형식 지정
        formatted_patient = {
            'uuid': patient.get('uuid'),
            'patient_identifier': identifier,
            'display': patient.get('display'),
            'identifiers': patient.get('identifiers', []),
            'person': patient.get('person', {}),
            'addresses': patient.get('person', {}).get('addresses', []),
            'attributes': patient.get('person', {}).get('attributes', [])
        }
        
        return Response(formatted_patient)
        
    except Exception as e:
        logger.error(f"Patient Identifier 환자 조회 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST', 'OPTIONS'])
def create_patient(request):
    """🔥 수정: OpenMRS에 새 환자 생성 - patient_identifier 기반"""
    
    if request.method == 'OPTIONS':
        response = Response(status=status.HTTP_200_OK)
        response['Allow'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    api = OpenMRSAPI()
    
    try:
        data = request.data
        logger.info(f"환자 생성 요청 데이터: {data}")
        
        # 필수 필드 검증
        required_fields = ['givenName', 'familyName', 'gender', 'birthdate']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return Response({
                'error': f'필수 필드가 누락되었습니다: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 🔥 핵심 수정: patient_identifier 처리
        patient_identifier = data.get('patient_identifier', '').strip()
        if patient_identifier:
            # React에서 입력받은 patient_identifier 사용 (P003, DCM001 등)
            logger.info(f"React에서 입력받은 Patient Identifier: {patient_identifier}")
            
            # 🔥 중복 확인
            if api.check_identifier_exists(patient_identifier):
                return Response({
                    'success': False,
                    'error': f'Patient Identifier "{patient_identifier}"가 이미 존재합니다. 다른 식별자를 사용해주세요.'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # patient_identifier가 없으면 자동 생성
            patient_identifier = api.generate_unique_identifier()
            logger.info(f"자동 생성된 Patient Identifier: {patient_identifier}")
        
        # 🔥 수정된 API 호출
        result = api.create_patient_with_identifier(data, patient_identifier)
        
        if result is None:
            return Response({
                'success': False,
                'error': '환자 생성에 실패했습니다.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 🔥 수정된 응답 데이터
        response_data = {
            'success': True,
            'message': '환자가 성공적으로 생성되었습니다',
            'patient': {
                'uuid': result.get('uuid'),
                'display': result.get('display'),
                'identifiers': result.get('identifiers', []),
                'patient_identifier': patient_identifier,  # 🔥 핵심: DICOM 매핑용 patient_identifier
                'internal_id': result.get('uuid')  # OpenMRS 내부 UUID
            }
        }
        
        logger.info(f"환자 생성 완료 - OpenMRS UUID: {result.get('uuid')}, Patient Identifier: {patient_identifier}")
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"환자 생성 실패: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': f'서버 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# 환자 매핑 관련 API

@api_view(['GET'])
def get_patient_mappings(request):
    """모든 환자 매핑 조회"""
    try:
        mappings = PatientMapping.get_active_mappings()
        
        data = []
        for mapping in mappings:
            mapping_data = {
                'mapping_id': mapping.mapping_id,
                'orthanc_patient_id': mapping.orthanc_patient_id,
                'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
                'created_date': mapping.created_date.isoformat() if mapping.created_date else None,
                'last_sync': mapping.last_sync.isoformat() if mapping.last_sync else None,
                'sync_status': mapping.sync_status,
                'error_message': mapping.error_message,
                'is_active': mapping.is_active
            }
            data.append(mapping_data)
        
        return Response({
            'results': data,
            'total': len(data)
        })
        
    except Exception as e:
        logger.error(f"환자 매핑 조회 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_patient_mapping(request):
    """새 환자 매핑 생성"""
    try:
        orthanc_patient_id = request.data.get('orthanc_patient_id')
        openmrs_patient_uuid = request.data.get('openmrs_patient_uuid')
        
        if not orthanc_patient_id or not openmrs_patient_uuid:
            return Response({
                'error': 'orthanc_patient_id와 openmrs_patient_uuid가 모두 필요합니다'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 중복 매핑 확인
        existing_mapping = PatientMapping.objects.filter(
            orthanc_patient_id=orthanc_patient_id,
            openmrs_patient_uuid=openmrs_patient_uuid
        ).first()
        
        if existing_mapping:
            return Response({
                'error': '이미 존재하는 매핑입니다',
                'existing_mapping_id': existing_mapping.mapping_id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 새 매핑 생성
        mapping = PatientMapping.objects.create(
            orthanc_patient_id=orthanc_patient_id,
            openmrs_patient_uuid=openmrs_patient_uuid
        )
        
        # 매핑 검증
        validation_errors = mapping.validate_mapping()
        if validation_errors:
            mapping.update_sync_time(status='ERROR', error_message='; '.join(validation_errors))
            logger.warning(f"매핑 검증 실패: {validation_errors}")
        else:
            mapping.update_sync_time(status='SYNCED')
            logger.info(f"새 환자 매핑 생성됨: {mapping}")
        
        return Response({
            'mapping_id': mapping.mapping_id,
            'orthanc_patient_id': mapping.orthanc_patient_id,
            'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
            'created_date': mapping.created_date.isoformat(),
            'sync_status': mapping.sync_status,
            'validation_errors': validation_errors if validation_errors else None
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"환자 매핑 생성 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_patient_mapping(request, mapping_id):
    """특정 환자 매핑 조회"""
    try:
        mapping = PatientMapping.objects.get(mapping_id=mapping_id, is_active=True)
        
        # 연결된 환자 정보도 함께 조회
        orthanc_info = mapping.get_orthanc_patient_info()
        openmrs_info = mapping.get_openmrs_patient_info()
        
        return Response({
            'mapping': {
                'mapping_id': mapping.mapping_id,
                'orthanc_patient_id': mapping.orthanc_patient_id,
                'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
                'created_date': mapping.created_date.isoformat(),
                'last_sync': mapping.last_sync.isoformat() if mapping.last_sync else None,
                'sync_status': mapping.sync_status,
                'error_message': mapping.error_message,
            },
            'orthanc_patient': orthanc_info,
            'openmrs_patient': openmrs_info
        })
        
    except PatientMapping.DoesNotExist:
        return Response({'error': '매핑을 찾을 수 없습니다'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"환자 매핑 조회 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_patient_mapping(request, mapping_id):
    """환자 매핑 삭제 (비활성화)"""
    try:
        mapping = PatientMapping.objects.get(mapping_id=mapping_id, is_active=True)
        mapping.is_active = False
        mapping.save(update_fields=['is_active'])
        
        logger.info(f"환자 매핑 비활성화됨: {mapping}")
        
        return Response({
            'success': True,
            'message': '매핑이 비활성화되었습니다'
        })
        
    except PatientMapping.DoesNotExist:
        return Response({'error': '매핑을 찾을 수 없습니다'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"환자 매핑 삭제 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def sync_patient_mapping(request, mapping_id):
    """환자 매핑 동기화 상태 업데이트"""
    try:
        mapping = PatientMapping.objects.get(mapping_id=mapping_id, is_active=True)
        
        # 매핑 검증
        validation_errors = mapping.validate_mapping()
        
        if validation_errors:
            mapping.update_sync_time(status='ERROR', error_message='; '.join(validation_errors))
            return Response({
                'success': False,
                'sync_status': 'ERROR',
                'error_message': '; '.join(validation_errors),
                'last_sync': mapping.last_sync.isoformat()
            })
        else:
            mapping.update_sync_time(status='SYNCED')
            return Response({
                'success': True,
                'sync_status': 'SYNCED',
                'last_sync': mapping.last_sync.isoformat()
            })
        
    except PatientMapping.DoesNotExist:
        return Response({'error': '매핑을 찾을 수 없습니다'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"환자 매핑 동기화 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_orthanc_patients(request):
    """Orthanc에서 환자 검색"""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'error': '검색어(q)가 필요합니다'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        orthanc_api = OrthancAPI()
        results = orthanc_api.search_patients_by_name(query)
        
        patients = []
        for result in results:
            patient_info = result.get('patient_info', {})
            main_tags = patient_info.get('MainDicomTags', {})
            
            patient = {
                'patient_id': result.get('patient_id'),
                'patient_name': main_tags.get('PatientName', ''),
                'patient_birth_date': main_tags.get('PatientBirthDate', ''),
                'patient_sex': main_tags.get('PatientSex', ''),
                'patient_id_dicom': main_tags.get('PatientID', ''),
                'studies_count': len(patient_info.get('Studies', [])),
                'last_update': patient_info.get('LastUpdate', '')
            }
            patients.append(patient)
        
        return Response({
            'results': patients,
            'total': len(patients)
        })
        
    except Exception as e:
        logger.error(f"Orthanc 환자 검색 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_orthanc_patient(request, patient_id):
    """Orthanc 환자 상세 정보 조회"""
    try:
        orthanc_api = OrthancAPI()
        patient_info = orthanc_api.get_patient(patient_id)
        
        if not patient_info:
            return Response({'error': f'Orthanc에서 환자 {patient_id}를 찾을 수 없습니다'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Studies 정보도 함께 조회
        studies = orthanc_api.get_patient_studies(patient_id)
        
        formatted_patient = {
            'patient_id': patient_id,
            'main_dicom_tags': patient_info.get('MainDicomTags', {}),
            'studies': studies or [],
            'studies_count': len(studies) if studies else 0,
            'last_update': patient_info.get('LastUpdate', ''),
            'type': patient_info.get('Type', ''),
            'is_stable': patient_info.get('IsStable', False)
        }
        
        return Response(formatted_patient)
        
    except Exception as e:
        logger.error(f"Orthanc 환자 조회 실패: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@csrf_exempt
@api_view(['POST'])
def upload_dicom_with_auto_mapping(request):
    """DICOM 파일 업로드 및 자동 환자 매핑"""
    try:
        # 파일 확인
        if 'dicom_file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'DICOM 파일이 없습니다'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        dicom_file = request.FILES['dicom_file']
        
        logger.info(f"DICOM 자동 매핑 업로드 시작: {dicom_file.name}")
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dcm') as temp_file:
            for chunk in dicom_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
            # DICOM 데이터 읽기
            with open(temp_file_path, 'rb') as f:
                dicom_data = f.read()
            
            # Orthanc에 업로드
            orthanc_api = OrthancAPI()
            upload_result = orthanc_api.upload_dicom(dicom_data)
            
            if not upload_result:
                # 에러 알림 생성
                Alert.objects.create(
                type='DELAY', 
                message=f'DICOM 업로드 실패: 파일명 {dicom_file.name}'
                )
                return Response({
                    'success': False,
                    'error': 'Orthanc 업로드에 실패했습니다'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            logger.info(f"Orthanc 업로드 성공: {upload_result}")
            
            # 자동 매핑 처리
            mapper = DicomPatientMapper()
            mapping_result = mapper.process_dicom_upload(dicom_data, upload_result)
            
            # 응답 데이터 구성
            response_data = {
                'upload_result': {
                    'orthanc_instance_id': upload_result.get('ID'),
                    'orthanc_patient_id': upload_result.get('ParentPatient'),
                    'orthanc_study_id': upload_result.get('ParentStudy'),
                    'orthanc_series_id': upload_result.get('ParentSeries'),
                    'status': upload_result.get('Status')
                },
                'mapping_result': mapping_result
            }
            
            if mapping_result and mapping_result.get('success'):
                response_data['success'] = True
                response_data['message'] = 'DICOM 업로드 및 자동 매핑 완료'
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                response_data['success'] = False
                response_data['message'] = 'DICOM 업로드 성공, 자동 매핑 실패'
                return Response(response_data, status=status.HTTP_206_PARTIAL_CONTENT)
            
        finally:
            # 임시 파일 정리
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
    except Exception as e:
        # 전체 예외 처리
        Alert.objects.create(
            type='AI_ERR',
            message=f'DICOM 자동 매핑 중 예외 발생: {str(e)}')
        logger.error(f"DICOM 자동 매핑 업로드 실패: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_patient_dicom_studies(request, patient_uuid):
    """OpenMRS 환자 UUID로 연결된 모든 DICOM Study 조회"""
    try:
        mapper = DicomPatientMapper()
        studies = mapper.get_patient_dicom_studies(patient_uuid)
        
        return Response({
            'success': True,
            'patient_uuid': patient_uuid,
            'studies': studies,
            'total_studies': len(studies)
        })
        
    except Exception as e:
        logger.error(f"환자 DICOM Study 조회 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_manual_patient_mapping(request):
    """수동 환자 매핑 생성"""
    try:
        orthanc_patient_id = request.data.get('orthanc_patient_id')
        openmrs_patient_uuid = request.data.get('openmrs_patient_uuid')
        
        if not orthanc_patient_id or not openmrs_patient_uuid:
            return Response({
                'success': False,
                'error': 'orthanc_patient_id와 openmrs_patient_uuid가 모두 필요합니다'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mapper = DicomPatientMapper()
        result = mapper.create_manual_mapping(orthanc_patient_id, openmrs_patient_uuid)
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            Alert.objects.create(
                type='DELAY',
                message=f'수동 매핑 실패: Orthanc {orthanc_patient_id} → OpenMRS {openmrs_patient_uuid}')
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        Alert.objects.create(
            type='AI_ERR',
            message=f'수동 매핑 중 예외 발생: {str(e)}')
        logger.error(f"수동 매핑 생성 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_unmapped_orthanc_patients(request):
    """매핑되지 않은 Orthanc 환자 목록 조회"""
    try:
        orthanc_api = OrthancAPI()
        all_patients = orthanc_api.get_patients()
        
        if not all_patients:
            return Response({
                'success': True,
                'unmapped_patients': [],
                'total': 0
            })
        
        # 매핑된 환자들 조회
        mapped_patient_ids = set(
            PatientMapping.objects.filter(is_active=True)
            .values_list('orthanc_patient_id', flat=True)
        )
        
        # 매핑되지 않은 환자들 찾기
        unmapped_patients = []
        for patient_id in all_patients:
            if patient_id not in mapped_patient_ids:
                patient_info = orthanc_api.get_patient(patient_id)
                if patient_info:
                    main_tags = patient_info.get('MainDicomTags', {})
                    unmapped_patients.append({
                        'orthanc_patient_id': patient_id,
                        'patient_name': main_tags.get('PatientName', ''),
                        'patient_id_dicom': main_tags.get('PatientID', ''),
                        'patient_birth_date': main_tags.get('PatientBirthDate', ''),
                        'patient_sex': main_tags.get('PatientSex', ''),
                        'studies_count': len(patient_info.get('Studies', [])),
                        'last_update': patient_info.get('LastUpdate', '')
                    })
        
        return Response({
            'success': True,
            'unmapped_patients': unmapped_patients,
            'total': len(unmapped_patients)
        })
        
    except Exception as e:
        logger.error(f"매핑되지 않은 환자 조회 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_dicom_study_details(request, study_id):
    """DICOM Study 상세 정보 조회 (Series, Instance 포함)"""
    try:
        orthanc_api = OrthancAPI()
        study_details = orthanc_api.get_study_with_series_and_instances(study_id)
        
        if not study_details:
            return Response({
                'success': False,
                'error': f'Study를 찾을 수 없습니다: {study_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'study_id': study_id,
            'study_details': study_details
        })
        
    except Exception as e:
        logger.error(f"DICOM Study 상세 조회 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_patient_mapping(request, mapping_id):
    """환자 매핑 삭제"""
    try:
        mapping = PatientMapping.objects.get(mapping_id=mapping_id, is_active=True)
        mapping.is_active = False
        mapping.save(update_fields=['is_active'])
        
        logger.info(f"환자 매핑 삭제됨: {mapping}")
        
        return Response({
            'success': True,
            'message': '매핑이 삭제되었습니다'
        })
        
    except PatientMapping.DoesNotExist:
        return Response({
            'success': False,
            'error': '매핑을 찾을 수 없습니다'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"환자 매핑 삭제 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def batch_auto_mapping(request):
    """기존 Orthanc 환자들에 대한 일괄 자동 매핑"""
    try:
        # 매핑되지 않은 Orthanc 환자들 조회
        orthanc_api = OrthancAPI()
        all_patients = orthanc_api.get_patients()
        
        if not all_patients:
            return Response({
                'success': True,
                'message': 'Orthanc에 환자가 없습니다',
                'results': []
            })
        
        # 이미 매핑된 환자들 제외
        mapped_patient_ids = set(
            PatientMapping.objects.filter(is_active=True)
            .values_list('orthanc_patient_id', flat=True)
        )
        
        unmapped_patients = [pid for pid in all_patients if pid not in mapped_patient_ids]
        
        if not unmapped_patients:
            return Response({
                'success': True,
                'message': '모든 환자가 이미 매핑되어 있습니다',
                'results': []
            })
        
        # 일괄 매핑 처리
        mapper = DicomPatientMapper()
        results = []
        
        for patient_id in unmapped_patients:
            try:
                # 환자의 첫 번째 Study에서 DICOM 정보 추출
                studies = orthanc_api.get_patient_studies(patient_id)
                if studies:
                    study_id = studies[0]
                    series_list = orthanc_api.get_study_series(study_id)
                    if series_list:
                        instances = orthanc_api.get_series_instances(series_list[0])
                        if instances:
                            # 첫 번째 인스턴스의 DICOM 파일 다운로드
                            dicom_data = orthanc_api.get_instance_file(instances[0])
                            if dicom_data:
                                # 가짜 업로드 결과 생성 (이미 업로드된 상태)
                                fake_upload_result = {'ParentPatient': patient_id}
                                mapping_result = mapper.process_dicom_upload(dicom_data, fake_upload_result)
                                
                                results.append({
                                    'orthanc_patient_id': patient_id,
                                    'mapping_result': mapping_result
                                })
                            else:
                                results.append({
                                    'orthanc_patient_id': patient_id,
                                    'mapping_result': {
                                        'success': False,
                                        'message': 'DICOM 데이터를 읽을 수 없음'
                                    }
                                })
                        else:
                            results.append({
                                'orthanc_patient_id': patient_id,
                                'mapping_result': {
                                    'success': False,
                                    'message': 'Instance를 찾을 수 없음'
                                }
                            })
                    else:
                        results.append({
                            'orthanc_patient_id': patient_id,
                            'mapping_result': {
                                'success': False,
                                'message': 'Series를 찾을 수 없음'
                            }
                        })
                else:
                    results.append({
                        'orthanc_patient_id': patient_id,
                        'mapping_result': {
                            'success': False,
                            'message': 'Study를 찾을 수 없음'
                        }
                    })
            except Exception as e:
                logger.error(f"환자 {patient_id} 일괄 매핑 실패: {e}")
                results.append({
                    'orthanc_patient_id': patient_id,
                    'mapping_result': {
                        'success': False,
                        'message': f'처리 중 오류: {str(e)}'
                    }
                })
        
        # 결과 요약
        successful_mappings = [r for r in results if r['mapping_result'].get('success')]
        failed_mappings = [r for r in results if not r['mapping_result'].get('success')]
        
        return Response({
            'success': True,
            'message': f'일괄 매핑 완료: 성공 {len(successful_mappings)}개, 실패 {len(failed_mappings)}개',
            'total_processed': len(results),
            'successful_count': len(successful_mappings),
            'failed_count': len(failed_mappings),
            'results': results
        })
        
    except Exception as e:
        logger.error(f"일괄 자동 매핑 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@api_view(['POST'])
def create_dummy_data(request):
    """더미 데이터 생성 API"""
    try:
        logger.info("더미 데이터 생성 요청 시작")
        
        # 더미 환자 데이터
        dummy_patients = [
            {
                'family_name': '김', 'given_name': '철수', 'gender': 'M', 
                'birth_date': '1985-03-15', 'patient_id': 'DUMMY001'
            },
            {
                'family_name': '이', 'given_name': '영희', 'gender': 'F', 
                'birth_date': '1990-07-22', 'patient_id': 'DUMMY002'
            },
            {
                'family_name': '박', 'given_name': '민수', 'gender': 'M', 
                'birth_date': '1978-11-08', 'patient_id': 'DUMMY003'
            }
        ]
        
        created_patients = []
        created_dicoms = []
        mappings_created = []
        
        # 1. OpenMRS 환자 생성
        openmrs_api = OpenMRSAPI()
        for patient_data in dummy_patients:
            try:
                openmrs_data = {
                    'givenName': patient_data['given_name'],
                    'familyName': patient_data['family_name'],
                    'gender': patient_data['gender'],
                    'birthdate': patient_data['birth_date']
                }
                
                result = openmrs_api.create_patient(openmrs_data)
                if result:
                    created_patients.append({
                        'uuid': result.get('uuid'),
                        'display': result.get('display'),
                        'patient_id': patient_data['patient_id']
                    })
                    logger.info(f"OpenMRS 환자 생성: {result.get('display')}")
            except Exception as e:
                logger.error(f"OpenMRS 환자 생성 실패: {e}")
        
        # 2. Orthanc DICOM 생성 및 업로드
        orthanc_api = OrthancAPI()
        for i, patient_data in enumerate(dummy_patients):
            try:
                # 간단한 더미 DICOM 생성
                dicom_data = create_simple_dummy_dicom(patient_data)
                if dicom_data:
                    upload_result = orthanc_api.upload_dicom(dicom_data)
                    if upload_result:
                        created_dicoms.append({
                            'orthanc_patient_id': upload_result.get('ParentPatient'),
                            'patient_data': patient_data,
                            'upload_result': upload_result
                        })
                        logger.info(f"Orthanc DICOM 업로드: {patient_data['given_name']}")
                        
                        # 3. 자동 매핑 시도
                        if created_patients and i < len(created_patients):
                            mapper = DicomPatientMapper()
                            mapping_result = mapper.process_dicom_upload(dicom_data, upload_result)
                            if mapping_result:
                                mappings_created.append(mapping_result)
                                logger.info(f"자동 매핑 시도 완료: {mapping_result.get('success')}")
            except Exception as e:
                logger.error(f"DICOM 생성/매핑 실패: {e}")
        
        return Response({
            'success': True,
            'message': '더미 데이터 생성 완료',
            'summary': {
                'openmrs_patients_created': len(created_patients),
                'orthanc_dicoms_created': len(created_dicoms),
                'auto_mappings_attempted': len(mappings_created),
                'successful_mappings': len([m for m in mappings_created if m.get('success')])
            },
            'details': {
                'created_patients': created_patients,
                'created_dicoms': [
                    {
                        'orthanc_patient_id': d['orthanc_patient_id'],
                        'patient_name': f"{d['patient_data']['given_name']} {d['patient_data']['family_name']}"
                    } for d in created_dicoms
                ],
                'mapping_results': mappings_created
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"더미 데이터 생성 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def create_simple_dummy_dicom(patient_data):
    """간단한 더미 DICOM 생성"""
    try:
        import pydicom
        from io import BytesIO
        import random
        
        # 기본 DICOM 데이터셋
        ds = pydicom.Dataset()
        
        # 환자 정보
        ds.PatientName = f"{patient_data['family_name']}^{patient_data['given_name']}"
        ds.PatientID = patient_data['patient_id']
        ds.PatientBirthDate = patient_data['birth_date'].replace('-', '')
        ds.PatientSex = patient_data['gender']
        
        # Study 정보
        ds.StudyInstanceUID = pydicom.uid.generate_uid()
        ds.StudyDate = datetime.now().strftime('%Y%m%d')
        ds.StudyTime = datetime.now().strftime('%H%M%S')
        ds.StudyDescription = "Dummy Chest X-Ray"
        ds.AccessionNumber = f"DUMMY{random.randint(1000, 9999)}"
        
        # Series 정보
        ds.SeriesInstanceUID = pydicom.uid.generate_uid()
        ds.SeriesNumber = "1"
        ds.Modality = "CR"
        ds.SeriesDescription = "Dummy CR Series"
        
        # Instance 정보
        ds.SOPInstanceUID = pydicom.uid.generate_uid()
        ds.SOPClassUID = "1.2.840.10008.5.1.4.1.1.1.1"
        ds.InstanceNumber = "1"
        
        # 최소한의 이미지 정보
        ds.Rows = 256
        ds.Columns = 256
        ds.BitsAllocated = 8
        ds.BitsStored = 8
        ds.HighBit = 7
        ds.PixelRepresentation = 0
        ds.SamplesPerPixel = 1
        ds.PhotometricInterpretation = "MONOCHROME2"
        
        # 더미 픽셀 데이터
        pixel_data = bytes([128] * (256 * 256))  # 회색 이미지
        ds.PixelData = pixel_data
        
        # 메타 정보
        ds.file_meta = pydicom.Dataset()
        ds.file_meta.MediaStorageSOPClassUID = ds.SOPClassUID
        ds.file_meta.MediaStorageSOPInstanceUID = ds.SOPInstanceUID
        ds.file_meta.TransferSyntaxUID = pydicom.uid.ExplicitVRLittleEndian
        
        # 바이트로 변환
        buffer = BytesIO()
        ds.save_as(buffer, write_like_original=False)
        return buffer.getvalue()
        
    except Exception as e:
        logger.error(f"더미 DICOM 생성 실패: {e}")
        return None

@api_view(['DELETE'])
def clear_dummy_data(request):
    """더미 데이터 정리 API"""
    try:
        # 더미 환자 식별자로 매핑 찾기
        dummy_mappings = PatientMapping.objects.filter(
            orthanc_patient_id__icontains='DUMMY',
            is_active=True
        )
        
        deleted_count = 0
        for mapping in dummy_mappings:
            try:
                # 매핑 비활성화
                mapping.is_active = False
                mapping.save()
                deleted_count += 1
                logger.info(f"더미 매핑 삭제: {mapping.mapping_id}")
            except Exception as e:
                logger.error(f"매핑 삭제 실패: {e}")
        
        return Response({
            'success': True,
            'message': f'더미 매핑 {deleted_count}개 삭제 완료',
            'deleted_mappings': deleted_count
        })
        
    except Exception as e:
        logger.error(f"더미 데이터 정리 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_mapping_test_status(request):
    """매핑 테스트 상태 조회"""
    try:
        # 더미 매핑들 조회
        dummy_mappings = PatientMapping.objects.filter(
            orthanc_patient_id__icontains='DUMMY',
            is_active=True
        )
        
        # 통계 계산
        total_mappings = dummy_mappings.count()
        auto_mappings = dummy_mappings.filter(mapping_type='AUTO').count()
        manual_mappings = dummy_mappings.filter(mapping_type='MANUAL').count()
        successful_mappings = dummy_mappings.filter(
            sync_status__in=['SYNCED', 'AUTO_MAPPED', 'MANUAL_MAPPED']
        ).count()
        
        mapping_details = []
        for mapping in dummy_mappings:
            mapping_details.append({
                'mapping_id': mapping.mapping_id,
                'orthanc_patient_id': mapping.orthanc_patient_id,
                'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
                'mapping_type': mapping.mapping_type,
                'sync_status': mapping.sync_status,
                'created_date': mapping.created_date.isoformat() if mapping.created_date else None,
                'dicom_studies_count': mapping.get_dicom_studies_count()
            })
        
        return Response({
            'success': True,
            'statistics': {
                'total_dummy_mappings': total_mappings,
                'auto_mappings': auto_mappings,
                'manual_mappings': manual_mappings,
                'successful_mappings': successful_mappings,
                'success_rate': round(successful_mappings / total_mappings * 100, 2) if total_mappings > 0 else 0
            },
            'mappings': mapping_details
        })
        
    except Exception as e:
        logger.error(f"매핑 테스트 상태 조회 실패: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_patients_simple(request):
    """간단한 환자 목록 조회 (커스텀 REST API 기반)"""
    try:
        logger.info("=== 커스텀 환자 목록 조회 시작 ===")

        try:
            openmrs_config = settings.EXTERNAL_SERVICES['openmrs']
            logger.info(f"OpenMRS 설정: {openmrs_config}")
        except Exception as e:
            logger.error(f"설정 오류: {e}")
            return Response({'success': False, 'error': f'OpenMRS 설정 오류: {str(e)}'}, status=500)

        # 파라미터 설정
        limit = request.GET.get('limit', '20')
        start_index = request.GET.get('startIndex', '0')

        openmrs_host = openmrs_config['host']
        openmrs_port = openmrs_config['port']
        openmrs_username = openmrs_config['username']
        openmrs_password = openmrs_config['password']

        #api_url = f"http://{openmrs_host}:{openmrs_port}/openmrs/ws/rest/v1/custompatient"
        api_url = f"http://{openmrs_host}:{openmrs_port}/openmrs/ws/rest/v1/patient"
        params = {
            'limit': limit,
            'startIndex': start_index
        }

        logger.info(f"커스텀 API 요청: {api_url} with params: {params}")

        auth = HTTPBasicAuth(openmrs_username, openmrs_password)
        response = requests.get(api_url, params=params, auth=auth, headers={'Accept': 'application/json'}, timeout=30)

        logger.info(f"OpenMRS 응답 상태: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"OpenMRS API 오류: {response.status_code} - {response.text}")
            return Response({'success': False, 'error': f'OpenMRS API 오류: {response.status_code}'}, status=500)

        data = response.json()
        results = data.get('results', [])

        logger.info(f"총 환자 수: {len(results)}명")

        return Response({
            'success': True,
            'results': results,
            'total': len(results),
            'limit': int(limit),
            'startIndex': int(start_index)
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"OpenMRS 서버 요청 실패: {e}")
        return Response({'success': False, 'error': f'OpenMRS 서버 요청 실패: {str(e)}'}, status=500)

    except Exception as e:
        logger.error(f"전체 오류: {e}", exc_info=True)
        return Response({'success': False, 'error': f'서버 내부 오류: {str(e)}'}, status=500)


def calculate_age_from_birthdate(birthdate):
    """생년월일로 나이 계산"""
    try:
        from datetime import datetime

        # 1. 문자열이며 비어있지 않은 경우만 처리
        if isinstance(birthdate, str) and birthdate:
            # 2. ISO 포맷에서 T 기준으로 앞부분만 취함 (예: '1999-09-15')
            birth_date = datetime.strptime(birthdate.split('T')[0], '%Y-%m-%d')

            # 3. 오늘 날짜와 비교하여 나이 계산
            today = datetime.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

            return age
    except:
        pass

    # 잘못된 포맷이거나 계산 불가 시 None 반환
    return None



@api_view(['GET'])
def get_mapping_status(request):
    """현재 매핑 상태 확인"""
    try:
        from .models import PatientMapping
        
        # 전체 매핑 통계
        total_mappings = PatientMapping.objects.filter(is_active=True).count()
        auto_mappings = PatientMapping.objects.filter(is_active=True, mapping_type='AUTO').count()
        manual_mappings = PatientMapping.objects.filter(is_active=True, mapping_type='MANUAL').count()
        
        # 최근 매핑들
        recent_mappings = PatientMapping.objects.filter(is_active=True).order_by('-created_date')[:10]
        
        mapping_list = []
        for mapping in recent_mappings:
            mapping_list.append({
                'mapping_id': mapping.mapping_id,
                'orthanc_patient_id': mapping.orthanc_patient_id,
                'openmrs_patient_uuid': mapping.openmrs_patient_uuid,
                'mapping_type': mapping.mapping_type,
                'sync_status': mapping.sync_status,
                'created_date': mapping.created_date.isoformat() if mapping.created_date else None,
                'notes': mapping.notes
            })
        
        return Response({
            'success': True,
            'statistics': {
                'total_mappings': total_mappings,
                'auto_mappings': auto_mappings,
                'manual_mappings': manual_mappings
            },
            'recent_mappings': mapping_list
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
def create_test_mapping(request):
    """테스트 매핑 생성"""
    try:
        openmrs_uuid = request.data.get('openmrs_uuid')
        patient_id = request.data.get('patient_id')
        
        if not openmrs_uuid or not patient_id:
            return Response({
                'success': False,
                'error': 'openmrs_uuid와 patient_id가 필요합니다'
            }, status=400)
        
        # 테스트 DICOM 생성 및 업로드 로직은 여기서 구현
        # 지금은 간단한 응답만
        
        return Response({
            'success': True,
            'message': f'테스트 매핑 준비 완료',
            'openmrs_uuid': openmrs_uuid,
            'patient_id': patient_id
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
        
        
# openmrs_integration/views.py (또는 유사한 앱의 views.py)


# openmrs_models 앱의 모델들을 가져옵니다.
# 경로는 실제 프로젝트 구조에 맞게 수정해야 할 수 있습니다.
# 예를 들어, openmrs_models 앱이 backend 디렉토리 바로 아래에 있다면:
# from backend.openmrs_models.models import Patient, Person, PersonName, PatientIdentifier
# 또는 settings.py에 openmrs_models가 INSTALLED_APPS에 등록되어 있다면:
# from openmrs_models.models import Patient, Person # PatientIdentifier, PersonName, 등 필요에 따라 추가
from openmrs_models.models import Patient, Person, PatientIdentifier # 변경: PatientIdentifier 임포트 추가 



@api_view(['GET'])
def get_all_openmrs_patients(request):
    try:
        patients_data = []
        all_patient_entries = Patient.objects.select_related('patient_id').filter(voided=False)

        for patient_entry in all_patient_entries:
            person = patient_entry.patient_id 
            active_name_obj = patient_entry.get_active_name() 
            full_name = active_name_obj.get_full_name() if active_name_obj else "N/A" 

            identifier = person.uuid  
            
            # ✅ 매핑 정보 가져오기
            mapping = PatientMapping.objects.filter(openmrs_patient_uuid=person.uuid, is_active=True).first()
            orthanc_id = mapping.orthanc_patient_id if mapping else None

            patients_data.append({
                "uuid": person.uuid, 
                "identifier": identifier, 
                "display": full_name,
                "person": {
                    "display": full_name, 
                    "gender": person.gender,
                    "birthdate": person.birthdate, 
                },
                "identifiers": [
                    {"identifier": identifier} 
                ],
                "orthanc_patient_id": orthanc_id
            })

        return Response(patients_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# OCS [20250611]
@api_view(['GET'])
def list_openmrs_patients_map(request):
    """
    GET /api/integration/openmrs/patients/map/
    → { results: [{ uuid, id, name }, …] }
    오류나 매핑 없으면 빈 results:[] 로 200 OK
    """
    api_url = settings.OPENMRS_URL.rstrip('/') + '/patient'
    try:
        r = requests.get(api_url, auth=(settings.OPENMRS_USER, settings.OPENMRS_PASS), timeout=10)
        r.raise_for_status()
        pts = r.json().get('results', [])
        out = []
        for p in pts:
            name = p.get('person',{}).get('display') or p.get('display','')
            ids  = p.get('identifiers',[])
            num  = ids[0]['identifier'] if ids else None
            out.append({'uuid':p['uuid'], 'id':num, 'name':name})
        return Response({'results': out}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'results': []}, status=status.HTTP_200_OK)
    
    


@api_view(['GET'])
def proxy_openmrs_providers(request):
    """OpenMRS의 /ws/rest/v1/provider 데이터 프록시"""
    try:
        OPENMRS_HOST = 'http://localhost:8082/openmrs'  # 또는 35.225.63.41:8082/openmrs
        username = 'admin'
        password = 'Admin123'

        res = requests.get(
            f"{OPENMRS_HOST}/ws/rest/v1/provider",
            auth=HTTPBasicAuth(username, password),
            headers={"Accept": "application/json"}
        )

        if res.status_code == 200:
            return Response(res.json())
        return Response({'error': 'OpenMRS 요청 실패'}, status=res.status_code)

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['POST'])
def create_identifier_based_mapping(request):
    """
    IDENTIFIER_BASED 타입의 매핑 생성 (대기창용)
    삭제된 환자가 다시 등록될 수 있도록 기존 매핑을 재활성화
    """
    try:
        orthanc_id = request.data.get("orthanc_patient_id") or f"DUMMY-{timezone.now().strftime('%H%M%S')}"
        openmrs_uuid = request.data.get("openmrs_patient_uuid")
        patient_identifier = request.data.get("patient_identifier")

        if not (openmrs_uuid and patient_identifier):
            return Response({'error': 'UUID 또는 식별자가 누락되었습니다.'}, status=400)

        # ✅ 기존 비활성화된 매핑 재활성화
        existing = PatientMapping.objects.filter(
            openmrs_patient_uuid=openmrs_uuid,
            patient_identifier=patient_identifier,
            mapping_type='IDENTIFIER_BASED',
            is_active=False
        ).first()

        if existing:
            existing.is_active = True
            existing.orthanc_patient_id = orthanc_id  # 최신 ID 반영
            existing.sync_status = "PENDING"
            existing.save(update_fields=['is_active', 'orthanc_patient_id', 'sync_status'])
            return Response({'success': True, 'mapping_id': existing.mapping_id, 'message': '기존 매핑 재활성화됨'}, status=200)

        # 🔥 신규 생성
        mapping = PatientMapping.create_identifier_based_mapping(
            orthanc_patient_id=orthanc_id,
            openmrs_patient_uuid=openmrs_uuid,
            patient_identifier=patient_identifier
        )

        if mapping:
            return Response({'success': True, 'mapping_id': mapping.mapping_id}, status=201)
        return Response({'error': '매핑 생성 실패'}, status=500)

    except Exception as e:
        logger.error(f"[IDENTIFIER_BASED] 매핑 생성 중 예외: {e}")
        return Response({'error': str(e)}, status=500)
    

# OCS [20250611]
@api_view(['GET'])
def list_openmrs_providers_map(request):
    """
    GET /api/integration/openmrs/providers/map/
    → { results: [{ uuid, name }, …] }
    오류나 매핑 없으면 빈 results:[] 로 200 OK
    """
    api_url = settings.OPENMRS_URL.rstrip('/') + '/provider'
    try:
        r = requests.get(api_url, auth=(settings.OPENMRS_USER, settings.OPENMRS_PASS), timeout=10)
        r.raise_for_status()
        provs = r.json().get('results', [])
        out = [{'uuid':u['uuid'], 'name':u.get('display','')} for u in provs]
        return Response({'results': out}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'results': []}, status=status.HTTP_200_OK)







@api_view(['GET'])
def openmrs_patients_with_mapping(request):
    """
    OpenMRS 환자 목록 + 매핑된 Orthanc ID 포함
    """
    result = []
    mappings = PatientMapping.objects.filter(mapping_type="IDENTIFIER_BASED")

    for mapping in mappings:
        patient_data = OpenMRSAPI().get_patient(mapping.openmrs_patient_uuid)
        if patient_data:
            patient_data['orthanc_patient_id'] = mapping.orthanc_patient_id  # ✅ 추가
            result.append(patient_data)

    return Response(result)



# backend/medical_integration/views.py - assign_room 함수 수정

@api_view(['POST'])
def assign_room(request):
    """
    진료실 배정 API: mapping_id 또는 patient_identifier로 환자 찾기
    """
    mapping_id = request.data.get("patientId")  # mapping_id (숫자)
    patient_identifier = request.data.get("patientIdentifier")  # patient_identifier (문자열)
    room = request.data.get("room")

    if (not mapping_id and not patient_identifier) or not room:
        return Response({"error": "mapping_id 또는 patient_identifier와 room이 필요합니다"}, status=400)

    try:
        # mapping_id로 찾기 (기존 방식)
        if mapping_id:
            mapping = PatientMapping.objects.get(mapping_id=mapping_id, is_active=True)
        # patient_identifier로 찾기 (새로운 방식)
        else:
            mapping = PatientMapping.objects.get(
                patient_identifier=patient_identifier, 
                is_active=True,
                mapping_type='IDENTIFIER_BASED'
            )

        mapping.assigned_room = room
        mapping.save(update_fields=["assigned_room"])

        logger.info(f"✅ 환자 {mapping.display or mapping.patient_identifier} → 진료실 {room} 배정 완료")

        return Response({
            "success": True,
            "message": f"환자가 진료실 {room}에 배정되었습니다.",
            "assigned_room": mapping.assigned_room,
            "mapping_id": mapping.mapping_id
        })

    except PatientMapping.DoesNotExist:
        return Response({"error": "해당 환자 매핑을 찾을 수 없습니다."}, status=404)
    except Exception as e:
        logger.error(f"[assign_room] 오류 발생: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def unassign_room(request):
    """
    진료실 배정 해제
    """
    room = request.data.get('room')
    if room not in [1, 2]:
        return Response({'error': '유효하지 않은 진료실 번호입니다.'}, status=400)

    # 해당 진료실에 배정된 환자 찾기
    try:
        patient = PatientMapping.objects.get(assigned_room=room)
    except PatientMapping.DoesNotExist:
        return Response({'message': f'{room}번 진료실에는 배정된 환자가 없습니다.'}, status=200)

    # 진료실 해제 처리
    patient.assigned_room = None
    patient.just_assigned = False
    patient.save()

    return Response({'success': True, 'message': f'{room}번 진료실 배정이 해제되었습니다.'})
@api_view(['GET'])
def identifier_based_waiting_list(request):
    today = timezone.now().date()
    mappings = PatientMapping.objects.filter(
        created_date__date=today,
        mapping_type='IDENTIFIER_BASED',
        is_active=True
    ).order_by('-created_date')

    result = []
    for m in mappings:
        try:
            result.append({
                'mapping_id': m.mapping_id,
                'patient_identifier': m.patient_identifier,
                'name': m.display or m.patient_identifier or '이름 없음',
                'display': m.display or m.patient_identifier,
                'gender': m.gender or '-',
                'birthdate': str(m.birthdate) if m.birthdate else '-',
                'waitTime': m.waiting_minutes() if hasattr(m, 'waiting_minutes') else 0,
                'assigned_room': m.assigned_room,
            })

        except Exception as e:
            logger.warning(f"[대기목록] 매핑 {m.mapping_id} 처리 실패: {e}")
    return Response(result)



@api_view(['GET'])
def get_orthanc_studies(request):
    """Orthanc Studies 목록 조회"""
    try:
        orthanc_api = OrthancAPI()
        studies = orthanc_api.get_studies()  # 이 메서드가 있어야 함
        
        return Response({
            'success': True,
            'studies': studies
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
        
        

@api_view(['GET'])
def waiting_board_view(request):
    today = timezone.now().date()
    
    # 1. 대기 중인 환자 (진료실 미배정, 오늘자, 활성화)
    waiting_list = PatientMapping.objects.filter(
        is_active=True,
        mapping_type='IDENTIFIER_BASED',
        assigned_room__isnull=True,
        created_date__date=today
    ).order_by('created_date')

    waiting = [
        {
            "name": m.display or m.patient_identifier,
            "room": None
        }
        for m in waiting_list
    ]

    # 2. 최근 1분 내 배정된 환자
    one_minute_ago = timezone.now() - timedelta(seconds=60)
    recent_assigned = PatientMapping.objects.filter(
        is_active=True,
        mapping_type='IDENTIFIER_BASED',
        assigned_room__isnull=False,
        created_date__date=today,
        # 최근 1분 내에 배정되었을 것 (created_date 말고 updated_at 쓰는 게 더 명확하나 일단 created 기준)
    ).order_by('-created_date').first()

    assigned_recent = None
    if recent_assigned:
        assigned_recent = {
            "name": recent_assigned.display or recent_assigned.patient_identifier,
            "room": recent_assigned.assigned_room
        }

    return Response({
        "waiting": waiting,
        "assigned_recent": assigned_recent
    })
    
