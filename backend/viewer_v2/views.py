import requests
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from requests.auth import HTTPBasicAuth
from .dicomweb_views import DicomWebAPI

logger = logging.getLogger('viewer_v2')

# Orthanc 설정
ORTHANC_HOST = "localhost"
ORTHANC_HTTP_PORT = "8042"
ORTHANC_USER = "orthanc"
ORTHANC_PASSWORD = "orthanc"
ORTHANC_HTTP_BASE = f"http://{ORTHANC_HOST}:{ORTHANC_HTTP_PORT}"

# DICOMWeb API 인스턴스
dicomweb_api = DicomWebAPI()

def add_cors_headers(response):
    """CORS 헤더 추가"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    response['Access-Control-Max-Age'] = '86400'
    return response

def handle_options(request):
    """OPTIONS 요청 처리"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    return None

# =================================================================
# DICOMweb 표준 QIDO-RS API
# =================================================================

@csrf_exempt
def qido_studies(request):
    """QIDO-RS: Studies 검색"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        # URL 파라미터 추출
        params = request.GET.dict()
        logger.info(f"📋 Studies 검색 파라미터: {params}")
        
        studies = dicomweb_api.search_studies(params)
        
        if studies is not None:
            response = JsonResponse(studies, safe=False)
        else:
            response = JsonResponse({'error': 'Studies search failed'}, status=500)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Studies 검색 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_study_detail(request, study_uid):
    """QIDO-RS: 특정 Study 상세 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        study = dicomweb_api.get_study(study_uid)
        
        if study is not None:
            response = JsonResponse(study, safe=False)
        else:
            response = JsonResponse({'error': 'Study not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Study {study_uid} 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_study_metadata(request, study_uid):
    """QIDO-RS: Study 메타데이터"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        metadata = dicomweb_api.get_study_metadata(study_uid)
        
        if metadata is not None:
            response = JsonResponse(metadata, safe=False)
        else:
            response = JsonResponse({'error': 'Study metadata not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Study {study_uid} 메타데이터 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_series(request, study_uid):
    """QIDO-RS: Study의 Series 목록"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        series = dicomweb_api.get_study_series(study_uid)
        
        if series is not None:
            response = JsonResponse(series, safe=False)
        else:
            response = JsonResponse({'error': 'Series not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Study {study_uid} Series 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_series_detail(request, study_uid, series_uid):
    """QIDO-RS: 특정 Series 상세 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        series = dicomweb_api.get_series(study_uid, series_uid)
        
        if series is not None:
            response = JsonResponse(series, safe=False)
        else:
            response = JsonResponse({'error': 'Series not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Series {series_uid} 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_series_metadata(request, study_uid, series_uid):
    """QIDO-RS: Series 메타데이터"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        metadata = dicomweb_api.get_series_metadata(study_uid, series_uid)
        
        if metadata is not None:
            response = JsonResponse(metadata, safe=False)
        else:
            response = JsonResponse({'error': 'Series metadata not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Series {series_uid} 메타데이터 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_instances(request, study_uid, series_uid):
    """QIDO-RS: Series의 Instance 목록"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        instances = dicomweb_api.get_series_instances(study_uid, series_uid)
        
        if instances is not None:
            response = JsonResponse(instances, safe=False)
        else:
            response = JsonResponse({'error': 'Instances not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Series {series_uid} Instances 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_instance_detail(request, study_uid, series_uid, instance_uid):
    """QIDO-RS: 특정 Instance 상세 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        instance = dicomweb_api.get_instance(study_uid, series_uid, instance_uid)
        
        if instance is not None:
            response = JsonResponse(instance, safe=False)
        else:
            response = JsonResponse({'error': 'Instance not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Instance {instance_uid} 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def qido_instance_metadata(request, study_uid, series_uid, instance_uid):
    """QIDO-RS: Instance 메타데이터"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        metadata = dicomweb_api.get_instance_metadata(study_uid, series_uid, instance_uid)
        
        if metadata is not None:
            response = JsonResponse(metadata, safe=False)
        else:
            response = JsonResponse({'error': 'Instance metadata not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Instance {instance_uid} 메타데이터 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

# =================================================================
# WADO-RS API (이미지 렌더링)
# =================================================================

@csrf_exempt
def wado_rendered(request, study_uid, series_uid, instance_uid, frame):
    """WADO-RS: 프레임 렌더링된 이미지"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        image_data = dicomweb_api.get_rendered_frame(study_uid, series_uid, instance_uid, frame)
        
        if image_data is not None:
            response = HttpResponse(image_data, content_type='image/png')
        else:
            response = JsonResponse({'error': 'Frame not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 프레임 {frame} 렌더링 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def wado_instance_rendered(request, study_uid, series_uid, instance_uid):
    """WADO-RS: Instance 렌더링된 이미지 (첫 번째 프레임)"""
    return wado_rendered(request, study_uid, series_uid, instance_uid, 1)

@csrf_exempt
def wado_instance_file(request, study_uid, series_uid, instance_uid):
    """WADO-RS: DICOM 파일 다운로드"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        dicom_data = dicomweb_api.get_instance_file(study_uid, series_uid, instance_uid)
        
        if dicom_data is not None:
            response = HttpResponse(dicom_data, content_type='application/dicom')
            response['Content-Disposition'] = f'attachment; filename="{instance_uid}.dcm"'
        else:
            response = JsonResponse({'error': 'DICOM file not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ DICOM 파일 {instance_uid} 다운로드 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

# =================================================================
# RESTful API (환자 중심)
# =================================================================

@csrf_exempt
def get_all_patients(request):
    """모든 환자 목록 조회"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        patients = dicomweb_api.get_all_patients()
        
        if patients is not None:
            response = JsonResponse(patients, safe=False)
        else:
            response = JsonResponse({'error': 'Patients list not found'}, status=500)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 목록 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_patient(request, patient_id):
    """특정 환자 정보 조회"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        patient = dicomweb_api.get_patient_by_id(patient_id)
        
        if patient is not None:
            response = JsonResponse(patient)
        else:
            response = JsonResponse({'error': 'Patient not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 {patient_id} 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_patient_studies(request, patient_id):
    """환자의 Studies 목록 조회"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        studies = dicomweb_api.get_patient_studies(patient_id)
        
        if studies is not None:
            response = JsonResponse(studies, safe=False)
        else:
            response = JsonResponse({'error': 'Studies not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 {patient_id} Studies 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_patient_study_detail(request, patient_id, study_uid):
    """환자의 특정 Study 상세 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        study = dicomweb_api.get_patient_study_detail(patient_id, study_uid)
        
        if study is not None:
            response = JsonResponse(study)
        else:
            response = JsonResponse({'error': 'Study not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 {patient_id} Study {study_uid} 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

# =================================================================
# 편의 API
# =================================================================

@csrf_exempt
def search_patients(request):
    """환자 검색"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        params = request.GET.dict()
        patients = dicomweb_api.search_patients(params)
        
        if patients is not None:
            response = JsonResponse(patients, safe=False)
        else:
            response = JsonResponse({'error': 'Patient search failed'}, status=500)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 검색 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def search_studies(request):
    """Studies 검색"""
    return qido_studies(request)  # QIDO-RS와 동일

@csrf_exempt
def get_instance_preview(request, instance_uid):
    """Instance 미리보기 이미지"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        preview_data = dicomweb_api.get_instance_preview(instance_uid)
        
        if preview_data is not None:
            response = HttpResponse(preview_data, content_type='image/png')
        else:
            response = JsonResponse({'error': 'Preview not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Instance {instance_uid} 미리보기 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_study_thumbnail(request, study_uid):
    """Study 썸네일 이미지"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        thumbnail_data = dicomweb_api.get_study_thumbnail(study_uid)
        
        if thumbnail_data is not None:
            response = HttpResponse(thumbnail_data, content_type='image/png')
        else:
            response = JsonResponse({'error': 'Thumbnail not found'}, status=404)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Study {study_uid} 썸네일 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_orthanc_stats(request):
    """Orthanc 통계 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        stats = dicomweb_api.get_statistics()
        
        if stats is not None:
            response = JsonResponse(stats)
        else:
            response = JsonResponse({'error': 'Statistics not available'}, status=500)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 통계 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def get_system_info(request):
    """시스템 정보"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        system_info = dicomweb_api.get_system_info()
        
        if system_info is not None:
            response = JsonResponse(system_info)
        else:
            response = JsonResponse({'error': 'System info not available'}, status=500)
            
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 시스템 정보 조회 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

# =================================================================
# Orthanc 직접 프록시
# =================================================================

@csrf_exempt
def orthanc_proxy(request, path=""):
    """Orthanc 원본 API 프록시"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        orthanc_url = f"{ORTHANC_HTTP_BASE}/{path}"
        
        if request.GET:
            query_string = request.GET.urlencode()
            orthanc_url = f"{orthanc_url}?{query_string}"
        
        logger.info(f"🔄 Orthanc 프록시: {request.method} {orthanc_url}")
        
        headers = {
            'Accept': request.META.get('HTTP_ACCEPT', 'application/json'),
            'User-Agent': 'Django-Viewer-V2/1.0'
        }
        
        auth = HTTPBasicAuth(ORTHANC_USER, ORTHANC_PASSWORD)
        
        if request.method == 'GET':
            response = requests.get(orthanc_url, headers=headers, auth=auth, timeout=30)
        elif request.method == 'POST':
            response = requests.post(orthanc_url, data=request.body, headers=headers, auth=auth, timeout=30)
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'application/json')
            
            if 'application/json' in content_type:
                django_response = JsonResponse(response.json(), safe=False)
            else:
                django_response = HttpResponse(response.content, content_type=content_type)
        else:
            logger.error(f"❌ Orthanc 프록시 실패: {response.status_code}")
            django_response = JsonResponse({
                'error': f'Orthanc request failed: {response.status_code}',
                'details': response.text
            }, status=response.status_code)
        
        return add_cors_headers(django_response)
        
    except Exception as e:
        logger.error(f"❌ Orthanc 프록시 오류: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

# =================================================================
# 테스트 및 디버깅
# =================================================================

@csrf_exempt
def test_orthanc_connection(request):
    """Orthanc 연결 테스트"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        test_result = dicomweb_api.test_connection()
        response = JsonResponse(test_result)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 연결 테스트 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def test_dicomweb(request):
    """DICOMweb 기능 테스트"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        test_result = dicomweb_api.test_dicomweb()
        response = JsonResponse(test_result)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ DICOMweb 테스트 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def debug_patient_data(request, patient_id):
    """환자 데이터 디버깅"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        debug_data = dicomweb_api.debug_patient_data(patient_id)
        response = JsonResponse(debug_data)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 환자 {patient_id} 디버깅 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)

@csrf_exempt
def debug_study_data(request, study_uid):
    """Study 데이터 디버깅"""
    options_response = handle_options(request)
    if options_response:
        return options_response
    
    try:
        debug_data = dicomweb_api.debug_study_data(study_uid)
        response = JsonResponse(debug_data)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ Study {study_uid} 디버깅 실패: {e}")
        response = JsonResponse({'error': str(e)}, status=500)
        return add_cors_headers(response)