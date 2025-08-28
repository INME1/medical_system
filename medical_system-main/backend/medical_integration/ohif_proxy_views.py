# backend/medical_integration/ohif_proxy_views.py

import requests
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from requests.auth import HTTPBasicAuth
import logging

logger = logging.getLogger('medical_integration')

# 🔥 포트별 명확한 분리
ORTHANC_HOST = "localhost"
ORTHANC_HTTP_PORT = "8042"  # HTTP/DICOMweb 전용
ORTHANC_DICOM_PORT = "4242"  # DICOM 네트워크 전용
ORTHANC_USER = "orthanc"
ORTHANC_PASSWORD = "orthanc"

# 🔥 프로토콜별 URL 분리
ORTHANC_HTTP_BASE = f"http://{ORTHANC_HOST}:{ORTHANC_HTTP_PORT}"
ORTHANC_DICOM_BASE = f"dicom://{ORTHANC_HOST}:{ORTHANC_DICOM_PORT}"

def add_cors_headers(response):
    """CORS 헤더 추가"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    response['Access-Control-Max-Age'] = '86400'
    return response

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def ohif_config(request):
    """OHIF 설정 제공 - 명확한 포트 분리"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    config = {
        "routerBasename": "/",
        "extensions": [
            "@ohif/extension-default",
            "@ohif/extension-cornerstone"
        ],
        "modes": [
            "@ohif/mode-basic-viewer"
        ],
        "defaultMode": "@ohif/mode-basic-viewer",
        "showStudyList": True,
        "dataSources": [{
            "namespace": "@ohif/extension-default.dataSourcesModule.dicomweb",
            "sourceName": "dicomweb",
            "configuration": {
                "friendlyName": "Medical Platform Orthanc",
                "name": "orthanc",
                # 🔥 HTTP 포트만 사용 - DICOM 포트 절대 사용 금지
                "wadoUriRoot": f"http://localhost:8000/api/ohif/wado",
                "qidoRoot": f"http://localhost:8000/api/ohif/dicom-web",
                "wadoRoot": f"http://localhost:8000/api/ohif/dicom-web",
                "qidoSupportsIncludeField": False,
                "supportsInstanceMetadata": True,
                "supportsFuzzyMatching": False,
                "wadoUriRootProxy": f"http://localhost:8000/api/ohif/wado-proxy",
                "acceptHeader": "application/dicom+json",
                "requestOptions": {
                    "auth": None,
                    "logRequests": True,
                    "logResponses": False
                }
            }
        }],
        "hotkeys": [],
        "cornerstoneExtensionConfig": {},
        "showWarningMessageForCrossOrigin": False
    }
    
    response = JsonResponse(config)
    return add_cors_headers(response)

@csrf_exempt
def orthanc_proxy(request, path=""):
    """Orthanc HTTP API 프록시 - HTTP 포트만 사용"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 🔥 오직 HTTP 포트만 사용
        orthanc_url = f"{ORTHANC_HTTP_BASE}/{path}"
        
        if request.GET:
            query_string = request.GET.urlencode()
            orthanc_url = f"{orthanc_url}?{query_string}"
        
        logger.info(f"🌐 HTTP 프록시 요청: {request.method} {orthanc_url}")
        
        # 요청 헤더 준비
        headers = {
            'Accept': request.META.get('HTTP_ACCEPT', 'application/json'),
            'User-Agent': 'Django-OHIF-Proxy/1.0'
        }
        
        # Content-Type이 있으면 추가
        if request.META.get('CONTENT_TYPE'):
            headers['Content-Type'] = request.META['CONTENT_TYPE']
        
        # 🔥 HTTP 인증만 사용
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        
        if request.method == 'GET':
            response = requests.get(orthanc_url, headers=headers, auth=auth, timeout=70)
        elif request.method == 'POST':
            response = requests.post(orthanc_url, 
                                   data=request.body, 
                                   headers=headers, 
                                   auth=auth, 
                                   timeout=70)
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)
        
        # 응답 처리
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'application/json')
            
            if 'application/json' in content_type:
                django_response = JsonResponse(response.json(), safe=False)
            else:
                django_response = HttpResponse(response.content, content_type=content_type)
        else:
            logger.error(f"❌ HTTP 요청 실패: {response.status_code} - {response.text}")
            django_response = JsonResponse({
                'error': f'HTTP request failed: {response.status_code}',
                'details': response.text
            }, status=response.status_code)
        
        return add_cors_headers(django_response)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ HTTP 연결 실패: {e}")
        django_response = JsonResponse({
            'error': 'HTTP connection failed',
            'details': str(e)
        }, status=503)
        return add_cors_headers(django_response)

@csrf_exempt
def dicom_web_proxy(request, path=""):
    """DICOMweb API 프록시 - HTTP 포트 경유"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 🔥 DICOMweb은 HTTP 포트의 /dicom-web/ 경로 사용
        if not path.startswith('dicom-web'):
            path = f"dicom-web/{path.lstrip('/')}"
            
        orthanc_url = f"{ORTHANC_HTTP_BASE}/{path}"
        
        if request.GET:
            query_string = request.GET.urlencode()
            orthanc_url = f"{orthanc_url}?{query_string}"
        
        logger.info(f"🏥 DICOMweb 프록시 요청: {request.method} {orthanc_url}")
        
        headers = {
            'Accept': request.META.get('HTTP_ACCEPT', 'application/dicom+json'),
            'User-Agent': 'Django-OHIF-Proxy/1.0'
        }
        
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        
        if request.method == 'GET':
            response = requests.get(orthanc_url, headers=headers, auth=auth, timeout=60)
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'application/dicom+json')
            
            if 'json' in content_type:
                try:
                    django_response = JsonResponse(response.json(), safe=False)
                except:
                    django_response = HttpResponse(response.content, content_type=content_type)
            else:
                django_response = HttpResponse(response.content, content_type=content_type)
        else:
            logger.error(f"❌ DICOMweb 오류: {response.status_code} - {response.text}")
            django_response = JsonResponse({
                'error': f'DICOMweb request failed: {response.status_code}',
                'details': response.text
            }, status=response.status_code)
        
        return add_cors_headers(django_response)
        
    except Exception as e:
        logger.error(f"❌ DICOMweb 프록시 오류: {e}")
        django_response = JsonResponse({
            'error': 'DICOMweb proxy failed',
            'details': str(e)
        }, status=503)
        return add_cors_headers(django_response)

@csrf_exempt
def wado_proxy(request):
    """WADO-URI 프록시 - HTTP 포트 사용"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 🔥 WADO는 HTTP 포트의 /wado 경로 사용
        query_string = request.GET.urlencode()
        orthanc_url = f"{ORTHANC_HTTP_BASE}/wado?{query_string}"
        
        logger.info(f"🖼️ WADO 프록시 요청: {orthanc_url}")
        
        headers = {
            'Accept': request.META.get('HTTP_ACCEPT', 'image/*'),
            'User-Agent': 'Django-OHIF-Proxy/1.0'
        }
        
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        response = requests.get(orthanc_url, headers=headers, auth=auth, timeout=60)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'application/octet-stream')
            django_response = HttpResponse(response.content, content_type=content_type)
        else:
            logger.error(f"❌ WADO 오류: {response.status_code}")
            django_response = JsonResponse({
                'error': f'WADO request failed: {response.status_code}'
            }, status=response.status_code)
        
        return add_cors_headers(django_response)
        
    except Exception as e:
        logger.error(f"❌ WADO 프록시 오류: {e}")
        django_response = JsonResponse({
            'error': 'WADO proxy failed',
            'details': str(e)
        }, status=503)
        return add_cors_headers(django_response)

@csrf_exempt
def ohif_studies_list(request):
    """OHIF용 Study 목록 조회 - HTTP API 사용"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 🔥 HTTP API로 Study 목록 조회
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        response = requests.get(f"{ORTHANC_HTTP_BASE}/studies", auth=auth, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"Studies request failed: {response.status_code}")
        
        study_ids = response.json()
        studies = []
        
        logger.info(f"📋 총 {len(study_ids)}개 Study 발견")
        
        # 각 Study의 상세 정보 조회 (HTTP API 사용)
        for study_id in study_ids[:20]:  # 최대 20개로 제한
            try:
                study_response = requests.get(f"{ORTHANC_HTTP_BASE}/studies/{study_id}", 
                                            auth=auth, timeout=70)
                if study_response.status_code == 200:
                    study_data = study_response.json()
                    main_tags = study_data.get('MainDicomTags', {})
                    patient_tags = study_data.get('PatientMainDicomTags', {})
                    
                    # OHIF 형식으로 변환
                    ohif_study = {
                        "00080020": {"Value": [main_tags.get('StudyDate', '')]},
                        "00080030": {"Value": [main_tags.get('StudyTime', '')]},
                        "00080050": {"Value": [main_tags.get('AccessionNumber', '')]},
                        "00080061": {"Value": [main_tags.get('ModalitiesInStudy', '')]},
                        "00080090": {"Value": [main_tags.get('ReferringPhysicianName', '')]},
                        "00081030": {"Value": [main_tags.get('StudyDescription', '')]},
                        "00100010": {"Value": [patient_tags.get('PatientName', '')]},
                        "00100020": {"Value": [patient_tags.get('PatientID', '')]},
                        "00100030": {"Value": [patient_tags.get('PatientBirthDate', '')]},
                        "00100040": {"Value": [patient_tags.get('PatientSex', '')]},
                        "0020000D": {"Value": [main_tags.get('StudyInstanceUID', '')]},
                        "00200010": {"Value": [main_tags.get('StudyID', '')]},
                        "00201206": {"Value": [len(study_data.get('Series', []))]},
                        "00201208": {"Value": [study_data.get('Instances', {}).get('length', 0)]}
                    }
                    studies.append(ohif_study)
                    
            except Exception as e:
                logger.warning(f"⚠️ Study {study_id} 정보 조회 실패: {e}")
                continue
        
        logger.info(f"✅ {len(studies)}개 Study 정보 조회 완료")
        django_response = JsonResponse(studies, safe=False)
        return add_cors_headers(django_response)
        
    except Exception as e:
        logger.error(f"❌ Study 목록 조회 실패: {e}")
        django_response = JsonResponse({
            'error': 'Studies list request failed',
            'details': str(e)
        }, status=503)
        return add_cors_headers(django_response)

# 🔥 연결 테스트 함수 추가
@csrf_exempt
def test_connections(request):
    """Orthanc 연결 상태 테스트"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    results = {
        'http_connection': False,
        'dicom_web_enabled': False,
        'system_info': None,
        'error_messages': []
    }
    
    try:
        # HTTP 연결 테스트
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        response = requests.get(f"{ORTHANC_HTTP_BASE}/system", auth=auth, timeout=10)
        
        if response.status_code == 200:
            results['http_connection'] = True
            results['system_info'] = response.json()
            logger.info("✅ Orthanc HTTP 연결 성공")
        else:
            results['error_messages'].append(f"HTTP connection failed: {response.status_code}")
            
        # DICOMweb 플러그인 테스트
        dicomweb_response = requests.get(f"{ORTHANC_HTTP_BASE}/dicom-web/studies", 
                                       auth=auth, timeout=10)
        if dicomweb_response.status_code in [200, 204]:
            results['dicom_web_enabled'] = True
            logger.info("✅ DICOMweb 플러그인 활성화됨")
        else:
            results['error_messages'].append(f"DICOMweb not available: {dicomweb_response.status_code}")
            
    except Exception as e:
        results['error_messages'].append(str(e))
        logger.error(f"❌ 연결 테스트 실패: {e}")
    
    django_response = JsonResponse(results)
    return add_cors_headers(django_response)