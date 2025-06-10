# # ai_analysis/views.py
# from django.http import JsonResponse, HttpResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.views.decorators.http import require_http_methods
# import json
# import logging
# from ultralytics import YOLO
# import requests
# from PIL import Image
# import io
# from django.conf import settings
# from .utils import ModelManager
# from .pacs_utils import get_patient_info_from_pacs, get_series_info_from_pacs  # 새로 추가

# logger = logging.getLogger(__name__)

# # get_image_from_orthanc 함수 수정
# def get_image_from_orthanc(internal_study_id):
#     """
#     Orthanc에서 이미지 가져오기
    
#     Args:
#         internal_study_id: Orthanc 내부 Study ID (Study UID가 아님!)
#     """
#     try:
#         orthanc_url = "http://localhost:8042"
#         auth = ("orthanc", "orthanc")
        
#         # 스터디의 인스턴스 목록 가져오기
#         response = requests.get(f"{orthanc_url}/studies/{internal_study_id}/instances", auth=auth)
#         response.raise_for_status()
#         instances = response.json()
        
#         if not instances:
#             raise Exception("인스턴스가 없습니다")
        
#         # 첫 번째 인스턴스의 미리보기 이미지
#         first_instance = instances[0]['ID']
#         image_response = requests.get(f"{orthanc_url}/instances/{first_instance}/preview", auth=auth)
#         image_response.raise_for_status()
        
#         return Image.open(io.BytesIO(image_response.content))
        
#     except Exception as e:
#         logger.error(f"Orthanc 이미지 가져오기 실패: {e}")
#         raise

# @csrf_exempt
# def analyze_study_now(request):
#     """기본 YOLO 분석 - PACS에서 실제 환자 정보 가져오기"""
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             study_uid = data.get('study_uid')
            
#             logger.info(f"🎯 YOLO 분석 시작: {study_uid}")
            
#             # 🔥 수정된 부분: PACS에서 실제 환자 정보 가져오기
#             patient_info = get_patient_info_from_pacs(study_uid)
#             if not patient_info:
#                 return JsonResponse({
#                     'status': 'error',
#                     'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
#                 }, status=404)
            
#             # 실제 환자 ID 사용
#             patient_id = patient_info['patient_id']
#             logger.info(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
#             # 1. YOLO 모델 로드
#             model_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
#             model = YOLO(str(model_path))
            
#             # 2. Orthanc에서 이미지 가져오기
#             image = get_image_from_orthanc(patient_info['pacs_study_id'])  # PACS 내부 ID 사용
            
#             # 3. YOLO 추론
#             results = model(image)
            
#             # 4. 결과 처리
#             detection_results = []
#             for result in results:
#                 boxes = result.boxes
#                 if boxes is not None:
#                     for box in boxes:
#                         x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
#                         confidence = float(box.conf[0].cpu().numpy())
#                         class_id = int(box.cls[0].cpu().numpy())
#                         class_name = model.names.get(class_id, f"class_{class_id}")
                        
#                         # 🔥 수정된 부분: 실제 환자 정보로 DB 저장
#                         from .models import AIAnalysisResult
#                         ai_result = AIAnalysisResult.objects.create(
#                             patient_id=patient_info['patient_id'],  # 실제 환자 ID
#                             study_uid=study_uid,  # 요청받은 Study UID
#                             series_uid=f"{study_uid}.1",  # 임시값
#                             instance_uid=f"{study_uid}.1.1",  # 임시값
#                             instance_number=1,
#                             label=class_name,
#                             bbox=[int(x1), int(y1), int(x2), int(y2)],
#                             confidence_score=confidence,
#                             ai_text=f"{class_name} 검출 (YOLO) - 환자: {patient_info['patient_name']}",
#                             modality="CR",
#                             model_name="YOLOv8",
#                             model_version="best",
#                             image_width=int(image.width),
#                             image_height=int(image.height),
#                             processing_time=1.0
#                         )
                        
#                         detection_results.append({
#                             'id': ai_result.id,
#                             'label': class_name,
#                             'bbox': [int(x1), int(y1), int(x2), int(y2)],
#                             'confidence': confidence,
#                             'description': f"{class_name} (YOLO: {confidence:.2f})",
#                             'patient_info': {  # 환자 정보 추가
#                                 'patient_id': patient_info['patient_id'],
#                                 'patient_name': patient_info['patient_name']
#                             }
#                         })
            
#             logger.info(f"✅ YOLO 분석 완료: {len(detection_results)}개 검출 (환자: {patient_id})")
            
#             return JsonResponse({
#                 'status': 'success',
#                 'model_used': 'YOLOv8',
#                 'study_uid': study_uid,
#                 'patient_info': patient_info,  # 환자 정보 포함
#                 'detections': len(detection_results),
#                 'results': detection_results
#             })
            
#         except Exception as e:
#             logger.error(f"❌ YOLO 분석 실패: {e}")
#             return JsonResponse({
#                 'status': 'error', 
#                 'message': str(e)
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

# @csrf_exempt
# def analyze_with_ssd(request):
#     """SSD 모델로 분석 - PACS에서 실제 환자 정보 가져오기"""
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             study_uid = data.get('study_uid')
            
#             logger.info(f"🔍 SSD 분석 시작: {study_uid}")
            
#             # 🔥 수정된 부분: PACS에서 실제 환자 정보 가져오기
#             patient_info = get_patient_info_from_pacs(study_uid)
#             if not patient_info:
#                 return JsonResponse({
#                     'status': 'error',
#                     'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
#                 }, status=404)
            
#             patient_id = patient_info['patient_id']
#             logger.info(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
#             # 1. 이미지 가져오기
#             image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
#             # 2. SSD 모델 로드 및 분석
#             model, device = ModelManager.load_ssd_model()
#             detections = ModelManager.run_ssd_inference(model, device, image)
            
#             # 3. DB 저장
#             from .models import AIAnalysisResult
#             saved_results = []
#             for detection in detections:
#                 ai_result = AIAnalysisResult.objects.create(
#                     patient_id=patient_info['patient_id'],  # 실제 환자 ID
#                     study_uid=study_uid,
#                     series_uid=f"{study_uid}.1",
#                     instance_uid=f"{study_uid}.1.1",
#                     instance_number=1,
#                     label=detection['label'],
#                     bbox=detection['bbox'],
#                     confidence_score=detection['confidence'],
#                     ai_text=f"{detection['label']} 검출 (SSD) - 환자: {patient_info['patient_name']}",
#                     modality="CR",
#                     model_name="SSD",
#                     model_version="v1.0",
#                     image_width=int(image.width),
#                     image_height=int(image.height),
#                     processing_time=1.0
#                 )
                
#                 saved_results.append({
#                     'id': ai_result.id,
#                     'label': detection['label'],
#                     'bbox': detection['bbox'],
#                     'confidence': detection['confidence'],
#                     'description': f"{detection['label']} (SSD: {detection['confidence']:.2f})",
#                     'patient_info': {
#                         'patient_id': patient_info['patient_id'],
#                         'patient_name': patient_info['patient_name']
#                     }
#                 })
            
#             logger.info(f"✅ SSD 분석 완료: {len(saved_results)}개 검출 (환자: {patient_id})")
            
#             return JsonResponse({
#                 'status': 'success',
#                 'model_used': 'SSD',
#                 'study_uid': study_uid,
#                 'patient_info': patient_info,
#                 'detections': len(saved_results),
#                 'results': saved_results
#             })
            
#         except Exception as e:
#             logger.error(f"❌ SSD 분석 실패: {e}")
#             return JsonResponse({
#                 'status': 'error', 
#                 'message': str(e)
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

# def get_analysis_results(request, study_uid):
#     """저장된 AI 분석 결과 조회"""
#     try:
#         from .models import AIAnalysisResult
#         results = AIAnalysisResult.objects.filter(study_uid=study_uid).order_by('-created_at')
        
#         data = []
#         for result in results:
#             data.append({
#                 'id': result.id,
#                 'label': result.label,
#                 'bbox': result.bbox,
#                 'confidence': result.confidence_score,
#                 'description': result.ai_text,
#                 'model': result.model_name,
#                 'patient_id': result.patient_id,  # 환자 ID 추가
#                 'created_at': result.created_at.isoformat()
#             })
        
#         return JsonResponse({
#             'status': 'success',
#             'study_uid': study_uid,
#             'count': len(data),
#             'results': data
#         })
        
#     except Exception as e:
#         logger.error(f"결과 조회 실패: {e}")
#         return JsonResponse({
#             'status': 'error', 
#             'message': str(e)
#         }, status=500)

# def clear_results(request, study_uid):
#     """특정 스터디의 분석 결과 삭제"""
#     if request.method == 'DELETE':
#         try:
#             from .models import AIAnalysisResult
#             deleted_count = AIAnalysisResult.objects.filter(study_uid=study_uid).delete()[0]
            
#             return JsonResponse({
#                 'status': 'success',
#                 'message': f'{deleted_count}개 결과 삭제됨'
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'status': 'error',
#                 'message': str(e)
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'DELETE only'}, status=405)

# def model_status(request):
#     """모델 상태 확인"""
#     try:
#         yolo_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
#         ssd_path = settings.AI_MODELS_DIR / "ssd.pth"
        
#         return JsonResponse({
#             'status': 'success',
#             'models': {
#                 'yolo': {
#                     'available': yolo_path.exists(),
#                     'path': str(yolo_path)
#                 },
#                 'ssd': {
#                     'available': ssd_path.exists(),
#                     'path': str(ssd_path)
#                 }
#             }
#         })
        
#     except Exception as e:
#         return JsonResponse({
#             'status': 'error',
#             'message': str(e)
#         }, status=500)

# # 🔥 새로운 디버깅 API 추가
# @csrf_exempt
# def debug_patient_info(request):
#     """환자 정보 디버깅용 API"""
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             study_uid = data.get('study_uid')
            
#             # PACS에서 환자 정보 가져오기
#             patient_info = get_patient_info_from_pacs(study_uid)
            
#             if patient_info:
#                 return JsonResponse({
#                     'status': 'success',
#                     'message': 'PACS에서 환자 정보를 성공적으로 가져왔습니다.',
#                     'patient_info': patient_info
#                 })
#             else:
#                 return JsonResponse({
#                     'status': 'error',
#                     'message': f'PACS에서 Study UID {study_uid}를 찾을 수 없습니다.'
#                 }, status=404)
                
#         except Exception as e:
#             return JsonResponse({
#                 'status': 'error',
#                 'message': f'오류: {str(e)}'
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)


# # views.py 파일 끝에 추가할 함수들

# @csrf_exempt
# def debug_orthanc_connection(request):
#     """Orthanc 연결 및 스터디 목록 확인"""
#     try:
#         from .pacs_utils import debug_orthanc_studies
        
#         studies = debug_orthanc_studies()
        
#         return JsonResponse({
#             'status': 'success',
#             'message': 'Orthanc 연결 성공',
#             'total_studies': len(studies),
#             'sample_studies': studies
#         })
        
#     except Exception as e:
#         return JsonResponse({
#             'status': 'error',
#             'message': f'Orthanc 연결 실패: {str(e)}'
#         }, status=500)

# @csrf_exempt
# def test_study_search(request, study_uid):
#     """특정 Study UID로 검색 테스트"""
#     try:
#         logger.info(f"🔍 Study UID 검색 테스트: {study_uid}")
        
#         # 1. PACS에서 환자 정보 검색
#         patient_info = get_patient_info_from_pacs(study_uid)
        
#         if patient_info:
#             return JsonResponse({
#                 'status': 'success',
#                 'message': 'Study UID를 찾았습니다.',
#                 'patient_info': patient_info
#             })
#         else:
#             # 2. Orthanc에서 직접 검색 시도
#             orthanc_url = "http://localhost:8042"
#             auth = ("orthanc", "orthanc")
            
#             # 모든 스터디 확인
#             all_studies = requests.get(f"{orthanc_url}/studies", auth=auth).json()
            
#             # Study UID가 포함된 스터디 찾기
#             found_studies = []
#             for study_id in all_studies[:10]:  # 처음 10개만 확인
#                 study_data = requests.get(f"{orthanc_url}/studies/{study_id}", auth=auth).json()
#                 study_uid_in_orthanc = study_data.get('MainDicomTags', {}).get('StudyInstanceUID', '')
                
#                 # Study UID 비교
#                 if study_uid == study_uid_in_orthanc:
#                     found_studies.append({
#                         'orthanc_id': study_id,
#                         'study_uid': study_uid_in_orthanc,
#                         'patient_id': study_data.get('PatientMainDicomTags', {}).get('PatientID', ''),
#                         'patient_name': study_data.get('PatientMainDicomTags', {}).get('PatientName', '')
#                     })
            
#             return JsonResponse({
#                 'status': 'warning',
#                 'message': f'Study UID {study_uid}를 찾을 수 없습니다.',
#                 'total_studies_in_orthanc': len(all_studies),
#                 'found_studies': found_studies,
#                 'searched_count': min(10, len(all_studies))
#             }, status=404)
            
#     except Exception as e:
#         logger.error(f"검색 테스트 실패: {e}")
#         return JsonResponse({
#             'status': 'error',
#             'message': str(e)
#         }, status=500)
    
# # 기존 views.py 파일 맨 끝에 이 함수 하나만 추가하세요

# @csrf_exempt
# def get_pacs_studies(request):
#     """PACS 스터디 목록 가져오기 (CORS 우회)"""
#     try:
#         orthanc_url = "http://localhost:8042"
        
#         # PACS에서 스터디 목록 가져오기
#         response = requests.get(f"{orthanc_url}/studies", timeout=10)
#         response.raise_for_status()
#         studies = response.json()
        
#         study_list = []
#         for study_id in studies:
#             try:
#                 study_response = requests.get(f"{orthanc_url}/studies/{study_id}", timeout=10)
#                 study_response.raise_for_status()
#                 study_data = study_response.json()
                
#                 study_info = {
#                     'pacs_id': study_id,
#                     'study_uid': study_data.get('MainDicomTags', {}).get('StudyInstanceUID'),
#                     'patient_id': study_data.get('PatientMainDicomTags', {}).get('PatientID'),
#                     'patient_name': study_data.get('PatientMainDicomTags', {}).get('PatientName'),
#                     'study_date': study_data.get('MainDicomTags', {}).get('StudyDate'),
#                 }
                
#                 study_list.append(study_info)
#             except Exception as e:
#                 logger.warning(f"스터디 {study_id} 조회 실패: {e}")
#                 continue
        
#         return JsonResponse({
#             'status': 'success',
#             'studies': study_list,
#             'count': len(study_list)
#         })
        
#     except Exception as e:
#         logger.error(f"PACS 스터디 조회 실패: {e}")
#         return JsonResponse({
#             'status': 'error',
#             'message': str(e)
#         }, status=500)

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging
import traceback
from ultralytics import YOLO
import requests
from PIL import Image
import io
from django.conf import settings
from .utils import ModelManager
from .pacs_utils import get_patient_info_from_pacs, get_series_info_from_pacs
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

def get_image_from_orthanc(internal_study_id):
    """
    Orthanc에서 이미지 가져오기
    
    Args:
        internal_study_id: Orthanc 내부 Study ID (Study UID가 아님!)
    """
    try:
        orthanc_url = "http://localhost:8042"
        auth = ("orthanc", "orthanc")
        
        # 스터디의 인스턴스 목록 가져오기
        response = requests.get(f"{orthanc_url}/studies/{internal_study_id}/instances", auth=auth)
        response.raise_for_status()
        instances = response.json()
        
        if not instances:
            raise Exception("인스턴스가 없습니다")
        
        # 첫 번째 인스턴스의 미리보기 이미지
        first_instance = instances[0]['ID']
        image_response = requests.get(f"{orthanc_url}/instances/{first_instance}/preview", auth=auth)
        image_response.raise_for_status()
        
        return Image.open(io.BytesIO(image_response.content))
        
    except Exception as e:
        logger.error(f"Orthanc 이미지 가져오기 실패: {e}")
        raise

@csrf_exempt
def analyze_study_now(request):
    """기본 YOLO 분석 - 예외 처리 강화"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            study_uid = data.get('study_uid')
            
            print(f"🎯 YOLO 분석 시작: {study_uid}")
            
            # PACS에서 실제 환자 정보 가져오기
            patient_info = get_patient_info_from_pacs(study_uid)
            if not patient_info:
                return JsonResponse({
                    'status': 'error',
                    'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
                }, status=404)
            
            patient_id = patient_info['patient_id']
            print(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
            
            # 🔥 중복 체크 및 덮어쓰기 처리 수정
            overwrite = data.get('overwrite', False)
            print(f"🔥 YOLO 덮어쓰기 모드: {overwrite}")

            if not overwrite:
                from .models import AIAnalysisResult
                existing = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,          # 환자 ID 추가
                    study_uid=study_uid,
                    model_name='YOLOv8'
                ).first()
                
                if existing:
                    print(f"⚠️ 기존 YOLO 결과 존재 (환자: {patient_id}, 스터디: {study_uid}), 분석 중단")
                    return JsonResponse({
                        'status': 'exists',
                        'message': f'환자 {patient_id}의 스터디 {study_uid}에 이미 YOLO 분석 결과가 존재합니다',
                        'existing_count': AIAnalysisResult.objects.filter(
                            patient_id=patient_id,
                            study_uid=study_uid,
                            model_name='YOLOv8'
                        ).count()
                    })

            # 덮어쓰기인 경우 기존 결과 삭제
            if overwrite:
                from .models import AIAnalysisResult
                deleted_count = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,          # 환자 ID 추가
                    study_uid=study_uid,
                    model_name='YOLOv8'
                ).delete()[0]
                print(f"🗑️ 기존 YOLO 결과 {deleted_count}개 삭제 (환자: {patient_id})")
                        
            
            # 1. YOLO 모델 로드
            model_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
            model = YOLO(str(model_path))
            
            # 2. Orthanc에서 이미지 가져오기
            image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
            # 원본 이미지 해상도
            original_width = int(image.width)
            original_height = int(image.height)
            print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
            print(f"📐 이미지 모드: {image.mode}")
            
            # 🤖 YOLO 모델 정보
            print(f"🤖 YOLO 모델: {model}")
            print(f"🤖 모델 입력 크기: {getattr(model, 'imgsz', 'Unknown')}")
            
            # 3. YOLO 추론
            results = model(image)
            print("🔥🔥🔥 YOLO 추론 완료, 분석 시작!")
            
            # 🔍 YOLO 결과 객체 완전 분석 (예외 처리 강화)
            print("🔍 ===== YOLO 결과 객체 분석 시작 =====")
            
            actual_width = 640   # 기본값
            actual_height = 544  # 기본값
            
            try:
                print(f"🔍 results 타입: {type(results)}")
                print(f"🔍 results 길이: {len(results)}")
                
                for i, result in enumerate(results):
                    print(f"🔍 result[{i}] 처리 시작")
                    
                    try:
                        print(f"🔍 result[{i}] 타입: {type(result)}")
                        print(f"🔍 result[{i}] 클래스: {result.__class__.__name__}")
                        
                        # 모든 속성 출력 (안전하게)
                        try:
                            all_attrs = [attr for attr in dir(result) if not attr.startswith('_')]
                            print(f"🔍 result[{i}] 속성들: {all_attrs[:10]}...")  # 처음 10개만
                        except Exception as e:
                            print(f"❌ 속성 리스트 가져오기 실패: {e}")
                        
                        # 가능한 해상도 속성들 체크
                        possible_attrs = [
                            'orig_shape', 'shape', 'img_shape', 'input_shape', 
                            'orig_img_shape', 'tensor_shape', 'orig_img', 'path',
                            'speed', 'names', 'boxes'
                        ]
                        
                        for attr in possible_attrs:
                            try:
                                if hasattr(result, attr):
                                    value = getattr(result, attr)
                                    print(f"🎯 result.{attr}: {value} (타입: {type(value)})")
                                    
                                    # orig_shape에서 해상도 추출 시도
                                    if attr == 'orig_shape' and value is not None:
                                        try:
                                            if isinstance(value, (tuple, list)) and len(value) >= 2:
                                                actual_height, actual_width = value[:2]
                                                print(f"✅ orig_shape에서 해상도 추출: {actual_width}x{actual_height}")
                                        except Exception as e:
                                            print(f"❌ orig_shape 파싱 실패: {e}")
                                            
                            except Exception as e:
                                print(f"❌ 속성 {attr} 접근 실패: {e}")
                        
                        # boxes 객체 분석 (안전하게)
                        try:
                            if hasattr(result, 'boxes') and result.boxes is not None:
                                boxes = result.boxes
                                print(f"🔍 boxes 타입: {type(boxes)}")
                                print(f"🔍 boxes 클래스: {boxes.__class__.__name__}")
                                
                                try:
                                    box_attrs = [attr for attr in dir(boxes) if not attr.startswith('_')]
                                    print(f"🔍 boxes 속성들: {box_attrs[:10]}...")  # 처음 10개만
                                except Exception as e:
                                    print(f"❌ boxes 속성 리스트 가져오기 실패: {e}")
                                
                                # boxes의 해상도 관련 속성들
                                box_resolution_attrs = [
                                    'orig_shape', 'shape', 'img_shape', 'xyxy', 'xywh', 'conf', 'cls'
                                ]
                                
                                for attr in box_resolution_attrs:
                                    try:
                                        if hasattr(boxes, attr):
                                            value = getattr(boxes, attr)
                                            print(f"🎯 boxes.{attr}: {value} (타입: {type(value)})")
                                            
                                            # orig_shape에서 해상도 추출 시도
                                            if attr == 'orig_shape' and value is not None:
                                                try:
                                                    if isinstance(value, (tuple, list)) and len(value) >= 2:
                                                        actual_height, actual_width = value[:2]
                                                        print(f"✅ boxes.orig_shape에서 해상도 추출: {actual_width}x{actual_height}")
                                                except Exception as e:
                                                    print(f"❌ boxes.orig_shape 파싱 실패: {e}")
                                                    
                                    except Exception as e:
                                        print(f"❌ boxes.{attr} 접근 실패: {e}")
                        except Exception as e:
                            print(f"❌ boxes 분석 실패: {e}")
                        
                    except Exception as e:
                        print(f"❌ result[{i}] 분석 실패: {e}")
                        print(f"❌ 상세 에러: {traceback.format_exc()}")
                    
                    break  # 첫 번째만 분석
                    
            except Exception as e:
                print(f"❌ YOLO 분석 전체 실패: {e}")
                print(f"❌ 상세 에러: {traceback.format_exc()}")
            
            print("🔍 ===== YOLO 결과 객체 분석 완료 =====")
            print(f"✅ 최종 사용 해상도: {actual_width}x{actual_height}")
            
            # 4. 결과 처리
            detection_results = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names.get(class_id, f"class_{class_id}")
                        
                        # DB 저장 (원본 해상도로 저장)
                        from .models import AIAnalysisResult
                        ai_result = AIAnalysisResult.objects.create(
                            patient_id=patient_info['patient_id'],
                            study_uid=study_uid,
                            series_uid=f"{study_uid}.1",
                            instance_uid=f"{study_uid}.1.1",
                            instance_number=1,
                            label=class_name,
                            bbox=[int(x1), int(y1), int(x2), int(y2)],
                            confidence_score=confidence,
                            ai_text=f"{class_name} 검출 (YOLO) - 환자: {patient_info['patient_name']}",
                            modality="CR",
                            model_name="YOLOv8",
                            model_version="best",
                            image_width=original_width,   # DB에는 원본 해상도 저장
                            image_height=original_height, # DB에는 원본 해상도 저장
                            processing_time=1.0
                        )
                        
                        # 🔥 API 응답에는 YOLO 실제 사용 해상도 포함
                        detection_results.append({
                            'id': ai_result.id,
                            'label': class_name,
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': confidence,
                            'description': f"{class_name} (YOLO: {confidence:.2f})",
                            'image_width': actual_width,    # 🔥 YOLO 실제 사용 해상도
                            'image_height': actual_height,  # 🔥 YOLO 실제 사용 해상도
                            'patient_info': {
                                'patient_id': patient_info['patient_id'],
                                'patient_name': patient_info['patient_name']
                            }
                        })
            
            print(f"✅ YOLO 분석 완료: {len(detection_results)}개 검출 (실제사용: {actual_width}x{actual_height})")
            
            return JsonResponse({
                'status': 'success',
                'model_used': 'YOLOv8',
                'study_uid': study_uid,
                'patient_info': patient_info,
                'detections': len(detection_results),
                'image_width': actual_width,    # 🔥 YOLO 실제 사용 해상도
                'image_height': actual_height,  # 🔥 YOLO 실제 사용 해상도
                'original_width': original_width,   # 참고용 원본 해상도
                'original_height': original_height, # 참고용 원본 해상도
                'results': detection_results
            })
            
        except Exception as e:
            print(f"❌ YOLO 분석 전체 실패: {e}")
            print(f"❌ 상세 에러: {traceback.format_exc()}")
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)




@csrf_exempt
def analyze_with_ssd(request):
    """SSD 모델로 분석 - utils.py의 새로운 전처리 로직 사용"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            study_uid = data.get('study_uid')
            
            print(f"🔍 SSD 분석 시작: {study_uid}")
            
            # PACS에서 실제 환자 정보 가져오기
            patient_info = get_patient_info_from_pacs(study_uid)
            if not patient_info:
                return JsonResponse({
                    'status': 'error',
                    'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
                }, status=404)
            
            patient_id = patient_info['patient_id']
            print(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
            # 🔥 중복 체크 및 덮어쓰기 처리 수정
            overwrite = data.get('overwrite', False)
            print(f"🔥 SSD 덮어쓰기 모드: {overwrite}")

            if not overwrite:
                from .models import AIAnalysisResult
                existing = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,          # 환자 ID 추가
                    study_uid=study_uid,
                    model_name='SSD'
                ).first()
                
                if existing:
                    print(f"⚠️ 기존 SSD 결과 존재 (환자: {patient_id}, 스터디: {study_uid}), 분석 중단")
                    return JsonResponse({
                        'status': 'exists',
                        'message': f'환자 {patient_id}의 스터디 {study_uid}에 이미 SSD 분석 결과가 존재합니다',
                        'existing_count': AIAnalysisResult.objects.filter(
                            patient_id=patient_id,
                            study_uid=study_uid,
                            model_name='SSD'
                        ).count()
                    })

            # 덮어쓰기인 경우 기존 결과 삭제
            if overwrite:
                from .models import AIAnalysisResult
                deleted_count = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,          # 환자 ID 추가
                    study_uid=study_uid,
                    model_name='SSD'
                ).delete()[0]
                print(f"🗑️ 기존 SSD 결과 {deleted_count}개 삭제 (환자: {patient_id})")
            
            
            
            # 1. 이미지 가져오기
            image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
            # 원본 이미지 해상도
            original_width = int(image.width)
            original_height = int(image.height)
            print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
            
            # 2. SSD 모델 로드 및 분석 (새로운 utils.py 사용)
            model, device = ModelManager.load_ssd_model()
            detections = ModelManager.run_ssd_inference(model, device, image)
            
            print(f"🔍 SSD detections 개수: {len(detections)}")
            
            # 3. DB 저장 및 결과 처리
            from .models import AIAnalysisResult
            
            saved_results = []
            for i, detection in enumerate(detections):
                # SSD 결과에서 bbox와 전처리 정보 추출
                bbox = detection['bbox']
                preprocessing_info = detection.get('preprocessing_info', {})
                
                print(f"🔍 SSD detection[{i}]: {detection['label']}")
                print(f"🔍 bbox: {bbox}")
                print(f"🔍 confidence: {detection['confidence']:.3f}")
                
                if preprocessing_info:
                    scale_x = preprocessing_info.get('scale_x', 1.0)
                    scale_y = preprocessing_info.get('scale_y', 1.0)
                    print(f"🔄 전처리 정보 있음: 스케일={scale_x:.3f}x{scale_y:.3f}")
                else:
                    print(f"⚠️ 전처리 정보 없음 (더미 결과)")
                
                # bbox 유효성 검사 및 최소 크기 보장
                if len(bbox) >= 4:
                    x1, y1, x2, y2 = bbox[:4]
                    bbox_width = x2 - x1
                    bbox_height = y2 - y1
                    
                    print(f"📏 bbox 크기: {bbox_width}x{bbox_height}")
                    
                    # 최소 크기 보장 (20픽셀 이상)
                    if bbox_width < 20 or bbox_height < 20:
                        print(f"⚠️ 박스가 너무 작음: {bbox_width}x{bbox_height}, 확대")
                        center_x = (x1 + x2) // 2
                        center_y = (y1 + y2) // 2
                        
                        # 더 큰 크기로 확대
                        new_width = max(50, bbox_width * 3)  # 3배 확대 또는 최소 50픽셀
                        new_height = max(50, bbox_height * 3)
                        
                        x1 = max(0, center_x - new_width // 2)
                        y1 = max(0, center_y - new_height // 2)
                        x2 = min(original_width, center_x + new_width // 2)
                        y2 = min(original_height, center_y + new_height // 2)
                        
                        bbox = [x1, y1, x2, y2]
                        print(f"✅ 확대된 bbox: {bbox} (크기: {x2-x1}x{y2-y1})")
                    
                    # 최종 유효성 검사
                    if x2 > x1 and y2 > y1:
                        # DB 저장
                        ai_result = AIAnalysisResult.objects.create(
                            patient_id=patient_info['patient_id'],
                            study_uid=study_uid,
                            series_uid=f"{study_uid}.1",
                            instance_uid=f"{study_uid}.1.1",
                            instance_number=1,
                            label=detection['label'],
                            bbox=bbox,
                            confidence_score=detection['confidence'],
                            ai_text=f"{detection['label']} 검출 (SSD) - 환자: {patient_info['patient_name']}",
                            modality="CR",
                            model_name="SSD",
                            model_version="v1.0",
                            image_width=original_width,
                            image_height=original_height,
                            processing_time=1.0
                        )
                        
                        # API 응답 데이터
                        saved_results.append({
                            'id': ai_result.id,
                            'label': detection['label'],
                            'bbox': bbox,
                            'confidence': detection['confidence'],
                            'description': f"{detection['label']} (SSD: {detection['confidence']:.2f})",
                            'image_width': original_width,
                            'image_height': original_height,
                            'preprocessing_info': preprocessing_info if preprocessing_info else None,
                            'patient_info': {
                                'patient_id': patient_info['patient_id'],
                                'patient_name': patient_info['patient_name']
                            }
                        })
                        
                        print(f"✅ DB 저장 완료: ID={ai_result.id}")
                    else:
                        print(f"❌ 잘못된 bbox 크기: {bbox}")
                
                else:
                    print(f"❌ 잘못된 bbox 형식: {bbox}")
            
            print(f"✅ SSD 분석 완료: {len(saved_results)}개 검출")
            
            return JsonResponse({
                'status': 'success',
                'model_used': 'SSD',
                'study_uid': study_uid,
                'patient_info': patient_info,
                'detections': len(saved_results),
                'image_width': original_width,
                'image_height': original_height,
                'results': saved_results
            })
            
        except Exception as e:
            print(f"❌ SSD 분석 실패: {e}")
            print(f"❌ 상세 에러: {traceback.format_exc()}")
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

def get_analysis_results(request, study_uid):
    """저장된 AI 분석 결과 조회 - 해상도 정보 포함"""
    try:
        from .models import AIAnalysisResult
        results = AIAnalysisResult.objects.filter(study_uid=study_uid).order_by('-created_at')
        
        data = []
        for result in results:
            # 🔥 저장된 결과는 원본 해상도로 반환 (DB에 저장된 값)
            data.append({
                'id': result.id,
                'label': result.label,
                'bbox': result.bbox,
                'confidence': result.confidence_score,
                'description': result.ai_text,
                'model': result.model_name,
                'patient_id': result.patient_id,
                'image_width': result.image_width,    # DB 저장된 원본 해상도
                'image_height': result.image_height,  # DB 저장된 원본 해상도
                'created_at': result.created_at.isoformat()
            })
        
        return JsonResponse({
            'status': 'success',
            'study_uid': study_uid,
            'count': len(data),
            'results': data
        })
        
    except Exception as e:
        logger.error(f"결과 조회 실패: {e}")
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@csrf_exempt
def clear_results(request, study_uid):
    """특정 스터디의 분석 결과 삭제"""
    if request.method == 'DELETE':
        try:
            from .models import AIAnalysisResult
            deleted_count = AIAnalysisResult.objects.filter(study_uid=study_uid).delete()[0]
            
            return JsonResponse({
                'status': 'success',
                'message': f'{deleted_count}개 결과 삭제됨'
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'DELETE only'}, status=405)

def model_status(request):
    """모델 상태 확인"""
    try:
        yolo_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
        ssd_path = settings.AI_MODELS_DIR / "ssd.pth"
        
        return JsonResponse({
            'status': 'success',
            'models': {
                'yolo': {
                    'available': yolo_path.exists(),
                    'path': str(yolo_path)
                },
                'ssd': {
                    'available': ssd_path.exists(),
                    'path': str(ssd_path)
                }
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
def check_existing_analysis(request, study_uid, model_type):
    """해당 스터디의 기존 분석 결과 확인"""
    try:
        from .models import AIAnalysisResult
        
        # 🔥 환자 정보 먼저 가져오기
        patient_info = get_patient_info_from_pacs(study_uid)
        if not patient_info:
            return JsonResponse({'exists': False, 'error': '환자 정보를 찾을 수 없습니다'})
        
        patient_id = patient_info['patient_id']
        
        # 모델 타입 정규화
        model_type_upper = model_type.upper()
        if model_type_upper == 'YOLO':
            model_name = 'YOLOv8'
        elif model_type_upper == 'SSD':
            model_name = 'SSD'
        else:
            return JsonResponse({'exists': False, 'error': '지원하지 않는 모델 타입'})
        
        # 🔥 환자 ID + 스터디 UID + 모델로 중복 체크
        existing = AIAnalysisResult.objects.filter(
            patient_id=patient_id,
            study_uid=study_uid,
            model_name=model_name
        ).first()
        
        if existing:
            return JsonResponse({
                'exists': True, 
                'data': {
                    'id': existing.id,
                    'patient_id': patient_id,
                    'created_at': existing.created_at.isoformat(),
                    'model_name': existing.model_name,
                    'count': AIAnalysisResult.objects.filter(
                        patient_id=patient_id,
                        study_uid=study_uid,
                        model_name=model_name
                    ).count()
                }
            })
        else:
            return JsonResponse({'exists': False})
            
    except Exception as e:
        logger.error(f"중복 체크 실패: {e}")
        return JsonResponse({'exists': False, 'error': str(e)})


@csrf_exempt
def debug_patient_info(request):
    """환자 정보 디버깅용 API"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            study_uid = data.get('study_uid')
            
            # PACS에서 환자 정보 가져오기
            patient_info = get_patient_info_from_pacs(study_uid)
            
            if patient_info:
                return JsonResponse({
                    'status': 'success',
                    'message': 'PACS에서 환자 정보를 성공적으로 가져왔습니다.',
                    'patient_info': patient_info
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': f'PACS에서 Study UID {study_uid}를 찾을 수 없습니다.'
                }, status=404)
                
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'오류: {str(e)}'
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

@csrf_exempt
def debug_orthanc_connection(request):
    """Orthanc 연결 및 스터디 목록 확인"""
    try:
        from .pacs_utils import debug_orthanc_studies
        
        studies = debug_orthanc_studies()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Orthanc 연결 성공',
            'total_studies': len(studies),
            'sample_studies': studies
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Orthanc 연결 실패: {str(e)}'
        }, status=500)

@csrf_exempt
def test_study_search(request, study_uid):
    """특정 Study UID로 검색 테스트"""
    try:
        logger.info(f"🔍 Study UID 검색 테스트: {study_uid}")
        
        # 1. PACS에서 환자 정보 검색
        patient_info = get_patient_info_from_pacs(study_uid)
        
        if patient_info:
            return JsonResponse({
                'status': 'success',
                'message': 'Study UID를 찾았습니다.',
                'patient_info': patient_info
            })
        else:
            # 2. Orthanc에서 직접 검색 시도
            orthanc_url = "http://localhost:8042"
            auth = ("orthanc", "orthanc")
            
            # 모든 스터디 확인
            all_studies = requests.get(f"{orthanc_url}/studies", auth=auth).json()
            
            # Study UID가 포함된 스터디 찾기
            found_studies = []
            for study_id in all_studies[:10]:  # 처음 10개만 확인
                study_data = requests.get(f"{orthanc_url}/studies/{study_id}", auth=auth).json()
                study_uid_in_orthanc = study_data.get('MainDicomTags', {}).get('StudyInstanceUID', '')
                
                # Study UID 비교
                if study_uid == study_uid_in_orthanc:
                    found_studies.append({
                        'orthanc_id': study_id,
                        'study_uid': study_uid_in_orthanc,
                        'patient_id': study_data.get('PatientMainDicomTags', {}).get('PatientID', ''),
                        'patient_name': study_data.get('PatientMainDicomTags', {}).get('PatientName', '')
                    })
            
            return JsonResponse({
                'status': 'warning',
                'message': f'Study UID {study_uid}를 찾을 수 없습니다.',
                'total_studies_in_orthanc': len(all_studies),
                'found_studies': found_studies,
                'searched_count': min(10, len(all_studies))
            }, status=404)
            
    except Exception as e:
        logger.error(f"검색 테스트 실패: {e}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
def get_pacs_studies(request):
    """PACS 스터디 목록 가져오기 (CORS 우회)"""
    try:
        orthanc_url = "http://localhost:8042"
        
        # PACS에서 스터디 목록 가져오기
        response = requests.get(f"{orthanc_url}/studies", timeout=10)
        response.raise_for_status()
        studies = response.json()
        
        study_list = []
        for study_id in studies:
            try:
                study_response = requests.get(f"{orthanc_url}/studies/{study_id}", timeout=10)
                study_response.raise_for_status()
                study_data = study_response.json()
                
                study_info = {
                    'pacs_id': study_id,
                    'study_uid': study_data.get('MainDicomTags', {}).get('StudyInstanceUID'),
                    'patient_id': study_data.get('PatientMainDicomTags', {}).get('PatientID'),
                    'patient_name': study_data.get('PatientMainDicomTags', {}).get('PatientName'),
                    'study_date': study_data.get('MainDicomTags', {}).get('StudyDate'),
                }
                
                study_list.append(study_info)
            except Exception as e:
                logger.warning(f"스터디 {study_id} 조회 실패: {e}")
                continue
        
        return JsonResponse({
            'status': 'success',
            'studies': study_list,
            'count': len(study_list)
        })
        
    except Exception as e:
        logger.error(f"PACS 스터디 조회 실패: {e}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)