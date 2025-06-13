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
        self.confidence_threshold = 0.25
        self.iou_threshold = 0.45
        self.class_names = self._get_class_names()
        self.is_dummy_model = False
        self._load_model()
    
    def _get_class_names(self):
        """의료 영상 클래스 이름 정의"""
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
                logger.error("YOLO 패키지를 사용할 수 없습니다.")
                self.model = self._create_dummy_yolo()
                self.is_dummy_model = True
                return False
            
            logger.info(f"🔍 YOLO 모델 로드 시도: {self.model_path}")
            
            if os.path.exists(self.model_path):
                try:
                    # 커스텀 모델 로드
                    self.model = YOLO(self.model_path)
                    logger.info(f"✅ YOLOv8 커스텀 모델 로드 완료: {self.model_path}")
                    
                    # 모델 정보 로깅
                    if hasattr(self.model, 'names'):
                        logger.info(f"YOLO 모델 클래스 수: {len(self.model.names)}")
                        logger.info(f"YOLO 클래스들: {list(self.model.names.values())}")
                    
                    return True
                    
                except Exception as e:
                    logger.error(f"❌ 커스텀 YOLO 모델 로드 실패: {e}")
                    logger.info("사전 훈련된 YOLOv8 모델로 폴백...")
                    
                    # 사전 훈련된 모델 사용
                    self.model = YOLO('yolov8n.pt')
                    logger.info("✅ 사전 훈련된 YOLOv8n 모델 로드 완료")
                    return True
                    
            else:
                logger.warning(f"커스텀 모델을 찾을 수 없습니다: {self.model_path}")
                logger.info("사전 훈련된 YOLOv8n 모델을 사용합니다.")
                
                # 사전 훈련된 모델 사용
                self.model = YOLO('yolov8n.pt')
                logger.info("✅ 사전 훈련된 YOLOv8n 모델 로드 완료")
                return True
                
        except Exception as e:
            logger.error(f"❌ YOLO 모델 로드 전체 실패: {e}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
            logger.info("더미 YOLO 모델 사용")
            
            self.model = self._create_dummy_yolo()
            self.is_dummy_model = True
            return False
    
    def _create_dummy_yolo(self):
        """더미 YOLO 모델"""
        class DummyYOLOModel:
            def __init__(self):
                self.names = {
                    0: 'Cardiomegaly',
                    1: 'Nodule/Mass', 
                    2: 'Pleural effusion',
                    3: 'Consolidation',
                    4: 'Atelectasis'
                }
                
            def __call__(self, image, conf=0.25, iou=0.45, verbose=False):
                # 더미 검출 결과 생성
                return [self._generate_dummy_result(image)]
            
            def _generate_dummy_result(self, image):
                # PIL Image나 numpy array에서 크기 추출
                if hasattr(image, 'size'):
                    width, height = image.size
                elif hasattr(image, 'shape'):
                    height, width = image.shape[:2]
                else:
                    width, height = 640, 640
                
                class DummyResult:
                    def __init__(self, width, height):
                        self.boxes = self._create_dummy_boxes(width, height)
                        
                    def _create_dummy_boxes(self, width, height):
                        num_detections = np.random.randint(2, 6)
                        
                        class DummyBoxes:
                            def __init__(self, num_det, w, h):
                                self.xyxy = []
                                self.conf = []
                                self.cls = []
                                
                                for _ in range(num_det):
                                    # 랜덤 바운딩 박스
                                    x1 = np.random.uniform(0.1, 0.6) * w
                                    y1 = np.random.uniform(0.1, 0.6) * h
                                    x2 = np.random.uniform(x1 + 0.1 * w, 0.9 * w)
                                    y2 = np.random.uniform(y1 + 0.1 * h, 0.9 * h)
                                    
                                    self.xyxy.append([[x1, y1, x2, y2]])
                                    self.conf.append([np.random.uniform(0.4, 0.9)])
                                    self.cls.append([np.random.randint(0, 5)])
                            
                            def __len__(self):
                                return len(self.xyxy)
                            
                            def __iter__(self):
                                for i in range(len(self.xyxy)):
                                    yield type('Box', (), {
                                        'xyxy': [type('Tensor', (), {'cpu': lambda: type('Array', (), {'numpy': lambda: np.array(self.xyxy[i])})()})()],
                                        'conf': [type('Tensor', (), {'cpu': lambda: type('Array', (), {'numpy': lambda: np.array(self.conf[i])})()})()],
                                        'cls': [type('Tensor', (), {'cpu': lambda: type('Array', (), {'numpy': lambda: np.array(self.cls[i])})()})()]
                                    })()
                        
                        return DummyBoxes(num_detections, width, height) if num_detections > 0 else None
                
                return DummyResult(width, height)
        
        return DummyYOLOModel()
    
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
    
    def _enhance_medical_image(self, image):
        """의료 영상에 특화된 이미지 향상"""
        try:
            enhanced_image = image.copy()
            
            # 대비 향상 (CLAHE 적용)
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                lab[:,:,0] = clahe.apply(lab[:,:,0])
                enhanced_image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            else:
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                enhanced_image = clahe.apply(image)
                enhanced_image = cv2.cvtColor(enhanced_image, cv2.COLOR_GRAY2RGB)
            
            # 노이즈 제거
            enhanced_image = cv2.bilateralFilter(enhanced_image, 9, 75, 75)
            
            # 샤프닝 필터 적용
            kernel = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]])
            enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
            
            return enhanced_image
            
        except Exception as e:
            logger.warning(f"이미지 향상 처리 실패: {str(e)}")
            return image
    
    def _run_inference(self, image):
        """YOLO 추론 실행"""
        try:
            if self.model is None:
                raise ValueError("모델이 로드되지 않았습니다.")
            
            logger.info(f"🎯 YOLO 추론 시작 - 이미지 크기: {image.shape}")
            
            # YOLO 추론 실행
            results = self.model(
                image,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                verbose=False
            )
            
            return results
            
        except Exception as e:
            logger.error(f"모델 추론 실패: {str(e)}")
            return None
    
    def _parse_yolo_outputs(self, results, image_shape):
        """YOLO 검출 결과 후처리"""
        detections = []
        
        try:
            for result in results:
                boxes = result.boxes
                if boxes is not None and len(boxes) > 0:
                    logger.info(f"YOLO에서 {len(boxes)}개 검출")
                    
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # 클래스명 결정
                        if hasattr(self.model, 'names') and class_id in self.model.names:
                            class_name = self.model.names[class_id]
                        else:
                            class_name = self.class_names.get(class_id, f'class_{class_id}')
                        
                        # 신뢰도 임계값 확인
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
                                'confidence': confidence,
                                'class_id': class_id,
                                'class_name': class_name,
                                'area': float((x2 - x1) * (y2 - y1))
                            }
                            
                            # 의료 영상 특화 정보 추가
                            detection['medical_info'] = self._extract_medical_features(detection, image_shape)
                            
                            detections.append(detection)
                            
                            logger.info(f"✅ YOLO 검출: {class_name} ({confidence:.3f}) [{x1:.1f},{y1:.1f},{x2:.1f},{y2:.1f}]")
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO 검출 결과 후처리 실패: {str(e)}")
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
            
            # 종횡비 계산
            aspect_ratio = bbox['width'] / bbox['height'] if bbox['height'] > 0 else 0
            
            # 위치 정보 (해부학적 관점)
            anatomical_region = self._determine_anatomical_region(center_x, center_y)
            
            return {
                'relative_position': {
                    'center_x': center_x,
                    'center_y': center_y
                },
                'size_metrics': {
                    'area_ratio': area_ratio,
                    'aspect_ratio': aspect_ratio,
                    'is_large_finding': area_ratio > 0.1,  # 전체 이미지의 10% 이상
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
            return {}
    
    def _determine_anatomical_region(self, center_x, center_y):
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
    
    def _generate_dummy_results(self, image_shape):
        """더미 검출 결과 생성"""
        height, width = image_shape[:2]
        
        dummy_detections = [
            {
                'bbox': {
                    'x1': float(width * 0.15),
                    'y1': float(height * 0.25),
                    'x2': float(width * 0.45),
                    'y2': float(height * 0.65),
                    'width': float(width * 0.3),
                    'height': float(height * 0.4)
                },
                'confidence': 0.82,
                'class_id': 3,
                'class_name': 'Cardiomegaly',
                'area': float(width * height * 0.12)
            },
            {
                'bbox': {
                    'x1': float(width * 0.55),
                    'y1': float(height * 0.35),
                    'x2': float(width * 0.80),
                    'y2': float(height * 0.60),
                    'width': float(width * 0.25),
                    'height': float(height * 0.25)
                },
                'confidence': 0.67,
                'class_id': 8,
                'class_name': 'Nodule/Mass',
                'area': float(width * height * 0.0625)
            }
        ]
        
        # 의료 특징 추가
        for detection in dummy_detections:
            detection['medical_info'] = self._extract_medical_features(detection, (height, width))
        
        return dummy_detections
    
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
            
            # 실제 검출이 없으면 더미 결과 생성
            if not detections and self.is_dummy_model:
                logger.info("더미 모델 결과 생성")
                detections = self._generate_dummy_results(enhanced_image.shape)
            
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
                    'is_dummy_model': self.is_dummy_model,
                    'processing_time_seconds': processing_time,
                    'detection_count': len(detections),
                    'confidence_threshold': self.confidence_threshold,
                    'iou_threshold': self.iou_threshold
                },
                'dicom_info': dicom_info,
                'image_info': {
                    'original_shape': image.shape,
                    'processed_shape': enhanced_image.shape
                }
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