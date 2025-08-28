#!/usr/bin/env python3
"""
YOLOv8 기반 DICOM 이미지 분석 모듈 - 의료 영상 특화
"""

import os
import cv2
import numpy as np
import pydicom
import logging
import traceback
from datetime import datetime
import io
import sys # sys 모듈 임포트 추가 (로깅 핸들러에서 사용)

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logging.warning("ultralytics 패키지가 설치되어 있지 않습니다. pip install ultralytics")

logger = logging.getLogger('YOLOInference')
# YOLOInference 로거에 StreamHandler 추가 및 인코딩 설정
if not logger.handlers: 
    log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(log_formatter)
    stream_handler.encoding = 'utf-8' # <-- 인코딩 설정
    logger.addHandler(stream_handler)
    logger.setLevel(logging.INFO) # DEBUG로 설정하면 더미 모델 결과 생성 과정도 볼 수 있음


class YOLOv8Analyzer:
    """YOLOv8 모델을 사용한 DICOM 이미지 분석 클래스"""
    
    def __init__(self, model_path='/models/yolov8/yolov8_best.pt'):
        self.model_path = model_path
        self.model = None
        self.confidence_threshold = 0.2
        self.iou_threshold = 0.2
        self.class_names = self._get_class_names() # ai_service와 통일된 14개 클래스
        self._load_model()
    
    def _get_class_names(self):
        """의료 영상 클래스 이름 정의 (ai_service와 동일한 14개 클래스)"""
        return {
            0: 'Aortic enlargement',
            1: 'Atelectasis',
            2: 'Calcification',
            3: 'Cardiomegaly',
            4: 'Consolidation',
            5: 'ILD',
            6: 'Infiltration',
            7: 'Lung Opacity',
            8: 'Nodule/Mass',
            9: 'Other lesion',
            10: 'Pleural effusion',
            11: 'Pleural thickening',
            12: 'Pulmonary fibrosis',
            13: 'Normal'
        }
    
    def _load_model(self):
        """YOLOv8 모델 로드"""
        try:
            if not YOLO_AVAILABLE:
                logger.error("ultralytics 패키지를 사용할 수 없습니다.")
                return False
            
            logger.info(f"🔍 YOLOv8 모델 로드 시도: {self.model_path}")
            
            # 모델 파일이 존재하지 않으면 더미 모델 사용
            if not os.path.exists(self.model_path):
                logger.warning(f"YOLOv8 모델을 찾을 수 없습니다: {self.model_path}")
                return False
            
            try:
                # 커스텀 모델 로드
                self.model = YOLO(self.model_path)
                logger.info(f"✅ YOLOv8 모델 로드 완료: {self.model_path}")
                
                # 모델 정보 로깅
                if hasattr(self.model, 'names') and self.model.names:
                    logger.info(f"모델 자체 클래스 수: {len(self.model.names)}")
                    logger.info(f"모델 자체 클래스들: {list(self.model.names.values())}")
                else:
                    logger.warning("YOLOv8 모델에 'names' 속성이 없거나 비어 있습니다. 미리 정의된 클래스 이름을 사용합니다.")

                # 모델 테스트 (더미 이미지로 실제 모델이 작동하는지 확인)
                test_image = np.zeros((640, 640, 3), dtype=np.uint8) # 640x640 RGB 이미지 생성
                test_results = self.model(test_image, conf=0.01, iou=0.01, verbose=False) # 매우 낮은 임계값으로 테스트
                if test_results is not None and len(test_results) > 0 and test_results[0].boxes is not None and len(test_results[0].boxes) > 0:
                    logger.info(f"✅ YOLOv8 모델 테스트 성공! (결과 수: {len(test_results[0].boxes)}). 더미 아님.")
                else:
                    logger.warning("YOLOv8 모델 테스트 후 결과가 없습니다 (실제 검출 없음). 모델 로드에 문제가 있을 수 있습니다.")
                
                return True
                
            except Exception as e:
                logger.error(f"❌ 커스텀 YOLOv8 모델 로드 실패: {e}")
                logger.error(f"상세 에러: {traceback.format_exc()}")
                return False
                
        except Exception as e: # 이 바깥쪽 try-except는 ultralytics 자체의 문제나 예상치 못한 최상위 오류를 잡습니다.
            logger.error(f"❌ 모델 로드 최종 실패: {e}")
            logger.error(f"상세 에러: {traceback.format_exc()}")
            return False
    
    
    def _load_dicom_from_bytes(self, dicom_bytes):
        """바이너리 DICOM 데이터에서 이미지 추출 (Flask AI Service 호환)"""

        try:
            dicom_buffer = io.BytesIO(dicom_bytes)
            dicom_data = pydicom.dcmread(dicom_buffer)
            pixel_array = dicom_data.pixel_array
            
            # WindowCenter와 WindowWidth가 MultiValue일 수 있으므로 첫 번째 값만 사용
            if hasattr(dicom_data, 'WindowCenter') and hasattr(dicom_data, 'WindowWidth'):
                window_center = float(dicom_data.WindowCenter[0] if isinstance(dicom_data.WindowCenter, pydicom.multival.MultiValue) else dicom_data.WindowCenter)
                window_width = float(dicom_data.WindowWidth[0] if isinstance(dicom_data.WindowWidth, pydicom.multival.MultiValue) else dicom_data.WindowWidth)
                
                img_min = window_center - window_width // 2
                img_max = window_center + window_width // 2
                pixel_array = np.clip(pixel_array, img_min, img_max)
            
            # 8비트 정규화 (0~255 범위로 변환)
            if pixel_array.dtype != np.uint8:
                if pixel_array.max() == pixel_array.min():
                    pixel_array = np.zeros_like(pixel_array, dtype=np.uint8)
                else:
                    pixel_array = ((pixel_array - pixel_array.min()) / 
                                 (pixel_array.max() - pixel_array.min()) * 255).astype(np.uint8)
            
            # 그레이스케일 → RGB 변환
            if len(pixel_array.shape) == 2:
                rgb_image = cv2.cvtColor(pixel_array, cv2.COLOR_GRAY2RGB)
            else:
                rgb_image = pixel_array
            
            return rgb_image, dicom_data
            
        except Exception as e:
            logger.error(f"DICOM 이미지 로드 실패: {str(e)}")
            logger.error(traceback.format_exc())
            return None, None
    
    
    def _enhance_medical_image(self, image):
        """의료 영상에 특화된 이미지 향상"""
        try:
            enhanced_image = image.copy()
            
            # CLAHE 적용
            if len(image.shape) == 3 and image.shape[2] == 3: # RGB 이미지
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                lab[:,:,0] = clahe.apply(lab[:,:,0])
                enhanced_image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            elif len(image.shape) == 2: # 그레이스케일 이미지 (RGB로 변환 후 CLAHE)
                temp_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
                lab = cv2.cvtColor(temp_rgb, cv2.COLOR_RGB2LAB)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                lab[:,:,0] = clahe.apply(lab[:,:,0])
                enhanced_image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            else:
                logger.warning("이미지 향상: 예상치 못한 이미지 채널 수. CLAHE 건너뜀.")
                if len(image.shape) == 2:
                    enhanced_image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            
            # 노이즈 제거
            if len(enhanced_image.shape) == 3 and enhanced_image.shape[2] == 3:
                enhanced_image = cv2.bilateralFilter(enhanced_image, 9, 75, 75)
            else:
                logger.warning("노이즈 제거: 이미지 채널이 3개가 아님. bilateralFilter 건너뜀.")
            
            # 샤프닝 필터 적용
            if len(enhanced_image.shape) == 3 and enhanced_image.shape[2] == 3:
                kernel = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]])
                enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
            else:
                logger.warning("샤프닝: 이미지 채널이 3개가 아님. filter2D 건너뜀.")
            
            return enhanced_image
            
        except Exception as e:
            logger.warning(f"이미지 향상 처리 실패: {str(e)}")
            logger.warning(traceback.format_exc())
            return image
    
    
    def _run_inference(self, image):
        """YOLO 추론 실행"""
        try:
            if self.model is None:
                raise ValueError("모델이 로드되지 않았습니다.")
            
            logger.info(f"🎯 YOLO 추론 시작 - 이미지 크기: {image.shape}")
            
            results = self.model(
                image,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                verbose=False
            )
            
            return results
            
        except Exception as e:
            logger.error(f"모델 추론 실패: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    

    def _parse_yolo_outputs(self, results, image_shape):
        """YOLO 검출 결과 후처리 및 ai_service.py 형식에 맞게 변환"""
        detections = []
        
        try:
            for result in results:
                boxes = result.boxes
                if boxes is not None and len(boxes) > 0:
                    logger.info(f"YOLO에서 {len(boxes)}개 검출 (임계치 {self.confidence_threshold})")
                    
                    for i in range(len(boxes)):
                        x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().tolist()
                        confidence = float(boxes.conf[i].cpu().numpy().item())
                        class_id = int(boxes.cls[i].cpu().numpy().item())
                        
                        class_name = self.class_names.get(class_id, f'Unknown_class_{class_id}')
                        
                        if confidence >= self.confidence_threshold:
                            detection_item = {
                                'bbox': {
                                    'x': float(x1),
                                    'y': float(y1),
                                    'width': float(x2 - x1),
                                    'height': float(y2 - y1)
                                },
                                'confidence': confidence,
                                'label': class_name,
                                'confidence_score': confidence,
                                'ai_text': f'YOLOv8 검출: {class_name} (정확도: {confidence:.3f})',
                                'area': float((x2 - x1) * (y2 - y1)),
                                # 🔥 해상도 정보 추가!
                                'image_width': image_shape[1],   # width
                                'image_height': image_shape[0],  # height
                            }
                            
                            detection_item['medical_info'] = self._extract_medical_features(detection_item, image_shape)
                            detections.append(detection_item)
                            
                            logger.info(f"✅ YOLO 검출: {class_name} ({confidence:.3f}) [x:{x1:.1f},y:{y1:.1f},w:{(x2-x1):.1f},h:{(y2-y1):.1f}] 해상도:{image_shape[1]}x{image_shape[0]}")
                else:
                    logger.info("YOLO에서 검출된 객체가 없습니다.")
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO 검출 결과 후처리 실패: {str(e)}")
            logger.error(f"상세 에러: {traceback.format_exc()}")
            return []

    def analyze(self, dicom_data_bytes):
        """DICOM 이미지 분석 메인 함수"""
        try:
            start_time = datetime.now()
            
            if self.model is None:
                logger.error("YOLOv8 모델이 로드되지 않았습니다. 분석을 수행할 수 없습니다.")
                return {
                    'success': False,
                    'error': 'YOLOv8 모델이 로드되지 않았습니다.',
                    'detections': []
                }
            
            # DICOM 이미지 로드
            image, dicom_dataset = self._load_dicom_from_bytes(dicom_data_bytes)
            if image is None:
                return {
                    'success': False,
                    'error': 'DICOM 이미지를 로드할 수 없습니다.',
                    'detections': []
                }
            
            # 의료 영상 향상
            enhanced_image = self._enhance_medical_image(image)
            
            # YOLO 추론 실행
            results = self._run_inference(enhanced_image)
            if results is None:
                return {
                    'success': False,
                    'error': '모델 추론에 실패했습니다.',
                    'detections': []
                }
            
            # 결과 후처리 (해상도 정보 포함)
            detections = self._parse_yolo_outputs(results, enhanced_image.shape)
            
            # 처리 시간 계산
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # DICOM 메타데이터 추출
            dicom_info = {}
            original_width = 0
            original_height = 0
            
            if dicom_dataset:
                try:
                    original_width = int(getattr(dicom_dataset, 'Columns', 0))
                    original_height = int(getattr(dicom_dataset, 'Rows', 0))
                    
                    dicom_info = {
                        'patient_id': str(getattr(dicom_dataset, 'PatientID', 'Unknown')),
                        'study_date': str(getattr(dicom_dataset, 'StudyDate', 'Unknown')),
                        'modality': str(getattr(dicom_dataset, 'Modality', 'UNKNOWN')),
                        'body_part': str(getattr(dicom_dataset, 'BodyPartExamined', 'Unknown')),
                        'image_size': {
                            'width': original_width,
                            'height': original_height
                        }
                    }
                except Exception as e:
                    logger.warning(f"DICOM 메타데이터 추출 실패: {str(e)}")
            
            # 🔥 결과에 해상도 정보 명시적으로 추가
            result = {
                'success': True,
                'detections': detections,
                # 🔥 최상위 레벨에 해상도 정보 추가 (Django에서 쉽게 접근 가능)
                'image_width': original_width if original_width > 0 else enhanced_image.shape[1],
                'image_height': original_height if original_height > 0 else enhanced_image.shape[0],
                'analysis_info': {
                    'model_type': 'YOLOv8',
                    'processing_time_seconds': processing_time,
                    'detection_count': len(detections),
                    'confidence_threshold': self.confidence_threshold,
                    'iou_threshold': self.iou_threshold
                },
                'dicom_info': dicom_info,
                'image_info': {
                    'original_shape': image.shape,
                    'processed_shape': enhanced_image.shape,
                    # 🔥 여기에도 해상도 정보 추가
                    'original_width': original_width,
                    'original_height': original_height,
                    'processed_width': enhanced_image.shape[1],
                    'processed_height': enhanced_image.shape[0]
                },
                'message': f"YOLOv8 분석 완료: {len(detections)}개 검출, 해상도: {original_width}x{original_height}"
            }
            
            logger.info(f"✅ YOLOv8 분석 완료: {len(detections)}개 검출, 처리시간: {processing_time:.2f}초, 해상도: {original_width}x{original_height}")
            return result
            
        except Exception as e:
            logger.error(f"❌ YOLOv8 분석 중 오류 발생: {str(e)}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e),
                'detections': []
            }
    
    
    def _extract_medical_features(self, detection, image_shape):
        """의료 영상 특화 특징 추출"""
        try:
            height, width = image_shape[:2]
            bbox = detection['bbox']
            
            center_x = (bbox['x'] + bbox['width'] / 2) / width
            center_y = (bbox['y'] + bbox['height'] / 2) / height
            
            area_ratio = detection['area'] / (width * height)
            
            aspect_ratio = bbox['width'] / bbox['height'] if bbox['height'] > 0 else 0
            
            anatomical_region = self._determine_anatomical_region(center_x, center_y)
            
            return {
                'relative_position': {
                    'center_x': center_x,
                    'center_y': center_y
                },
                'size_metrics': {
                    'area_ratio': area_ratio,
                    'aspect_ratio': aspect_ratio,
                    'is_large_finding': area_ratio > 0.1,  
                    'is_elongated': aspect_ratio > 2.0 or aspect_ratio < 0.5
                },
                'anatomical_info': {
                    'region': anatomical_region,
                    'is_central': 0.3 < center_x < 0.7 and 0.3 < center_y < 0.7,
                    'quadrant': self._get_quadrant(center_x, center_y)
                },
                'clinical_relevance': {
                    'attention_score': min(area_ratio * 10 + detection['confidence'], 1.0),
                    'priority_level': 'high' if area_ratio > 0.1 else 'medium' if area_ratio > 0.05 else 'low'
                }
            }
            
        except Exception as e:
            logger.warning(f"의료 특징 추출 실패: {str(e)}")
            logger.warning(traceback.format_exc())
            return {}
    
    def _determine_anatomical_region(self, center_x, center_y):
        """해부학적 위치 결정"""
        positions = []
        
        if center_x < 0.33:
            positions.append('left')
        elif center_x > 0.67:
            positions.append('right')
        else:
            positions.append('center')
        
        if center_y < 0.33:
            positions.append('upper')
        elif center_y > 0.67:
            positions.append('lower')
        else:
            positions.append('middle')
        
        return '_'.join(positions)
    
    def _get_quadrant(self, center_x, center_y):
        """사분면 결정"""
        if center_x < 0.5 and center_y < 0.5:
            return 'upper_left'
        elif center_x >= 0.5 and center_y < 0.5:
            return 'upper_right'
        elif center_x < 0.5 and center_y >= 0.5:
            return 'lower_left'
        else:
            return 'lower_right'

    
    def analyze(self, dicom_data_bytes): # 인풋을 dicom_path 대신 bytes로 받도록 변경
        """DICOM 이미지 분석 메인 함수"""
        try:
            start_time = datetime.now()
            
            if self.model is None:
                logger.error("YOLOv8 모델이 로드되지 않았습니다. 분석을 수행할 수 없습니다.")
                return {
                    'success': False,
                    'error': 'YOLOv8 모델이 로드되지 않았습니다.',
                    'detections': []
                }
            
            # DICOM 이미지 로드
            image, dicom_dataset = self._load_dicom_from_bytes(dicom_data_bytes) # 변경된 함수 호출
            if image is None:
                return {
                    'success': False,
                    'error': 'DICOM 이미지를 로드할 수 없습니다.',
                    'detections': []
                }
            
            # 의료 영상 향상
            enhanced_image = self._enhance_medical_image(image)
            
            # YOLO 추론 실행
            results = self._run_inference(enhanced_image)
            if results is None:
                return {
                    'success': False,
                    'error': '모델 추론에 실패했습니다.',
                    'detections': []
                }
            
            # 결과 후처리
            detections = self._parse_yolo_outputs(results, enhanced_image.shape)
            
            # 실제 검출이 없으면 더미 결과 생성 (더미 모델인 경우에만)
            if not detections:
                logger.info("실제 검출이 없어 ")
            elif not detections : # 실제 모델인데 검출이 없는 경우
                logger.info("실제 모델: 검출된 객체가 없어 빈 리스트를 반환합니다.")
                # 이 경우 굳이 더미 결과를 생성할 필요는 없을 수 있습니다.
                # 필요에 따라 정책 변경 가능
            
            # 처리 시간 계산
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # DICOM 메타데이터 추출
            dicom_info = {}
            if dicom_dataset:
                try:
                    dicom_info = {
                        'patient_id': str(getattr(dicom_dataset, 'PatientID', 'Unknown')),
                        'study_date': str(getattr(dicom_dataset, 'StudyDate', 'Unknown')),
                        'modality': str(getattr(dicom_dataset, 'Modality', 'UNKNOWN')), # Modality 키 확인
                        'body_part': str(getattr(dicom_dataset, 'BodyPartExamined', 'Unknown')),
                        'image_size': {
                            'width': int(getattr(dicom_dataset, 'Columns', 0)),
                            'height': int(getattr(dicom_dataset, 'Rows', 0))
                        }
                    }
                except Exception as e:
                    logger.warning(f"DICOM 메타데이터 추출 실패: {str(e)}")
                    logger.warning(traceback.format_exc())
            
            # 결과 구성
            # ai_service.py의 analyze_dicom_data에서 기대하는 최상위 키를 고려하여 구성
            result = {
                'success': True,
                'detections': detections, # ai_service가 기대하는 핵심 필드
                # 'analysis_info'와 'dicom_info', 'image_info'는 ai_service에서 'yolo_results' 하위로 들어감
                'analysis_info': { # ai_service의 'yolo_results' 내부에 들어갈 내용
                    'model_type': 'YOLOv8',

                    'processing_time_seconds': processing_time,
                    'detection_count': len(detections),
                    'confidence_threshold': self.confidence_threshold,
                    'iou_threshold': self.iou_threshold
                },
                'dicom_info': dicom_info,
                'image_info': {
                    'original_shape': image.shape,
                    'processed_shape': enhanced_image.shape
                },
                'message': f"YOLOv8 분석 완료: {len(detections)}개 검출." # ai_service의 'message' 필드에 사용될 수 있음
            }
            
            logger.info(f"✅ YOLOv8 분석 완료: {len(detections)}개 검출, 처리시간: {processing_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"❌ YOLOv8 분석 중 오류 발생: {str(e)}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e),
                'detections': []
            }

# 전역 분석기 인스턴스
_analyzer = None

def get_analyzer():
    """전역 분석기 인스턴스 반환"""
    global _analyzer
    if _analyzer is None:
        _analyzer = YOLOv8Analyzer()
    return _analyzer

def analyze(dicom_data): # ai_service에서 호출 시 dicom_data_bytes를 바로 전달받습니다.
    """외부에서 호출하는 분석 함수"""
    analyzer = get_analyzer()
    return analyzer.analyze(dicom_data) # dicom_data를 bytes로 전달