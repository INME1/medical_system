# from django.http import JsonResponse, HttpResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.views.decorators.http import require_http_methods
# import json
# import logging
# import traceback
# from ultralytics import YOLO
# import requests
# from PIL import Image
# import io
# from django.conf import settings
# from .utils import ModelManager
# from .pacs_utils import get_patient_info_from_pacs, get_series_info_from_pacs

# from django.utils.decorators import method_decorator        
        
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from .models import AIAnalysisResult
# from .serializers import AIAnalysisResultSerializer
    
    
# # views.py
# from rest_framework.views import APIView
# from rest_framework import status
# # from .models import AIAnalysisResult # 필요하다면 모델 임포트
# from .serializers import AIAnalysisResultSerializer # 시리얼라이저 임포트
# from .utils import save_analysis_result
# import pydicom
# from io import BytesIO

# logger = logging.getLogger(__name__)

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
#     """기본 YOLO 분석 - 예외 처리 강화"""
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             study_uid = data.get('study_uid')
            
#             print(f"🎯 YOLO 분석 시작: {study_uid}")
            
#             # PACS에서 실제 환자 정보 가져오기
#             patient_info = get_patient_info_from_pacs(study_uid)
#             if not patient_info:
#                 return JsonResponse({
#                     'status': 'error',
#                     'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
#                 }, status=404)
            
#             patient_id = patient_info['patient_id']
#             print(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
            
#             # 🔥 중복 체크 및 덮어쓰기 처리 수정
#             overwrite = data.get('overwrite', False)
#             print(f"🔥 YOLO 덮어쓰기 모드: {overwrite}")

#             if not overwrite:
#                 from .models import AIAnalysisResult
#                 existing = AIAnalysisResult.objects.filter(
#                     patient_id=patient_id,          # 환자 ID 추가
#                     study_uid=study_uid,
#                     model_name='YOLOv8'
#                 ).first()
                
#                 if existing:
#                     print(f"⚠️ 기존 YOLO 결과 존재 (환자: {patient_id}, 스터디: {study_uid}), 분석 중단")
#                     return JsonResponse({
#                         'status': 'exists',
#                         'message': f'환자 {patient_id}의 스터디 {study_uid}에 이미 YOLO 분석 결과가 존재합니다',
#                         'existing_count': AIAnalysisResult.objects.filter(
#                             patient_id=patient_id,
#                             study_uid=study_uid,
#                             model_name='YOLOv8'
#                         ).count()
#                     })

#             # 덮어쓰기인 경우 기존 결과 삭제
#             if overwrite:
#                 from .models import AIAnalysisResult
#                 deleted_count = AIAnalysisResult.objects.filter(
#                     patient_id=patient_id,          # 환자 ID 추가
#                     study_uid=study_uid,
#                     model_name='YOLOv8'
#                 ).delete()[0]
#                 print(f"🗑️ 기존 YOLO 결과 {deleted_count}개 삭제 (환자: {patient_id})")
                        
            
#             # 1. YOLO 모델 로드
#             model_path = settings.AI_MODELS_DIR / 'yolov8' / "yolov8_best.pt"
#             model = YOLO(str(model_path))
            
#             # 2. Orthanc에서 이미지 가져오기
#             image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
#             # 원본 이미지 해상도
#             original_width = int(image.width)
#             original_height = int(image.height)
#             print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
#             print(f"📐 이미지 모드: {image.mode}")
            
#             # 🤖 YOLO 모델 정보
#             print(f"🤖 YOLO 모델: {model}")
#             print(f"🤖 모델 입력 크기: {getattr(model, 'imgsz', 'Unknown')}")
            
#             # 3. YOLO 추론
#             results = model(image)
#             print("🔥🔥🔥 YOLO 추론 완료, 분석 시작!")
            
#             # 🔍 YOLO 결과 객체 완전 분석 (예외 처리 강화)
#             print("🔍 ===== YOLO 결과 객체 분석 시작 =====")
            
#             actual_width = 640   # 기본값
#             actual_height = 544  # 기본값
            
#             try:
#                 print(f"🔍 results 타입: {type(results)}")
#                 print(f"🔍 results 길이: {len(results)}")
                
#                 for i, result in enumerate(results):
#                     print(f"🔍 result[{i}] 처리 시작")
                    
#                     try:
#                         print(f"🔍 result[{i}] 타입: {type(result)}")
#                         print(f"🔍 result[{i}] 클래스: {result.__class__.__name__}")
                        
#                         # 모든 속성 출력 (안전하게)
#                         try:
#                             all_attrs = [attr for attr in dir(result) if not attr.startswith('_')]
#                             print(f"🔍 result[{i}] 속성들: {all_attrs[:10]}...")  # 처음 10개만
#                         except Exception as e:
#                             print(f"❌ 속성 리스트 가져오기 실패: {e}")
                        
#                         # 가능한 해상도 속성들 체크
#                         possible_attrs = [
#                             'orig_shape', 'shape', 'img_shape', 'input_shape', 
#                             'orig_img_shape', 'tensor_shape', 'orig_img', 'path',
#                             'speed', 'names', 'boxes'
#                         ]
                        
#                         for attr in possible_attrs:
#                             try:
#                                 if hasattr(result, attr):
#                                     value = getattr(result, attr)
#                                     print(f"🎯 result.{attr}: {value} (타입: {type(value)})")
                                    
#                                     # orig_shape에서 해상도 추출 시도
#                                     if attr == 'orig_shape' and value is not None:
#                                         try:
#                                             if isinstance(value, (tuple, list)) and len(value) >= 2:
#                                                 actual_height, actual_width = value[:2]
#                                                 print(f"✅ orig_shape에서 해상도 추출: {actual_width}x{actual_height}")
#                                         except Exception as e:
#                                             print(f"❌ orig_shape 파싱 실패: {e}")
                                            
#                             except Exception as e:
#                                 print(f"❌ 속성 {attr} 접근 실패: {e}")
                        
#                         # boxes 객체 분석 (안전하게)
#                         try:
#                             if hasattr(result, 'boxes') and result.boxes is not None:
#                                 boxes = result.boxes
#                                 print(f"🔍 boxes 타입: {type(boxes)}")
#                                 print(f"🔍 boxes 클래스: {boxes.__class__.__name__}")
                                
#                                 try:
#                                     box_attrs = [attr for attr in dir(boxes) if not attr.startswith('_')]
#                                     print(f"🔍 boxes 속성들: {box_attrs[:10]}...")  # 처음 10개만
#                                 except Exception as e:
#                                     print(f"❌ boxes 속성 리스트 가져오기 실패: {e}")
                                
#                                 # boxes의 해상도 관련 속성들
#                                 box_resolution_attrs = [
#                                     'orig_shape', 'shape', 'img_shape', 'xyxy', 'xywh', 'conf', 'cls'
#                                 ]
                                
#                                 for attr in box_resolution_attrs:
#                                     try:
#                                         if hasattr(boxes, attr):
#                                             value = getattr(boxes, attr)
#                                             print(f"🎯 boxes.{attr}: {value} (타입: {type(value)})")
                                            
#                                             # orig_shape에서 해상도 추출 시도
#                                             if attr == 'orig_shape' and value is not None:
#                                                 try:
#                                                     if isinstance(value, (tuple, list)) and len(value) >= 2:
#                                                         actual_height, actual_width = value[:2]
#                                                         print(f"✅ boxes.orig_shape에서 해상도 추출: {actual_width}x{actual_height}")
#                                                 except Exception as e:
#                                                     print(f"❌ boxes.orig_shape 파싱 실패: {e}")
                                                    
#                                     except Exception as e:
#                                         print(f"❌ boxes.{attr} 접근 실패: {e}")
#                         except Exception as e:
#                             print(f"❌ boxes 분석 실패: {e}")
                        
#                     except Exception as e:
#                         print(f"❌ result[{i}] 분석 실패: {e}")
#                         print(f"❌ 상세 에러: {traceback.format_exc()}")
                    
#                     break  # 첫 번째만 분석
                    
#             except Exception as e:
#                 print(f"❌ YOLO 분석 전체 실패: {e}")
#                 print(f"❌ 상세 에러: {traceback.format_exc()}")
            
#             print("🔍 ===== YOLO 결과 객체 분석 완료 =====")
#             print(f"✅ 최종 사용 해상도: {actual_width}x{actual_height}")
            
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
                        
#                         # DB 저장 (원본 해상도로 저장)
#                         from .models import AIAnalysisResult
#                         ai_result = AIAnalysisResult.objects.create(
#                             patient_id=patient_info['patient_id'],
#                             study_uid=study_uid,
#                             series_uid=f"{study_uid}.1",
#                             instance_uid=f"{study_uid}.1.1",
#                             instance_number=1,
#                             label=class_name,
#                             bbox=[int(x1), int(y1), int(x2), int(y2)],
#                             confidence_score=confidence,
#                             ai_text=f"{class_name} 검출 (YOLO) - 환자: {patient_info['patient_name']}",
#                             modality="CR",
#                             model_name="YOLOv8",
#                             model_version="best",
#                             image_width=original_width,   # DB에는 원본 해상도 저장
#                             image_height=original_height, # DB에는 원본 해상도 저장
#                             processing_time=1.0
#                         )
                        
#                         # 🔥 API 응답에는 YOLO 실제 사용 해상도 포함
#                         detection_results.append({
#                             'id': ai_result.id,
#                             'label': class_name,
#                             'bbox': [int(x1), int(y1), int(x2), int(y2)],
#                             'confidence': confidence,
#                             'description': f"{class_name} (YOLO: {confidence:.2f})",
#                             'image_width': actual_width,    # 🔥 YOLO 실제 사용 해상도
#                             'image_height': actual_height,  # 🔥 YOLO 실제 사용 해상도
#                             'patient_info': {
#                                 'patient_id': patient_info['patient_id'],
#                                 'patient_name': patient_info['patient_name']
#                             }
#                         })
            
#             print(f"✅ YOLO 분석 완료: {len(detection_results)}개 검출 (실제사용: {actual_width}x{actual_height})")
            
#             return JsonResponse({
#                 'status': 'success',
#                 'model_used': 'YOLOv8',
#                 'study_uid': study_uid,
#                 'patient_info': patient_info,
#                 'detections': len(detection_results),
#                 'image_width': actual_width,    # 🔥 YOLO 실제 사용 해상도
#                 'image_height': actual_height,  # 🔥 YOLO 실제 사용 해상도
#                 'original_width': original_width,   # 참고용 원본 해상도
#                 'original_height': original_height, # 참고용 원본 해상도
#                 'results': detection_results
#             })
            
#         except Exception as e:
#             print(f"❌ YOLO 분석 전체 실패: {e}")
#             print(f"❌ 상세 에러: {traceback.format_exc()}")
#             return JsonResponse({
#                 'status': 'error', 
#                 'message': str(e)
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)




# @csrf_exempt
# def analyze_with_ssd(request):
#     """SSD 모델로 분석 - utils.py의 새로운 전처리 로직 사용"""
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             study_uid = data.get('study_uid')
            
#             print(f"🔍 SSD 분석 시작: {study_uid}")
            
#             # PACS에서 실제 환자 정보 가져오기
#             patient_info = get_patient_info_from_pacs(study_uid)
#             if not patient_info:
#                 return JsonResponse({
#                     'status': 'error',
#                     'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
#                 }, status=404)
            
#             patient_id = patient_info['patient_id']
#             print(f"📋 PACS에서 가져온 환자 정보: {patient_id} - {patient_info['patient_name']}")
            
#             # 🔥 중복 체크 및 덮어쓰기 처리 수정
#             overwrite = data.get('overwrite', False)
#             print(f"🔥 SSD 덮어쓰기 모드: {overwrite}")

#             if not overwrite:
#                 from .models import AIAnalysisResult
#                 existing = AIAnalysisResult.objects.filter(
#                     patient_id=patient_id,          # 환자 ID 추가
#                     study_uid=study_uid,
#                     model_name='SSD'
#                 ).first()
                
#                 if existing:
#                     print(f"⚠️ 기존 SSD 결과 존재 (환자: {patient_id}, 스터디: {study_uid}), 분석 중단")
#                     return JsonResponse({
#                         'status': 'exists',
#                         'message': f'환자 {patient_id}의 스터디 {study_uid}에 이미 SSD 분석 결과가 존재합니다',
#                         'existing_count': AIAnalysisResult.objects.filter(
#                             patient_id=patient_id,
#                             study_uid=study_uid,
#                             model_name='SSD'
#                         ).count()
#                     })

#             # 덮어쓰기인 경우 기존 결과 삭제
#             if overwrite:
#                 from .models import AIAnalysisResult
#                 deleted_count = AIAnalysisResult.objects.filter(
#                     patient_id=patient_id,          # 환자 ID 추가
#                     study_uid=study_uid,
#                     model_name='SSD'
#                 ).delete()[0]
#                 print(f"🗑️ 기존 SSD 결과 {deleted_count}개 삭제 (환자: {patient_id})")
            
            
            
#             # 1. 이미지 가져오기
#             image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
#             # 원본 이미지 해상도
#             original_width = int(image.width)
#             original_height = int(image.height)
#             print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
            
#             # 2. SSD 모델 로드 및 분석 (새로운 utils.py 사용)
#             model, device = ModelManager.load_ssd_model()
#             detections = ModelManager.run_ssd_inference(model, device, image)
            
#             print(f"🔍 SSD detections 개수: {len(detections)}")
            
#             # 3. DB 저장 및 결과 처리
#             from .models import AIAnalysisResult
            
#             saved_results = []
#             for i, detection in enumerate(detections):
#                 # SSD 결과에서 bbox와 전처리 정보 추출
#                 bbox = detection['bbox']
#                 preprocessing_info = detection.get('preprocessing_info', {})
                
#                 print(f"🔍 SSD detection[{i}]: {detection['label']}")
#                 print(f"🔍 bbox: {bbox}")
#                 print(f"🔍 confidence: {detection['confidence']:.3f}")
                
#                 if preprocessing_info:
#                     scale_x = preprocessing_info.get('scale_x', 1.0)
#                     scale_y = preprocessing_info.get('scale_y', 1.0)
#                     print(f"🔄 전처리 정보 있음: 스케일={scale_x:.3f}x{scale_y:.3f}")
#                 else:
#                     print(f"⚠️ 전처리 정보 없음 (더미 결과)")
                
#                 # bbox 유효성 검사 및 최소 크기 보장
#                 if len(bbox) >= 4:
#                     x1, y1, x2, y2 = bbox[:4]
#                     bbox_width = x2 - x1
#                     bbox_height = y2 - y1
                    
#                     print(f"📏 bbox 크기: {bbox_width}x{bbox_height}")
                    
#                     # 최소 크기 보장 (20픽셀 이상)
#                     if bbox_width < 20 or bbox_height < 20:
#                         print(f"⚠️ 박스가 너무 작음: {bbox_width}x{bbox_height}, 확대")
#                         center_x = (x1 + x2) // 2
#                         center_y = (y1 + y2) // 2
                        
#                         # 더 큰 크기로 확대
#                         new_width = max(50, bbox_width * 3)  # 3배 확대 또는 최소 50픽셀
#                         new_height = max(50, bbox_height * 3)
                        
#                         x1 = max(0, center_x - new_width // 2)
#                         y1 = max(0, center_y - new_height // 2)
#                         x2 = min(original_width, center_x + new_width // 2)
#                         y2 = min(original_height, center_y + new_height // 2)
                        
#                         bbox = [x1, y1, x2, y2]
#                         print(f"✅ 확대된 bbox: {bbox} (크기: {x2-x1}x{y2-y1})")
                    
#                     # 최종 유효성 검사
#                     if x2 > x1 and y2 > y1:
#                         # DB 저장
#                         ai_result = AIAnalysisResult.objects.create(
#                             patient_id=patient_info['patient_id'],
#                             study_uid=study_uid,
#                             series_uid=f"{study_uid}.1",
#                             instance_uid=f"{study_uid}.1.1",
#                             instance_number=1,
#                             label=detection['label'],
#                             bbox=bbox,
#                             confidence_score=detection['confidence'],
#                             ai_text=f"{detection['label']} 검출 (SSD) - 환자: {patient_info['patient_name']}",
#                             modality="CR",
#                             model_name="SSD",
#                             model_version="v1.0",
#                             image_width=original_width,
#                             image_height=original_height,
#                             processing_time=1.0
#                         )
                        
#                         # API 응답 데이터
#                         saved_results.append({
#                             'id': ai_result.id,
#                             'label': detection['label'],
#                             'bbox': bbox,
#                             'confidence': detection['confidence'],
#                             'description': f"{detection['label']} (SSD: {detection['confidence']:.2f})",
#                             'image_width': original_width,
#                             'image_height': original_height,
#                             'preprocessing_info': preprocessing_info if preprocessing_info else None,
#                             'patient_info': {
#                                 'patient_id': patient_info['patient_id'],
#                                 'patient_name': patient_info['patient_name']
#                             }
#                         })
                        
#                         print(f"✅ DB 저장 완료: ID={ai_result.id}")
#                     else:
#                         print(f"❌ 잘못된 bbox 크기: {bbox}")
                
#                 else:
#                     print(f"❌ 잘못된 bbox 형식: {bbox}")
            
#             print(f"✅ SSD 분석 완료: {len(saved_results)}개 검출")
            
#             return JsonResponse({
#                 'status': 'success',
#                 'model_used': 'SSD',
#                 'study_uid': study_uid,
#                 'patient_info': patient_info,
#                 'detections': len(saved_results),
#                 'image_width': original_width,
#                 'image_height': original_height,
#                 'results': saved_results
#             })
            
#         except Exception as e:
#             print(f"❌ SSD 분석 실패: {e}")
#             print(f"❌ 상세 에러: {traceback.format_exc()}")
#             return JsonResponse({
#                 'status': 'error', 
#                 'message': str(e)
#             }, status=500)
    
#     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

# def get_analysis_results(request, study_uid):
#     """저장된 AI 분석 결과 조회 - 모델별 구분"""
#     try:
#         from .models import AIAnalysisResult
        
#         # 🔥 쿼리 파라미터로 모델 타입 필터링 가능
#         model_type = request.GET.get('model_type', None)
        
#         if model_type:
#             # 특정 모델 결과만 조회
#             model_name_mapping = {
#                 'yolo': 'YOLOv8',
#                 'ssd': 'SSD'
#             }
#             model_name = model_name_mapping.get(model_type.lower(), model_type)
#             results = AIAnalysisResult.objects.filter(
#                 study_uid=study_uid, 
#                 model_name=model_name
#             ).order_by('-created_at')
#         else:
#             # 모든 모델 결과 조회
#             results = AIAnalysisResult.objects.filter(study_uid=study_uid).order_by('model_name', '-created_at')

#         # 🔥 모델별로 그룹화
#         grouped_data = {}
#         all_data = []
        
#         for result in results:
#             result_data = {
#                 'id': result.id,
#                 'label': result.label,
#                 'bbox': result.bbox,
#                 'confidence': result.confidence_score,
#                 'description': result.ai_text,
#                 'model': result.model_name,
#                 'patient_id': result.patient_id,
#                 'image_width': result.image_width,
#                 'image_height': result.image_height,
#                 'created_at': result.created_at.isoformat()
#             }
            
#             all_data.append(result_data)
            
#             # 모델별 그룹화
#             if result.model_name not in grouped_data:
#                 grouped_data[result.model_name] = []
#             grouped_data[result.model_name].append(result_data)

#         return JsonResponse({
#             'status': 'success',
#             'study_uid': study_uid,
#             'total_count': len(all_data),
#             'models': list(grouped_data.keys()),
#             'grouped_by_model': grouped_data,  # 🔥 모델별로 그룹화된 결과
#             'results': all_data  # 기존 호환성을 위한 전체 결과
#         })
        
#     except Exception as e:
#         logger.error(f"결과 조회 실패: {e}")
#         return JsonResponse({
#             'status': 'error', 
#             'message': str(e)
#         }, status=500)


# @csrf_exempt
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
#         yolo_path = settings.AI_MODELS_DIR / 'yolov8' / "yolov8_best.pt" # 'ai_models' 중복 제거!
#         ssd_path = settings.AI_MODELS_DIR / 'ssd' / "ssd.pth"   
        
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


# @csrf_exempt
# def check_existing_analysis(request, study_uid, model_type):
#     """해당 스터디의 기존 분석 결과 확인"""
#     try:
#         from .models import AIAnalysisResult
        
#         # 🔥 환자 정보 먼저 가져오기
#         patient_info = get_patient_info_from_pacs(study_uid)
#         if not patient_info:
#             return JsonResponse({'exists': False, 'error': '환자 정보를 찾을 수 없습니다'})
        
#         patient_id = patient_info['patient_id']
        
#         # 모델 타입 정규화
#         model_type_upper = model_type.upper()
#         if model_type_upper == 'YOLO':
#             model_name = 'YOLOv8'
#         elif model_type_upper == 'SSD':
#             model_name = 'SSD'
#         else:
#             return JsonResponse({'exists': False, 'error': '지원하지 않는 모델 타입'})
        
#         # 🔥 환자 ID + 스터디 UID + 모델로 중복 체크
#         existing = AIAnalysisResult.objects.filter(
#             patient_id=patient_id,
#             study_uid=study_uid,
#             model_name=model_name
#         ).first()
        
#         if existing:
#             return JsonResponse({
#                 'exists': True, 
#                 'data': {
#                     'id': existing.id,
#                     'patient_id': patient_id,
#                     'created_at': existing.created_at.isoformat(),
#                     'model_name': existing.model_name,
#                     'count': AIAnalysisResult.objects.filter(
#                         patient_id=patient_id,
#                         study_uid=study_uid,
#                         model_name=model_name
#                     ).count()
#                 }
#             })
#         else:
#             return JsonResponse({'exists': False})
            
#     except Exception as e:
#         logger.error(f"중복 체크 실패: {e}")
#         return JsonResponse({'exists': False, 'error': str(e)})


# # @csrf_exempt
# # def debug_patient_info(request):
# #     """환자 정보 디버깅용 API"""
# #     if request.method == 'POST':
# #         try:
# #             data = json.loads(request.body)
# #             study_uid = data.get('study_uid')
            
# #             # PACS에서 환자 정보 가져오기
# #             patient_info = get_patient_info_from_pacs(study_uid)
            
# #             if patient_info:
# #                 return JsonResponse({
# #                     'status': 'success',
# #                     'message': 'PACS에서 환자 정보를 성공적으로 가져왔습니다.',
# #                     'patient_info': patient_info
# #                 })
# #             else:
# #                 return JsonResponse({
# #                     'status': 'error',
# #                     'message': f'PACS에서 Study UID {study_uid}를 찾을 수 없습니다.'
# #                 }, status=404)
                
# #         except Exception as e:
# #             return JsonResponse({
# #                 'status': 'error',
# #                 'message': f'오류: {str(e)}'
# #             }, status=500)
    
# #     return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

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

# @csrf_exempt
# def get_pacs_studies(request):
#     """PACS 스터디 목록 가져오기 (CORS 우회)"""
#     try:
#         orthanc_url = "http://localhost:8042"
        
#         # PACS에서 스터디 목록 가져오기
#         response = requests.get(f"{orthanc_url}/studies", timeout=80)
#         response.raise_for_status()
#         studies = response.json()
        
#         study_list = []
#         for study_id in studies:
#             try:
#                 study_response = requests.get(f"{orthanc_url}/studies/{study_id}", timeout=80)
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

    
# from rest_framework.decorators import api_view
# from django.views.decorators.csrf import csrf_exempt
# from rest_framework.response import Response
# from rest_framework import status

# from .models import AIAnalysisResult
# from .utils import get_instance_info, get_dicom_file  # 또는 직접 코드 내에 포함

# class AIAnalysisResultSaveAPIView(APIView):
#     def get_image_dimensions_from_orthanc(self, instance_id):
#         """Orthanc에서 이미지 해상도 정보 가져오기"""
#         try:
#             orthanc_url = "http://localhost:8042"  # 또는 localhost:8042
#             auth = ("orthanc", "orthanc")
            
#             logger.info(f"🔍 해상도 추출 시도: instance_id={instance_id}")
            
#             # 1. Instance 태그에서 해상도 정보 가져오기 시도
#             tags_response = requests.get(f"{orthanc_url}/instances/{instance_id}/tags", auth=auth, timeout=10)
#             if tags_response.status_code == 200:
#                 tags = tags_response.json()
#                 logger.info(f"📋 Instance tags 응답: {len(tags)}개 태그")
                
#                 # DICOM 태그에서 해상도 추출
#                 rows_tag = tags.get("0028,0010", {})  # Rows
#                 cols_tag = tags.get("0028,0011", {})  # Columns
                
#                 logger.info(f"🔍 Rows 태그: {rows_tag}")
#                 logger.info(f"🔍 Columns 태그: {cols_tag}")
                
#                 rows = rows_tag.get("Value", [None])[0] if rows_tag.get("Value") else None
#                 cols = cols_tag.get("Value", [None])[0] if cols_tag.get("Value") else None
                
#                 if rows and cols:
#                     height = int(rows)
#                     width = int(cols)
#                     logger.info(f"✅ DICOM 태그에서 해상도 추출 성공: {width}x{height}")
#                     return width, height
#                 else:
#                     logger.warning(f"⚠️ DICOM 태그에서 해상도 값 없음: rows={rows}, cols={cols}")
#             else:
#                 logger.warning(f"⚠️ Instance tags 요청 실패: {tags_response.status_code}")
            
#             # 2. DICOM 파일 직접 다운로드해서 해상도 추출
#             logger.info("🔍 DICOM 파일 직접 다운로드 시도...")
#             dicom_response = requests.get(f"{orthanc_url}/instances/{instance_id}/file", auth=auth, timeout=10)
#             if dicom_response.status_code == 200:
#                 logger.info(f"📁 DICOM 파일 다운로드 성공: {len(dicom_response.content)} bytes")
#                 dicom_data = pydicom.dcmread(BytesIO(dicom_response.content))
                
#                 if hasattr(dicom_data, 'Rows') and hasattr(dicom_data, 'Columns'):
#                     height = int(dicom_data.Rows)
#                     width = int(dicom_data.Columns)
#                     logger.info(f"✅ DICOM 파일에서 해상도 추출 성공: {width}x{height}")
#                     return width, height
#                 else:
#                     logger.warning(f"⚠️ DICOM 파일에 Rows/Columns 속성 없음")
#             else:
#                 logger.warning(f"⚠️ DICOM 파일 다운로드 실패: {dicom_response.status_code}")
            
#             # 3. Preview 이미지에서 해상도 추출 (마지막 수단)
#             logger.info("🔍 Preview 이미지에서 해상도 추출 시도...")
#             preview_response = requests.get(f"{orthanc_url}/instances/{instance_id}/preview", auth=auth, timeout=10)
#             if preview_response.status_code == 200:
#                 from PIL import Image
#                 image = Image.open(BytesIO(preview_response.content))
#                 width, height = image.size
#                 logger.info(f"✅ Preview 이미지에서 해상도 추출: {width}x{height}")
#                 return width, height
#             else:
#                 logger.warning(f"⚠️ Preview 이미지 요청 실패: {preview_response.status_code}")
                
#         except Exception as e:
#             logger.error(f"❌ 해상도 추출 중 예외 발생: {e}")
#             logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
        
#         # 기본값 반환
#         logger.warning(f"⚠️ 모든 해상도 추출 방법 실패, 기본값 사용: 1024x1024")
#         return 1024, 1024

#     def post(self, request):
#         try:
#             # 🔥 원본 payload 전체 로깅
#             if hasattr(request, 'body'):
#                 raw_body = request.body.decode('utf-8')
#                 logger.info("🔍 ===== 받은 RAW PAYLOAD =====")
#                 logger.info(raw_body)
#                 logger.info("🔍 ===========================")
            
#             try:
#                 data = json.loads(request.body.decode('utf-8'))
#             except Exception:
#                 data = request.data

#             # 🔥 파싱된 payload 구조 상세 로깅
#             logger.info("🔍 ===== 파싱된 PAYLOAD 구조 =====")
#             logger.info(f"📋 최상위 키들: {list(data.keys())}")
            
#             for key, value in data.items():
#                 if isinstance(value, dict):
#                     logger.info(f"📂 {key}: {list(value.keys())}")
#                 elif isinstance(value, list) and len(value) > 0:
#                     logger.info(f"📜 {key}: [{len(value)}개 항목] 첫 번째: {type(value[0])}")
#                     if isinstance(value[0], dict):
#                         logger.info(f"    첫 번째 항목 키들: {list(value[0].keys())}")
#                 else:
#                     logger.info(f"📄 {key}: {type(value)} = {value}")
#             logger.info("🔍 ==============================")

#             # instance_id와 result 확인
#             instance_id = data.get("instance_id")
#             result = data.get("result")

#             # 🔥 해상도 정보 다각도 검색
#             logger.info("🔍 ===== 해상도 정보 검색 =====")
            
#             # 1. 최상위 레벨에서 검색
#             top_level_width = data.get("image_width")
#             top_level_height = data.get("image_height")
#             logger.info(f"📐 최상위 해상도: {top_level_width}x{top_level_height}")
            
#             # 2. result 내부에서 검색
#             result_width = None
#             result_height = None
#             if result:
#                 result_width = result.get("image_width")
#                 result_height = result.get("image_height")
#                 logger.info(f"📐 result 내부 해상도: {result_width}x{result_height}")
                
#                 # image_info 내부도 확인
#                 image_info = result.get("image_info", {})
#                 if image_info:
#                     info_width = image_info.get("original_width")
#                     info_height = image_info.get("original_height")
#                     logger.info(f"📐 image_info 해상도: {info_width}x{info_height}")
            
#             # 3. detections 내부에서 검색
#             detections = result.get("detections", []) if result else data.get("detections", [])
#             detection_width = None
#             detection_height = None
#             if detections and len(detections) > 0:
#                 detection_width = detections[0].get("image_width")
#                 detection_height = detections[0].get("image_height")
#                 logger.info(f"📐 detection 해상도: {detection_width}x{detection_height}")
            
#             logger.info("🔍 ========================")

#             # 🔁 단일 result 형태일 경우 자동으로 변환
#             if not result and all(k in data for k in ["label", "bbox", "confidence_score"]):
#                 logger.info("⚠️ 단일 detection payload 감지 → 자동 변환 수행")
#                 result = {
#                     "detections": [
#                         {
#                             "class_name": data.get("label", "Unknown"),
#                             "confidence": data.get("confidence_score", 0.0),
#                             "bbox": data.get("bbox", [0, 0, 0, 0]),
#                             "description": data.get("ai_text", ""),
#                             # 🔥 단일 변환 시에도 해상도 정보 포함
#                             "image_width": top_level_width or data.get("image_width"),
#                             "image_height": top_level_height or data.get("image_height")
#                         }
#                     ],
#                     "metadata": {
#                         "model_used": data.get("model_name", "unknown"),
#                         "model_version": data.get("model_version", "v1.0")
#                     },
#                     "processing_time": data.get("processing_time", 0.0),
#                     # 🔥 result 레벨에도 해상도 정보 포함
#                     "image_width": top_level_width or data.get("image_width"),
#                     "image_height": top_level_height or data.get("image_height")
#                 }
#                 instance_id = data.get("instance_uid") or data.get("instance_id")

#             if not instance_id or not result:
#                 return Response({"error": "instance_id 또는 result 누락"}, status=400)

#             detections = result.get("detections", [])
#             metadata = result.get("metadata", {})
#             processing_time = result.get("processing_time", 0.0)

#             # 🧠 DICOM 정보 조회
#             instance_info = get_instance_info(instance_id)
#             if not instance_info:
#                 return Response({"error": f"Instance {instance_id} 정보를 찾을 수 없습니다."}, status=404)

#             tags = instance_info.get("MainDicomTags", {})
#             study_uid = tags.get("StudyInstanceUID") or f"MISSING_STUDY_{instance_id}"
#             series_uid = tags.get("SeriesInstanceUID") or f"MISSING_SERIES_{instance_id}"
#             instance_uid = tags.get("SOPInstanceUID", instance_id)
#             instance_number = int(tags.get("InstanceNumber", 1))
#             modality = tags.get("Modality", "UNKNOWN")
#             patient_id = tags.get("PatientID", "UNKNOWN")

#             # 🔥 해상도 정보 결정 (우선순위 적용)
#             image_width = 0
#             image_height = 0
            
#             logger.info("🔥 ===== 해상도 결정 과정 =====")
            
#             # 우선순위 1: payload의 최상위 해상도
#             if top_level_width and top_level_height and top_level_width > 0 and top_level_height > 0:
#                 image_width = int(top_level_width)
#                 image_height = int(top_level_height)
#                 logger.info(f"✅ 우선순위 1 - payload 최상위: {image_width}x{image_height}")
            
#             # 우선순위 2: result 내부 해상도
#             elif result_width and result_height and result_width > 0 and result_height > 0:
#                 image_width = int(result_width)
#                 image_height = int(result_height)
#                 logger.info(f"✅ 우선순위 2 - result 내부: {image_width}x{image_height}")
            
#             # 우선순위 3: detection 내부 해상도
#             elif detection_width and detection_height and detection_width > 0 and detection_height > 0:
#                 image_width = int(detection_width)
#                 image_height = int(detection_height)
#                 logger.info(f"✅ 우선순위 3 - detection 내부: {image_width}x{image_height}")
            
#             # 우선순위 4: Orthanc에서 직접 추출
#             else:
#                 image_width, image_height = self.get_image_dimensions_from_orthanc(instance_id)
#                 logger.info(f"✅ 우선순위 4 - Orthanc 추출: {image_width}x{image_height}")
            
#             logger.info(f"🎯 최종 결정된 해상도: {image_width}x{image_height}")
#             logger.info("🔥 =========================")

#             saved_results = []

#             for i, det in enumerate(detections):
#                 logger.info(f"🔍 detection[{i}] 처리 중...")
                
#                 box = det.get("bbox", {})
#                 bbox = [
#                     int(box.get("x", 0)),
#                     int(box.get("y", 0)),
#                     int(box.get("x", 0) + box.get("width", 0)),
#                     int(box.get("y", 0) + box.get("height", 0)),
#                 ] if isinstance(box, dict) else list(map(int, box))

#                 item = {
#                     "patient_id": patient_id,
#                     "study_uid": study_uid,
#                     "series_uid": series_uid,
#                     "instance_uid": instance_uid,
#                     "instance_number": instance_number,
#                     "label": det.get("class_name", "Unknown"),
#                     "bbox": bbox,
#                     "confidence_score": det.get("confidence", 0.0),
#                     "ai_text": det.get("description", ""),
#                     "modality": modality,
#                     "model_name": metadata.get("model_used", "unknown"),
#                     "model_version": metadata.get("model_version", "v1.0"),
#                     "image_width": image_width,    # 🔥 이제 실제 해상도 저장!
#                     "image_height": image_height,  # 🔥 이제 실제 해상도 저장!
#                     "processing_time": processing_time
#                 }

#                 logger.info(f"💾 저장할 item: label={item['label']}, 해상도={item['image_width']}x{item['image_height']}")

#                 serializer = AIAnalysisResultSerializer(data=item)
#                 if serializer.is_valid():
#                     saved_result = serializer.save()
#                     saved_results.append(saved_result)
#                     logger.info(f"✅ 저장 완료: ID={saved_result.id}, 해상도={saved_result.image_width}x{saved_result.image_height}")
#                 else:
#                     logger.error("📛 serializer 오류 발생:")
#                     logger.error(serializer.errors)

#             return Response({
#                 "status": "success",
#                 "study_uid": study_uid,
#                 "count": len(saved_results),
#                 "image_dimensions": f"{image_width}x{image_height}",
#                 "debug_info": {
#                     "payload_top_level": f"{top_level_width}x{top_level_height}",
#                     "result_level": f"{result_width}x{result_height}",
#                     "detection_level": f"{detection_width}x{detection_height}",
#                     "final_used": f"{image_width}x{image_height}"
#                 },
#                 "results": [
#                     {
#                         "id": result.id,
#                         "label": result.label,
#                         "bbox": result.bbox,
#                         "confidence": result.confidence_score,
#                         "image_width": result.image_width,
#                         "image_height": result.image_height
#                     } for result in saved_results
#                 ]
#             }, status=200)
            
#         except Exception as e:
#             logger.error(f"❌ API 처리 중 예외 발생: {e}")
#             logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
#             return Response({"error": str(e)}, status=500)



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

from django.utils.decorators import method_decorator        
        
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import AIAnalysisResult
from .serializers import AIAnalysisResultSerializer
    
    
# views.py
from rest_framework.views import APIView
from rest_framework import status
# from .models import AIAnalysisResult # 필요하다면 모델 임포트
from .serializers import AIAnalysisResultSerializer # 시리얼라이저 임포트
from .utils import save_analysis_result
import pydicom
from io import BytesIO

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


# Django views.py 수정 - YOLO와 SSD 함수에서 실제 인스턴스 정보 사용

# 🔥 analyze_study_now (YOLO) 함수에서 수정할 부분:

@csrf_exempt
def analyze_study_now(request):
    """기본 YOLO 분석 - 실제 인스턴스 정보 사용"""
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
            
            # 🔥 실제 인스턴스 정보 가져오기
            from .pacs_utils import get_real_instance_info_from_pacs
            instance_info = get_real_instance_info_from_pacs(study_uid)
            print(f"📍 실제 인스턴스 정보: {instance_info}")
            
            # 중복 체크 및 덮어쓰기 처리 (기존 로직 유지)
            overwrite = data.get('overwrite', False)
            print(f"🔥 YOLO 덮어쓰기 모드: {overwrite}")

            if not overwrite:
                from .models import AIAnalysisResult
                existing = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,
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
                    patient_id=patient_id,
                    study_uid=study_uid,
                    model_name='YOLOv8'
                ).delete()[0]
                print(f"🗑️ 기존 YOLO 결과 {deleted_count}개 삭제 (환자: {patient_id})")
            
            # YOLO 모델 로드 및 분석 (기존 로직)
            model_path = settings.AI_MODELS_DIR / 'yolov8' / "yolov8_best.pt"
            model = YOLO(str(model_path))
            
            # Orthanc에서 이미지 가져오기
            image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
            # 원본 이미지 해상도
            original_width = int(image.width)
            original_height = int(image.height)
            print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
            
            # YOLO 추론
            results = model(image)
            print("🔥🔥🔥 YOLO 추론 완료, 분석 시작!")
            
            # 결과 처리
            detection_results = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names.get(class_id, f"class_{class_id}")
                        
                        # 🔥 실제 인스턴스 정보로 DB 저장
                        from .models import AIAnalysisResult
                        ai_result = AIAnalysisResult.objects.create(
                            patient_id=patient_info['patient_id'],
                            study_uid=study_uid,
                            series_uid=instance_info['series_uid'],        # 🔥 실제 Series UID
                            instance_uid=instance_info['instance_uid'],    # 🔥 실제 Instance UID
                            instance_number=instance_info['instance_number'], # 🔥 실제 Instance Number
                            label=class_name,
                            bbox=[int(x1), int(y1), int(x2), int(y2)],
                            confidence_score=confidence,
                            ai_text=f"{class_name} 검출 (YOLO) - 환자: {patient_info['patient_name']}",
                            modality="CR",
                            model_name="YOLOv8",
                            model_version="best",
                            image_width=original_width,
                            image_height=original_height,
                            processing_time=1.0
                        )
                        
                        print(f"✅ YOLO 결과 저장: ID={ai_result.id}, Instance={instance_info['instance_uid']}")
                        
                        detection_results.append({
                            'id': ai_result.id,
                            'label': class_name,
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': confidence,
                            'description': f"{class_name} (YOLO: {confidence:.2f})",
                            'image_width': original_width,
                            'image_height': original_height,
                            'instance_info': instance_info,  # 🔥 인스턴스 정보 포함
                            'patient_info': {
                                'patient_id': patient_info['patient_id'],
                                'patient_name': patient_info['patient_name']
                            }
                        })
            
            print(f"✅ YOLO 분석 완료: {len(detection_results)}개 검출")
            print(f"✅ 저장된 인스턴스: {instance_info['instance_uid']}")
            
            return JsonResponse({
                'status': 'success',
                'model_used': 'YOLOv8',
                'study_uid': study_uid,
                'patient_info': patient_info,
                'instance_info': instance_info,  # 🔥 인스턴스 정보 포함
                'detections': len(detection_results),
                'image_width': original_width,
                'image_height': original_height,
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

# 🔥 analyze_with_ssd (SSD) 함수에서 수정할 부분:

@csrf_exempt
def analyze_with_ssd(request):
    """SSD 모델로 분석 - 실제 인스턴스 정보 사용"""
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
            
            # 🔥 실제 인스턴스 정보 가져오기
            from .pacs_utils import get_real_instance_info_from_pacs
            instance_info = get_real_instance_info_from_pacs(study_uid)
            print(f"📍 실제 인스턴스 정보: {instance_info}")
            
            # 중복 체크 및 덮어쓰기 처리
            overwrite = data.get('overwrite', False)
            print(f"🔥 SSD 덮어쓰기 모드: {overwrite}")

            if not overwrite:
                from .models import AIAnalysisResult
                existing = AIAnalysisResult.objects.filter(
                    patient_id=patient_id,
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
                    patient_id=patient_id,
                    study_uid=study_uid,
                    model_name='SSD'
                ).delete()[0]
                print(f"🗑️ 기존 SSD 결과 {deleted_count}개 삭제 (환자: {patient_id})")
            
            # SSD 모델 로드 및 분석 (기존 로직)
            image = get_image_from_orthanc(patient_info['pacs_study_id'])
            
            # 원본 이미지 해상도
            original_width = int(image.width)
            original_height = int(image.height)
            print(f"📐 원본 이미지 해상도: {original_width}x{original_height}")
            
            # SSD 모델 로드 및 분석
            model, device = ModelManager.load_ssd_model()
            detections = ModelManager.run_ssd_inference(model, device, image)
            
            print(f"🔍 SSD detections 개수: {len(detections)}")
            
            # DB 저장 및 결과 처리
            from .models import AIAnalysisResult
            
            saved_results = []
            for i, detection in enumerate(detections):
                bbox = detection['bbox']
                
                print(f"🔍 SSD detection[{i}]: {detection['label']}")
                print(f"🔍 bbox: {bbox}")
                print(f"🔍 confidence: {detection['confidence']:.3f}")
                
                # bbox 유효성 검사
                if len(bbox) >= 4:
                    x1, y1, x2, y2 = bbox[:4]
                    bbox_width = x2 - x1
                    bbox_height = y2 - y1
                    
                    print(f"📏 bbox 크기: {bbox_width}x{bbox_height}")
                    
                    # 최소 크기 보장
                    if bbox_width < 20 or bbox_height < 20:
                        print(f"⚠️ 박스가 너무 작음: {bbox_width}x{bbox_height}, 확대")
                        center_x = (x1 + x2) // 2
                        center_y = (y1 + y2) // 2
                        
                        new_width = max(50, bbox_width * 3)
                        new_height = max(50, bbox_height * 3)
                        
                        x1 = max(0, center_x - new_width // 2)
                        y1 = max(0, center_y - new_height // 2)
                        x2 = min(original_width, center_x + new_width // 2)
                        y2 = min(original_height, center_y + new_height // 2)
                        
                        bbox = [x1, y1, x2, y2]
                        print(f"✅ 확대된 bbox: {bbox} (크기: {x2-x1}x{y2-y1})")
                    
                    # 최종 유효성 검사
                    if x2 > x1 and y2 > y1:
                        # 🔥 실제 인스턴스 정보로 DB 저장
                        ai_result = AIAnalysisResult.objects.create(
                            patient_id=patient_info['patient_id'],
                            study_uid=study_uid,
                            series_uid=instance_info['series_uid'],        # 🔥 실제 Series UID
                            instance_uid=instance_info['instance_uid'],    # 🔥 실제 Instance UID
                            instance_number=instance_info['instance_number'], # 🔥 실제 Instance Number
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
                        
                        print(f"✅ SSD 결과 저장: ID={ai_result.id}, Instance={instance_info['instance_uid']}")
                        
                        saved_results.append({
                            'id': ai_result.id,
                            'label': detection['label'],
                            'bbox': bbox,
                            'confidence': detection['confidence'],
                            'description': f"{detection['label']} (SSD: {detection['confidence']:.2f})",
                            'image_width': original_width,
                            'image_height': original_height,
                            'instance_info': instance_info,  # 🔥 인스턴스 정보 포함
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
            print(f"✅ 저장된 인스턴스: {instance_info['instance_uid']}")
            
            return JsonResponse({
                'status': 'success',
                'model_used': 'SSD',
                'study_uid': study_uid,
                'patient_info': patient_info,
                'instance_info': instance_info,  # 🔥 인스턴스 정보 포함
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
    """저장된 AI 분석 결과 조회 - React 친화적으로 수정"""
    try:
        from .models import AIAnalysisResult
        
        # 🔥 쿼리 파라미터로 모델 타입 필터링 가능
        model_type = request.GET.get('model_type', None)
        
        if model_type:
            # 특정 모델 결과만 조회
            model_name_mapping = {
                'yolo': 'YOLOv8',
                'ssd': 'SSD'
            }
            model_name = model_name_mapping.get(model_type.lower(), model_type)
            results = AIAnalysisResult.objects.filter(
                study_uid=study_uid, 
                model_name=model_name
            ).order_by('-created_at')
        else:
            # 모든 모델 결과 조회
            results = AIAnalysisResult.objects.filter(study_uid=study_uid).order_by('model_name', '-created_at')

        # 🔥 모델별로 그룹화 (기존 로직 유지)
        grouped_data = {}
        all_data = []
        
        for result in results:
            result_data = {
                'id': result.id,
                'label': result.label,
                'bbox': result.bbox,
                'confidence': result.confidence_score,
                'description': result.ai_text,
                'model': result.model_name,
                'patient_id': result.patient_id,
                'image_width': result.image_width,
                'image_height': result.image_height,
                'created_at': result.created_at.isoformat(),
                
                # 🔥 새로 추가: React에서 필요한 필드들
                'study_uid': result.study_uid,
                'series_uid': result.series_uid,
                'instance_uid': result.instance_uid,
                'instance_number': result.instance_number,
                'model_name': result.model_name,
                'model_version': result.model_version,
                'processing_time': result.processing_time
            }
            
            all_data.append(result_data)
            
            # 모델별 그룹화
            if result.model_name not in grouped_data:
                grouped_data[result.model_name] = []
            grouped_data[result.model_name].append(result_data)

        return JsonResponse({
            'status': 'success',
            'study_uid': study_uid,
            'total_count': len(all_data),
            'models': list(grouped_data.keys()),
            'grouped_by_model': grouped_data,  # 🔥 기존 형태 유지 (하위 호환성)
            'results': all_data  # 🔥 새로 추가: React에서 인스턴스별 필터링용
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
        yolo_path = settings.AI_MODELS_DIR / 'yolov8' / "yolov8_best.pt" # 'ai_models' 중복 제거!
        ssd_path = settings.AI_MODELS_DIR / 'ssd' / "ssd.pth"   
        
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
        response = requests.get(f"{orthanc_url}/studies", timeout=80)
        response.raise_for_status()
        studies = response.json()
        
        study_list = []
        for study_id in studies:
            try:
                study_response = requests.get(f"{orthanc_url}/studies/{study_id}", timeout=80)
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

    
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework import status

from .models import AIAnalysisResult
from .utils import get_instance_info, get_dicom_file  # 또는 직접 코드 내에 포함

class AIAnalysisResultSaveAPIView(APIView):
    def get_image_dimensions_from_orthanc(self, instance_id):
        """Orthanc에서 이미지 해상도 정보 가져오기"""
        try:
            orthanc_url = "http://localhost:8042"  # 또는 localhost:8042
            auth = ("orthanc", "orthanc")
            
            logger.info(f"🔍 해상도 추출 시도: instance_id={instance_id}")
            
            # 1. Instance 태그에서 해상도 정보 가져오기 시도
            tags_response = requests.get(f"{orthanc_url}/instances/{instance_id}/tags", auth=auth, timeout=10)
            if tags_response.status_code == 200:
                tags = tags_response.json()
                logger.info(f"📋 Instance tags 응답: {len(tags)}개 태그")
                
                # DICOM 태그에서 해상도 추출
                rows_tag = tags.get("0028,0010", {})  # Rows
                cols_tag = tags.get("0028,0011", {})  # Columns
                
                logger.info(f"🔍 Rows 태그: {rows_tag}")
                logger.info(f"🔍 Columns 태그: {cols_tag}")
                
                rows = rows_tag.get("Value", [None])[0] if rows_tag.get("Value") else None
                cols = cols_tag.get("Value", [None])[0] if cols_tag.get("Value") else None
                
                if rows and cols:
                    height = int(rows)
                    width = int(cols)
                    logger.info(f"✅ DICOM 태그에서 해상도 추출 성공: {width}x{height}")
                    return width, height
                else:
                    logger.warning(f"⚠️ DICOM 태그에서 해상도 값 없음: rows={rows}, cols={cols}")
            else:
                logger.warning(f"⚠️ Instance tags 요청 실패: {tags_response.status_code}")
            
            # 2. DICOM 파일 직접 다운로드해서 해상도 추출
            logger.info("🔍 DICOM 파일 직접 다운로드 시도...")
            dicom_response = requests.get(f"{orthanc_url}/instances/{instance_id}/file", auth=auth, timeout=10)
            if dicom_response.status_code == 200:
                logger.info(f"📁 DICOM 파일 다운로드 성공: {len(dicom_response.content)} bytes")
                dicom_data = pydicom.dcmread(BytesIO(dicom_response.content))
                
                if hasattr(dicom_data, 'Rows') and hasattr(dicom_data, 'Columns'):
                    height = int(dicom_data.Rows)
                    width = int(dicom_data.Columns)
                    logger.info(f"✅ DICOM 파일에서 해상도 추출 성공: {width}x{height}")
                    return width, height
                else:
                    logger.warning(f"⚠️ DICOM 파일에 Rows/Columns 속성 없음")
            else:
                logger.warning(f"⚠️ DICOM 파일 다운로드 실패: {dicom_response.status_code}")
            
            # 3. Preview 이미지에서 해상도 추출 (마지막 수단)
            logger.info("🔍 Preview 이미지에서 해상도 추출 시도...")
            preview_response = requests.get(f"{orthanc_url}/instances/{instance_id}/preview", auth=auth, timeout=10)
            if preview_response.status_code == 200:
                from PIL import Image
                image = Image.open(BytesIO(preview_response.content))
                width, height = image.size
                logger.info(f"✅ Preview 이미지에서 해상도 추출: {width}x{height}")
                return width, height
            else:
                logger.warning(f"⚠️ Preview 이미지 요청 실패: {preview_response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ 해상도 추출 중 예외 발생: {e}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
        
        # 기본값 반환
        logger.warning(f"⚠️ 모든 해상도 추출 방법 실패, 기본값 사용: 1024x1024")
        return 1024, 1024

    def post(self, request):
        try:
            # 🔥 원본 payload 전체 로깅
            if hasattr(request, 'body'):
                raw_body = request.body.decode('utf-8')
                logger.info("🔍 ===== 받은 RAW PAYLOAD =====")
                logger.info(raw_body)
                logger.info("🔍 ===========================")
            
            try:
                data = json.loads(request.body.decode('utf-8'))
            except Exception:
                data = request.data

            # 🔥 파싱된 payload 구조 상세 로깅
            logger.info("🔍 ===== 파싱된 PAYLOAD 구조 =====")
            logger.info(f"📋 최상위 키들: {list(data.keys())}")
            
            for key, value in data.items():
                if isinstance(value, dict):
                    logger.info(f"📂 {key}: {list(value.keys())}")
                elif isinstance(value, list) and len(value) > 0:
                    logger.info(f"📜 {key}: [{len(value)}개 항목] 첫 번째: {type(value[0])}")
                    if isinstance(value[0], dict):
                        logger.info(f"    첫 번째 항목 키들: {list(value[0].keys())}")
                else:
                    logger.info(f"📄 {key}: {type(value)} = {value}")
            logger.info("🔍 ==============================")

            # instance_id와 result 확인
            instance_id = data.get("instance_id")
            result = data.get("result")

            # 🔥 해상도 정보 다각도 검색
            logger.info("🔍 ===== 해상도 정보 검색 =====")
            
            # 1. 최상위 레벨에서 검색
            top_level_width = data.get("image_width")
            top_level_height = data.get("image_height")
            logger.info(f"📐 최상위 해상도: {top_level_width}x{top_level_height}")
            
            # 2. result 내부에서 검색
            result_width = None
            result_height = None
            if result:
                result_width = result.get("image_width")
                result_height = result.get("image_height")
                logger.info(f"📐 result 내부 해상도: {result_width}x{result_height}")
                
                # image_info 내부도 확인
                image_info = result.get("image_info", {})
                if image_info:
                    info_width = image_info.get("original_width")
                    info_height = image_info.get("original_height")
                    logger.info(f"📐 image_info 해상도: {info_width}x{info_height}")
            
            # 3. detections 내부에서 검색
            detections = result.get("detections", []) if result else data.get("detections", [])
            detection_width = None
            detection_height = None
            if detections and len(detections) > 0:
                detection_width = detections[0].get("image_width")
                detection_height = detections[0].get("image_height")
                logger.info(f"📐 detection 해상도: {detection_width}x{detection_height}")
            
            logger.info("🔍 ========================")

            # 🔁 단일 result 형태일 경우 자동으로 변환
            if not result and all(k in data for k in ["label", "bbox", "confidence_score"]):
                logger.info("⚠️ 단일 detection payload 감지 → 자동 변환 수행")
                result = {
                    "detections": [
                        {
                            "class_name": data.get("label", "Unknown"),
                            "confidence": data.get("confidence_score", 0.0),
                            "bbox": data.get("bbox", [0, 0, 0, 0]),
                            "description": data.get("ai_text", ""),
                            # 🔥 단일 변환 시에도 해상도 정보 포함
                            "image_width": top_level_width or data.get("image_width"),
                            "image_height": top_level_height or data.get("image_height")
                        }
                    ],
                    "metadata": {
                        "model_used": data.get("model_name", "unknown"),
                        "model_version": data.get("model_version", "v1.0")
                    },
                    "processing_time": data.get("processing_time", 0.0),
                    # 🔥 result 레벨에도 해상도 정보 포함
                    "image_width": top_level_width or data.get("image_width"),
                    "image_height": top_level_height or data.get("image_height")
                }
                instance_id = data.get("instance_uid") or data.get("instance_id")

            if not instance_id or not result:
                return Response({"error": "instance_id 또는 result 누락"}, status=400)

            detections = result.get("detections", [])
            metadata = result.get("metadata", {})
            processing_time = result.get("processing_time", 0.0)

            # 🧠 DICOM 정보 조회
            instance_info = get_instance_info(instance_id)
            if not instance_info:
                return Response({"error": f"Instance {instance_id} 정보를 찾을 수 없습니다."}, status=404)

            tags = instance_info.get("MainDicomTags", {})
            study_uid = tags.get("StudyInstanceUID") or f"MISSING_STUDY_{instance_id}"
            series_uid = tags.get("SeriesInstanceUID") or f"MISSING_SERIES_{instance_id}"
            instance_uid = tags.get("SOPInstanceUID", instance_id)
            instance_number = int(tags.get("InstanceNumber", 1))
            modality = tags.get("Modality", "UNKNOWN")
            patient_id = tags.get("PatientID", "UNKNOWN")

            # 🔥 해상도 정보 결정 (우선순위 적용)
            image_width = 0
            image_height = 0
            
            logger.info("🔥 ===== 해상도 결정 과정 =====")
            
            # 우선순위 1: payload의 최상위 해상도
            if top_level_width and top_level_height and top_level_width > 0 and top_level_height > 0:
                image_width = int(top_level_width)
                image_height = int(top_level_height)
                logger.info(f"✅ 우선순위 1 - payload 최상위: {image_width}x{image_height}")
            
            # 우선순위 2: result 내부 해상도
            elif result_width and result_height and result_width > 0 and result_height > 0:
                image_width = int(result_width)
                image_height = int(result_height)
                logger.info(f"✅ 우선순위 2 - result 내부: {image_width}x{image_height}")
            
            # 우선순위 3: detection 내부 해상도
            elif detection_width and detection_height and detection_width > 0 and detection_height > 0:
                image_width = int(detection_width)
                image_height = int(detection_height)
                logger.info(f"✅ 우선순위 3 - detection 내부: {image_width}x{image_height}")
            
            # 우선순위 4: Orthanc에서 직접 추출
            else:
                image_width, image_height = self.get_image_dimensions_from_orthanc(instance_id)
                logger.info(f"✅ 우선순위 4 - Orthanc 추출: {image_width}x{image_height}")
            
            logger.info(f"🎯 최종 결정된 해상도: {image_width}x{image_height}")
            logger.info("🔥 =========================")

            saved_results = []

            for i, det in enumerate(detections):
                logger.info(f"🔍 detection[{i}] 처리 중...")
                
                box = det.get("bbox", {})
                bbox = [
                    int(box.get("x", 0)),
                    int(box.get("y", 0)),
                    int(box.get("x", 0) + box.get("width", 0)),
                    int(box.get("y", 0) + box.get("height", 0)),
                ] if isinstance(box, dict) else list(map(int, box))

                item = {
                    "patient_id": patient_id,
                    "study_uid": study_uid,
                    "series_uid": series_uid,
                    "instance_uid": instance_uid,
                    "instance_number": instance_number,
                    "label": det.get("class_name", "Unknown"),
                    "bbox": bbox,
                    "confidence_score": det.get("confidence", 0.0),
                    "ai_text": det.get("description", ""),
                    "modality": modality,
                    "model_name": metadata.get("model_used", "unknown"),
                    "model_version": metadata.get("model_version", "v1.0"),
                    "image_width": image_width,    # 🔥 이제 실제 해상도 저장!
                    "image_height": image_height,  # 🔥 이제 실제 해상도 저장!
                    "processing_time": processing_time
                }

                logger.info(f"💾 저장할 item: label={item['label']}, 해상도={item['image_width']}x{item['image_height']}")

                serializer = AIAnalysisResultSerializer(data=item)
                if serializer.is_valid():
                    saved_result = serializer.save()
                    saved_results.append(saved_result)
                    logger.info(f"✅ 저장 완료: ID={saved_result.id}, 해상도={saved_result.image_width}x{saved_result.image_height}")
                else:
                    logger.error("📛 serializer 오류 발생:")
                    logger.error(serializer.errors)

            return Response({
                "status": "success",
                "study_uid": study_uid,
                "count": len(saved_results),
                "image_dimensions": f"{image_width}x{image_height}",
                "debug_info": {
                    "payload_top_level": f"{top_level_width}x{top_level_height}",
                    "result_level": f"{result_width}x{result_height}",
                    "detection_level": f"{detection_width}x{detection_height}",
                    "final_used": f"{image_width}x{image_height}"
                },
                "results": [
                    {
                        "id": result.id,
                        "label": result.label,
                        "bbox": result.bbox,
                        "confidence": result.confidence_score,
                        "image_width": result.image_width,
                        "image_height": result.image_height
                    } for result in saved_results
                ]
            }, status=200)
            
        except Exception as e:
            logger.error(f"❌ API 처리 중 예외 발생: {e}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
            return Response({"error": str(e)}, status=500)