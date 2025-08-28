import json
import logging
import traceback
import numpy as np
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from ai_analysis.simclr_inference_service import simclr_inference_service
from .orthanc_api import OrthancAPI
from .dicom_utils import get_dicom_image_from_orthanc

logger = logging.getLogger('medical_integration')

def add_cors_headers(response):
    """CORS 헤더 추가 (오픈소스 호환성)"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response['Access-Control-Max-Age'] = '86400'
    return response

def safe_json_serialize(data):
    """JSON 직렬화 안전 변환 함수"""
    if isinstance(data, dict):
        return {k: safe_json_serialize(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [safe_json_serialize(item) for item in data]
    elif isinstance(data, tuple):
        return [safe_json_serialize(item) for item in data]
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, (np.int_, np.int8, np.int16, np.int32, np.int64)):
        return int(data)
    elif isinstance(data, (np.float64, np.float16, np.float32, np.float64)):
        return float(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif hasattr(data, 'item'):  # numpy scalar types
        return data.item()
    else:
        return data

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def simclr_patch_analysis(request):
    """SimCLR 패치 기반 이상탐지 분석 (JSON 직렬화 안전 버전)"""
    
    # OPTIONS 요청 처리 (CORS preflight)
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 요청 데이터 파싱
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST.dict()
        
        study_uid = data.get('studyUID') or data.get('study_uid')
        series_uid = data.get('seriesUID') or data.get('series_uid', '')
        instance_uid = data.get('instanceUID') or data.get('instance_uid', '')
        
        # 필수 파라미터 검증
        if not study_uid:
            logger.warning("SimCLR 분석 요청에 studyUID가 없음")
            response_data = {
                'status': 'error',
                'message': 'studyUID가 필요합니다.',
                'code': 'MISSING_STUDY_UID'
            }
            response = JsonResponse(safe_json_serialize(response_data), status=400)
            return add_cors_headers(response)
        
        logger.info(f"🧠 SimCLR 분석 시작: Study={study_uid}, Series={series_uid}, Instance={instance_uid}")
        
        # SimCLR 모델 상태 확인
        if not simclr_inference_service.model_loaded:
            logger.error("SimCLR 모델이 로드되지 않음")
            response_data = {
                'status': 'error',
                'message': 'SimCLR 모델이 로드되지 않았습니다. 모델을 확인해주세요.',
                'code': 'MODEL_NOT_LOADED'
            }
            response = JsonResponse(safe_json_serialize(response_data), status=503)
            return add_cors_headers(response)
        
        # Orthanc에서 DICOM 이미지 가져오기
        try:
            orthanc_api = OrthancAPI()
            
            # Study 정보 먼저 확인
            study_info = orthanc_api.get_study_by_uid(study_uid)
            if not study_info:
                logger.error(f"Orthanc에서 Study를 찾을 수 없음: {study_uid}")
                response_data = {
                    'status': 'error',
                    'message': f'Study를 찾을 수 없습니다: {study_uid}',
                    'code': 'STUDY_NOT_FOUND'
                }
                response = JsonResponse(safe_json_serialize(response_data), status=404)
                return add_cors_headers(response)
            
            # DICOM 이미지 추출
            dicom_image = get_dicom_image_from_orthanc(
                study_uid=study_uid,
                series_uid=series_uid,
                instance_uid=instance_uid
            )
            
            if dicom_image is None:
                logger.error(f"DICOM 이미지를 가져올 수 없음: {study_uid}")
                response_data = {
                    'status': 'error',
                    'message': 'DICOM 이미지를 추출할 수 없습니다. Orthanc 연결을 확인해주세요.',
                    'code': 'DICOM_EXTRACTION_FAILED'
                }
                response = JsonResponse(safe_json_serialize(response_data), status=404)
                return add_cors_headers(response)
                
        except Exception as orthanc_error:
            logger.error(f"Orthanc API 오류: {str(orthanc_error)}")
            response_data = {
                'status': 'error',
                'message': f'PACS 서버 연결 오류: {str(orthanc_error)}',
                'code': 'ORTHANC_API_ERROR'
            }
            response = JsonResponse(safe_json_serialize(response_data), status=503)
            return add_cors_headers(response)
        
        # SimCLR 이상탐지 분석 수행
        try:
            logger.info(f"🔍 DICOM 이미지 분석 시작: shape={dicom_image.shape}")
            
            analysis_result = simclr_inference_service.analyze_dicom_image(
                image_array=dicom_image,
                study_uid=study_uid
            )
            
            # 🔥 JSON 직렬화 안전 변환
            safe_analysis_result = safe_json_serialize(analysis_result)
            
            # 분석 결과에 메타데이터 추가
            if safe_analysis_result['status'] == 'success':
                safe_analysis_result['metadata'] = safe_json_serialize({
                    'study_uid': study_uid,
                    'series_uid': series_uid,
                    'instance_uid': instance_uid,
                    'analysis_version': '1.0',
                    'model_type': 'SimCLR EfficientNet-B2',
                    'image_dimensions': list(dicom_image.shape),  # tuple을 list로 변환
                    'orthanc_study_id': study_info.get('ID') if study_info else None
                })
                
                logger.info(f"✅ SimCLR 분석 완료: 이상도={safe_analysis_result['results']['overall_anomaly_score']:.3f}, "
                          f"이상패치={safe_analysis_result['results']['num_anomaly_patches']}개")
            else:
                logger.error(f"SimCLR 분석 실패: {safe_analysis_result.get('message', 'Unknown error')}")
            
            response = JsonResponse(safe_analysis_result)
            return add_cors_headers(response)
            
        except Exception as analysis_error:
            logger.error(f"SimCLR 분석 처리 오류: {str(analysis_error)}")
            logger.error(f"스택 트레이스: {traceback.format_exc()}")
            response_data = {
                'status': 'error',
                'message': f'이상탐지 분석 중 오류가 발생했습니다: {str(analysis_error)}',
                'code': 'ANALYSIS_PROCESSING_ERROR'
            }
            response = JsonResponse(safe_json_serialize(response_data), status=500)
            return add_cors_headers(response)
        
    except json.JSONDecodeError as json_error:
        logger.error(f"JSON 파싱 오류: {str(json_error)}")
        response_data = {
            'status': 'error',
            'message': f'요청 데이터 형식이 올바르지 않습니다: {str(json_error)}',
            'code': 'INVALID_JSON'
        }
        response = JsonResponse(safe_json_serialize(response_data), status=400)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ SimCLR API 일반 오류: {str(e)}")
        logger.error(f"스택 트레이스: {traceback.format_exc()}")
        response_data = {
            'status': 'error',
            'message': f'서버 내부 오류: {str(e)}',
            'code': 'INTERNAL_SERVER_ERROR'
        }
        response = JsonResponse(safe_json_serialize(response_data), status=500)
        return add_cors_headers(response)

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simclr_model_status(request):
    """SimCLR 모델 상태 확인 (JSON 안전 버전)"""
    
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        model_status = simclr_inference_service.get_model_status()
        
        # OpenMRS/Orthanc 연동 상태도 확인
        integration_status = {
            'orthanc_connection': False,
            'openmrs_connection': False
        }
        
        try:
            # Orthanc 연결 테스트
            orthanc_api = OrthancAPI()
            orthanc_system = orthanc_api.get_system_info()
            integration_status['orthanc_connection'] = orthanc_system is not None
        except:
            pass
        
        response_data = {
            'status': 'success',
            'model_available': bool(model_status['loaded']),  # 명시적 bool 변환
            'model_type': 'SimCLR EfficientNet-B2 (Patch-based)',
            'device': str(model_status.get('device', 'unknown')),
            'model_files': {
                'weights': bool(model_status.get('model_path_exists', False)),
                'features': bool(model_status.get('features_path_exists', False))
            },
            'integration_status': safe_json_serialize(integration_status),
            'features': {
                'patch_analysis': True,
                'gradcam_visualization': True,
                'anomaly_detection': True,
                'heatmap_overlay': True
            }
        }
        
        response = JsonResponse(safe_json_serialize(response_data))
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 모델 상태 확인 오류: {str(e)}")
        response_data = {
            'status': 'error',
            'message': f'모델 상태 확인 실패: {str(e)}',
            'code': 'STATUS_CHECK_FAILED'
        }
        response = JsonResponse(safe_json_serialize(response_data), status=500)
        return add_cors_headers(response)

@csrf_exempt 
@require_http_methods(["POST", "OPTIONS"])
def reload_simclr_model(request):
    """SimCLR 모델 재로드 (JSON 안전 버전)"""
    
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        logger.info("🔄 SimCLR 모델 재로드 시작...")
        
        # 모델 재초기화
        simclr_inference_service._initialize()
        
        # 상태 확인
        model_status = simclr_inference_service.get_model_status()
        
        if model_status['loaded']:
            message = "✅ SimCLR 모델 재로드 성공"
            status_code = 200
        else:
            message = "❌ SimCLR 모델 재로드 실패 - 모델 파일을 확인해주세요"
            status_code = 503
        
        logger.info(message)
        
        response_data = {
            'status': 'success' if model_status['loaded'] else 'error',
            'message': message,
            'model_available': bool(model_status['loaded']),
            'reload_timestamp': simclr_inference_service.get_model_status().get('last_loaded', None)
        }
        
        response = JsonResponse(safe_json_serialize(response_data), status=status_code)
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"❌ 모델 재로드 오류: {str(e)}")
        logger.error(f"스택 트레이스: {traceback.format_exc()}")
        response_data = {
            'status': 'error',
            'message': f'모델 재로드 실패: {str(e)}',
            'code': 'RELOAD_FAILED'
        }
        response = JsonResponse(safe_json_serialize(response_data), status=500)
        return add_cors_headers(response)

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def simclr_analysis_history(request):
    """SimCLR 분석 히스토리 조회 (선택적 기능)"""
    
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    try:
        # 간단한 히스토리 반환 (실제 구현은 데이터베이스 저장 필요)
        history_data = {
            'status': 'success',
            'recent_analyses': [],
            'total_count': 0,
            'message': '히스토리 기능은 추후 구현 예정입니다.'
        }
        
        response = JsonResponse(safe_json_serialize(history_data))
        return add_cors_headers(response)
        
    except Exception as e:
        logger.error(f"히스토리 조회 오류: {str(e)}")
        response_data = {
            'status': 'error',
            'message': str(e)
        }
        response = JsonResponse(safe_json_serialize(response_data), status=500)
        return add_cors_headers(response)