#!/usr/bin/env python3
"""
SSD 기반 DICOM 이미지 분석 모듈
"""

import os
import cv2
import numpy as np
import pydicom
import logging
from datetime import datetime

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logging.warning("tensorflow 패키지가 설치되어 있지 않습니다. pip install tensorflow")

logger = logging.getLogger('SSDInference')

class SSDAnalyzer:
    """SSD 모델을 사용한 DICOM 이미지 분석 클래스"""
    
    def __init__(self, model_path='/models/ssd/ssd_model'):
        self.model_path = model_path
        self.model = None
        self.confidence_threshold = 0.5
        self.input_size = (300, 300)  # SSD300 기본 입력 크기
        self.class_names = self._get_class_names()
        self._load_model()
    
    def _get_class_names(self):
        """클래스 이름 정의 (COCO 데이터셋 기반)"""
        return [
            'background', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
            'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant',
            'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
            'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe',
            'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
            'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat',
            'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
            'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
            'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
            'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
            'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
            'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
            'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock',
            'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
        ]
    
    def _load_model(self):
        """SSD 모델 로드"""
        try:
            if not TF_AVAILABLE:
                logger.error("TensorFlow 패키지를 사용할 수 없습니다.")
                return False
            
            if os.path.exists(self.model_path):
                # 커스텀 모델 로드
                self.model = tf.saved_model.load(self.model_path)
                logger.info(f"SSD 커스텀 모델 로드 완료: {self.model_path}")
                return True
            else:
                # TensorFlow Hub에서 사전 훈련된 SSD 모델 로드
                logger.warning(f"커스텀 모델을 찾을 수 없습니다: {self.model_path}")
                logger.info("사전 훈련된 SSD MobileNet 모델을 사용합니다.")
                
                try:
                    import tensorflow_hub as hub
                    model_url = "https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2"
                    self.model = hub.load(model_url)
                    logger.info("TensorFlow Hub에서 SSD 모델 로드 완료")
                    return True
                except ImportError:
                    logger.error("tensorflow_hub 패키지가 필요합니다. pip install tensorflow_hub")
                    return False
                
        except Exception as e:
            logger.error(f"SSD 모델 로드 실패: {str(e)}")
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
            
            # 그레이스케일을 RGB로 변환
            if len(pixel_array.shape) == 2:
                rgb_image = cv2.cvtColor(pixel_array, cv2.COLOR_GRAY2RGB)
            else:
                rgb_image = pixel_array
            
            return rgb_image, dicom_data
            
        except Exception as e:
            logger.error(f"DICOM 이미지 로드 실패: {str(e)}")
            return None, None
    
    def _preprocess_image(self, image):
        """SSD 입력을 위한 이미지 전처리"""
        try:
            # 원본 이미지 크기 저장
            original_height, original_width = image.shape[:2]
            
            # SSD 입력 크기로 리사이즈
            resized_image = cv2.resize(image, self.input_size)
            
            # 픽셀 값을 [0, 1] 범위로 정규화
            normalized_image = resized_image.astype(np.float32) / 255.0
            
            # 배치 차원 추가
            input_tensor = np.expand_dims(normalized_image, axis=0)
            
            return input_tensor, (original_width, original_height)
            
        except Exception as e:
            logger.error(f"이미지 전처리 실패: {str(e)}")
            return None, None
    
    def _enhance_medical_image(self, image):
        """의료 영상에 특화된 이미지 향상"""
        try:
            # 히스토그램 평활화
            enhanced_image = image.copy()
            
            if len(image.shape) == 3:
                # RGB 이미지인 경우
                # LAB 색공간으로 변환하여 밝기 채널에만 CLAHE 적용
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                lab[:,:,0] = clahe.apply(lab[:,:,0])
                enhanced_image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            else:
                # 그레이스케일 이미지인 경우
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                enhanced_image = clahe.apply(image)
            
            # 가우시안 블러를 이용한 노이즈 제거
            enhanced_image = cv2.GaussianBlur(enhanced_image, (3, 3), 0)
            
            # 샤프닝 필터 적용
            kernel = np.array([[-1,-1,-1],
                              [-1, 9,-1],
                              [-1,-1,-1]])
            enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
            
            return enhanced_image
            
        except Exception as e:
            logger.warning(f"이미지 향상 처리 실패: {str(e)}")
            return image
    
    def _run_inference(self, input_tensor):
        """SSD 모델 추론 실행"""
        try:
            if self.model is None:
                raise ValueError("모델이 로드되지 않았습니다.")
            
            # TensorFlow 텐서로 변환
            input_tensor = tf.convert_to_tensor(input_tensor)
            
            # 모델 추론 실행
            detections = self.model(input_tensor)
            
            return detections
            
        except Exception as e:
            logger.error(f"모델 추론 실패: {str(e)}")
            return None
    
    def _post_process_detections(self, detections, original_size):
        """검출 결과 후처리"""
        processed_detections = []
        
        try:
            original_width, original_height = original_size
            
            # TensorFlow 모델 출력 형태에 따라 처리
            if isinstance(detections, dict):
                # 딕셔너리 형태의 출력
                boxes = detections.get('detection_boxes', detections.get('boxes'))
                scores = detections.get('detection_scores', detections.get('scores'))
                classes = detections.get('detection_classes', detections.get('classes'))
            else:
                # 리스트나 텐서 형태의 출력
                boxes = detections[0] if len(detections) > 0 else []
                scores = detections[1] if len(detections) > 1 else []
                classes = detections[2] if len(detections) > 2 else []
            
            # NumPy 배열로 변환
            if hasattr(boxes, 'numpy'):
                boxes = boxes.numpy()
            if hasattr(scores, 'numpy'):
                scores = scores.numpy()
            if hasattr(classes, 'numpy'):
                classes = classes.numpy()
            
            # 첫 번째 배치만 처리 (배치 크기는 1)
            if len(boxes.shape) == 3:
                boxes = boxes[0]
                scores = scores[0]
                classes = classes[0]
            
            for i in range(len(scores)):
                score = float(scores[i])
                
                # 신뢰도 임계값 확인
                if score >= self.confidence_threshold:
                    # 바운딩 박스 좌표 (정규화된 값)
                    ymin, xmin, ymax, xmax = boxes[i]
                    
                    # 원본 이미지 크기로 스케일링
                    x1 = float(xmin * original_width)
                    y1 = float(ymin * original_height)
                    x2 = float(xmax * original_width)
                    y2 = float(ymax * original_height)
                    
                    # 클래스 ID와 이름
                    class_id = int(classes[i])
                    class_name = (self.class_names[class_id] 
                                if class_id < len(self.class_names) 
                                else f'class_{class_id}')
                    
                    detection = {
                        'bbox': {
                            'x1': x1,
                            'y1': y1,
                            'x2': x2,
                            'y2': y2,
                            'width': x2 - x1,
                            'height': y2 - y1
                        },
                        'confidence': score,
                        'class_id': class_id,
                        'class_name': class_name,
                        'area': (x2 - x1) * (y2 - y1)
                    }
                    
                    # 의료 영상 특화 정보 추가
                    detection['medical_info'] = self._extract_medical_features(
                        detection, (original_height, original_width)
                    )
                    
                    processed_detections.append(detection)
            
            return processed_detections
            
        except Exception as e:
            logger.error(f"검출 결과 후처리 실패: {str(e)}")
            return []
    
    def _extract_medical_features(self, detection, image_shape):
        """의료 영상 특화 특징 추출"""
        try:
            height, width = image_shape
            bbox = detection['bbox']
            
            # 중심점 계산
            center_x = (bbox['x1'] + bbox['x2']) / 2 / width
            center_y = (bbox['y1'] + bbox['y2']) / 2 / height
            
            # 크기 비율
            area_ratio = detection['area'] / (width * height)
            
            # 종횡비
            aspect_ratio = bbox['width'] / bbox['height'] if bbox['height'] > 0 else 0
            
            # 해부학적 위치
            anatomical_region = self._determine_anatomical_region(center_x, center_y)
            
            return {
                'relative_position': {
                    'center_x': center_x,
                    'center_y': center_y
                },
                'size_metrics': {
                    'area_ratio': area_ratio,
                    'aspect_ratio': aspect_ratio,
                    'is_large_finding': area_ratio > 0.05,
                    'is_elongated': aspect_ratio > 2.0 or aspect_ratio < 0.5
                },
                'anatomical_info': {
                    'region': anatomical_region,
                    'is_central': 0.25 < center_x < 0.75 and 0.25 < center_y < 0.75,
                    'quadrant': self._get_quadrant(center_x, center_y)
                },
                'clinical_relevance': {
                    'attention_score': min(area_ratio * 10 + detection['confidence'], 1.0),
                    'priority_level': 'high' if area_ratio > 0.1 else 'medium' if area_ratio > 0.05 else 'low'
                }
            }
            
        except Exception as e:
            logger.warning(f"의료 특징 추출 실패: {str(e)}")
            return {}
    
    def _determine_anatomical_region(self, center_x, center_y):
        """해부학적 영역 결정"""
        regions = []
        
        # 좌우 구분
        if center_x < 0.33:
            regions.append('left')
        elif center_x > 0.67:
            regions.append('right')
        else:
            regions.append('central')
        
        # 상하 구분
        if center_y < 0.25:
            regions.append('superior')
        elif center_y > 0.75:
            regions.append('inferior')
        elif center_y < 0.5:
            regions.append('upper')
        else:
            regions.append('lower')
        
        return '_'.join(regions)
    
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
    
    def analyze(self, dicom_path):
        """DICOM 이미지 분석 메인 함수"""
        try:
            start_time = datetime.now()
            
            if self.model is None:
                return {
                    'success': False,
                    'error': 'SSD 모델이 로드되지 않았습니다.',
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
            
            # 의료 영상 향상
            enhanced_image = self._enhance_medical_image(image)
            
            # 이미지 전처리
            input_tensor, original_size = self._preprocess_image(enhanced_image)
            if input_tensor is None:
                return {
                    'success': False,
                    'error': '이미지 전처리에 실패했습니다.',
                    'detections': []
                }
            
            # 모델 추론
            detections = self._run_inference(input_tensor)
            if detections is None:
                return {
                    'success': False,
                    'error': '모델 추론에 실패했습니다.',
                    'detections': []
                }
            
            # 결과 후처리
            processed_detections = self._post_process_detections(detections, original_size)
            
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
            
            # 결과 구성
            result = {
                'success': True,
                'detections': processed_detections,
                'analysis_info': {
                    'model_type': 'SSD',
                    'processing_time_seconds': processing_time,
                    'detection_count': len(processed_detections),
                    'confidence_threshold': self.confidence_threshold,
                    'input_size': self.input_size
                },
                'dicom_info': dicom_info,
                'image_info': {
                    'original_shape': image.shape,
                    'processed_shape': enhanced_image.shape
                }
            }
            
            logger.info(f"SSD 분석 완료: {len(processed_detections)}개 검출, 처리시간: {processing_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"SSD 분석 중 오류 발생: {str(e)}")
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
        _analyzer = SSDAnalyzer()
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
        print("사용법: python ssd_inference.py <dicom_file_path>")