#!/usr/bin/env python3
"""
YOLOv8 기반 DICOM 이미지 분석 모듈
"""

import os
import cv2
import numpy as np
import pydicom
import logging
from datetime import datetime

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logging.warning("ultralytics 패키지가 설치되어 있지 않습니다. pip install ultralytics")

logger = logging.getLogger('YOLOInference')

class YOLOv8Analyzer:
    """YOLOv8 모델을 사용한 DICOM 이미지 분석 클래스"""
    
    def __init__(self, model_path='/models/yolov8/yolov8_best.pt'):
        self.model_path = model_path
        self.model = None
        self.confidence_threshold = 0.5
        self.iou_threshold = 0.45
        self._load_model()
    
    def _load_model(self):
        """YOLOv8 모델 로드"""
        try:
            if not YOLO_AVAILABLE:
                logger.error("YOLO 패키지를 사용할 수 없습니다.")
                return False
            
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                logger.info(f"YOLOv8 모델 로드 완료: {self.model_path}")
                return True
            else:
                # 모델 파일이 없으면 사전 훈련된 모델 사용
                logger.warning(f"커스텀 모델을 찾을 수 없습니다: {self.model_path}")
                logger.info("사전 훈련된 YOLOv8n 모델을 사용합니다.")
                self.model = YOLO('yolov8n.pt')
                return True
                
        except Exception as e:
            logger.error(f"YOLOv8 모델 로드 실패: {str(e)}")
            return False
    
    def _load_dicom_image(self, dicom_path):
        """DICOM 파일에서 이미지 데이터 추출"""
        try:
            # DICOM 파일 읽기
            dicom_data = pydicom.dcmread(dicom_path)
            
            # 픽셀 데이터 추출
            pixel_array = dicom_data.pixel_array
            
            # 필요한 경우 윈도우 레벨링 적용
            if hasattr(dicom_data, 'WindowCenter') and hasattr(dicom_data, 'WindowWidth'):
                window_center = float(dicom_data.WindowCenter)
                window_width = float(dicom_data.WindowWidth)
                
                # 윈도우 레벨링 적용
                img_min = window_center - window_width // 2
                img_max = window_center + window_width // 2
                pixel_array = np.clip(pixel_array, img_min, img_max)
            
            # 8비트로 정규화
            if pixel_array.dtype != np.uint8:
                pixel_array = ((pixel_array - pixel_array.min()) / 
                              (pixel_array.max() - pixel_array.min()) * 255).astype(np.uint8)
            
            # 그레이스케일을 RGB로 변환 (YOLO는 3채널 입력 필요)
            if len(pixel_array.shape) == 2:
                rgb_image = cv2.cvtColor(pixel_array, cv2.COLOR_GRAY2RGB)
            else:
                rgb_image = pixel_array
            
            return rgb_image, dicom_data
            
        except Exception as e:
            logger.error(f"DICOM 이미지 로드 실패: {str(e)}")
            return None, None
    
    def _preprocess_for_medical(self, image):
        """의료 영상에 특화된 전처리"""
        try:
            # 대비 향상 (CLAHE 적용)
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                lab[:,:,0] = clahe.apply(lab[:,:,0])
                image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            else:
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                image = clahe.apply(image)
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            
            # 노이즈 제거
            image = cv2.bilateralFilter(image, 9, 75, 75)
            
            return image
            
        except Exception as e:
            logger.warning(f"전처리 중 오류 발생: {str(e)}")
            return image
    
    def _post_process_detections(self, results, image_shape):
        """검출 결과 후처리"""
        detections = []
        
        try:
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for i, box in enumerate(boxes):
                        # 바운딩 박스 좌표
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # 신뢰도 임계값 필터링
                        if confidence >= self.confidence_threshold:
                            detection = {
                                'bbox': {
                                    'x1': float(x1),
                                    'y1': float(y1),
                                    'x2': float(x2),
                                    'y2': float(y2),
                                    'width': float(x2 - x1),
                                    'height': float(y2 - y1)
                                },
                                'confidence': float(confidence),
                                'class_id': class_id,
                                'class_name': result.names[class_id] if hasattr(result, 'names') else f'class_{class_id}',
                                'area': float((x2 - x1) * (y2 - y1))
                            }
                            
                            # 의료 영상 특화 정보 추가
                            detection['medical_info'] = self._extract_medical_features(detection, image_shape)
                            
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"검출 결과 후처리 실패: {str(e)}")
            return []
    
    def _extract_medical_features(self, detection, image_shape):
        """의료 영상 특화 특징 추출"""
        try:
            height, width = image_shape[:2]
            bbox = detection['bbox']
            
            # 상대적 위치 계산
            center_x = (bbox['x1'] + bbox['x2']) / 2 / width
            center_y = (bbox['y1'] + bbox['y2']) / 2 / height
            
            # 크기 비율 계산
            area_ratio = detection['area'] / (width * height)
            
            # 위치 정보 (해부학적 관점)
            position = self._determine_anatomical_position(center_x, center_y)
            
            return {
                'relative_position': {
                    'center_x': center_x,
                    'center_y': center_y
                },
                'size_ratio': area_ratio,
                'anatomical_position': position,
                'is_large_finding': area_ratio > 0.1,  # 전체 이미지의 10% 이상
                'is_central': 0.3 < center_x < 0.7 and 0.3 < center_y < 0.7
            }
            
        except Exception as e:
            logger.warning(f"의료 특징 추출 실패: {str(e)}")
            return {}
    
    def _determine_anatomical_position(self, center_x, center_y):
        """해부학적 위치 결정"""
        positions = []
        
        # 좌우 구분
        if center_x < 0.33:
            positions.append('left')
        elif center_x > 0.67:
            positions.append('right')
        else:
            positions.append('center')
        
        # 상하 구분
        if center_y < 0.33:
            positions.append('upper')
        elif center_y > 0.67:
            positions.append('lower')
        else:
            positions.append('middle')
        
        return '_'.join(positions)
    
    def analyze(self, dicom_path):
        """DICOM 이미지 분석 메인 함수"""
        try:
            start_time = datetime.now()
            
            if self.model is None:
                return {
                    'success': False,
                    'error': 'YOLOv8 모델이 로드되지 않았습니다.',
                    'detections': []
                }
            
            # DICOM 이미지 로드
            image, dicom_data = self._load_dicom_image(dicom_path)
            if image is None:
                return {
                    'success': False,
                    'error': 'DICOM 이미지를 로드할 수 없습니다.',
                    'detections': []
                }
            
            # 전처리
            processed_image = self._preprocess_for_medical(image)
            
            # YOLO 추론 실행
            results = self.model(
                processed_image,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                verbose=False
            )
            
            # 결과 후처리
            detections = self._post_process_detections(results, image.shape)
            
            # 처리 시간 계산
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # DICOM 메타데이터 추출
            dicom_info = {}
            if dicom_data:
                try:
                    dicom_info = {
                        'patient_id': str(getattr(dicom_data, 'PatientID', 'Unknown')),
                        'study_date': str(getattr(dicom_data, 'StudyDate', 'Unknown')),
                        'modality': str(getattr(dicom_data, 'Modality', 'Unknown')),
                        'body_part': str(getattr(dicom_data, 'BodyPartExamined', 'Unknown')),
                        'image_size': {
                            'width': int(getattr(dicom_data, 'Columns', 0)),
                            'height': int(getattr(dicom_data, 'Rows', 0))
                        }
                    }
                except Exception as e:
                    logger.warning(f"DICOM 메타데이터 추출 실패: {str(e)}")
            
            result = {
                'success': True,
                'detections': detections,
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
                    'processed_shape': processed_image.shape
                }
            }
            
            logger.info(f"YOLOv8 분석 완료: {len(detections)}개 검출, 처리시간: {processing_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"YOLOv8 분석 중 오류 발생: {str(e)}")
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

def analyze(dicom_path):
    """외부에서 호출하는 분석 함수"""
    analyzer = get_analyzer()
    return analyzer.analyze(dicom_path)

if __name__ == "__main__":
    # 테스트용 코드
    import sys
    if len(sys.argv) > 1:
        result = analyze(sys.argv[1])
        print(f"분석 결과: {result}")
    else:
        print("사용법: python yolov8_inference.py <dicom_file_path>")