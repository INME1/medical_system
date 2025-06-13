#!/usr/bin/env python3
"""
SSD300 기반 DICOM 이미지 분석 모듈 (PyTorch 버전) - 의료 영상 특화
"""

import os
import cv2
import numpy as np
import pydicom
import logging
import traceback
from datetime import datetime

try:
    import torch
    import torch.nn as nn
    import torchvision
    import torchvision.transforms as transforms
    from torchvision.models.detection import ssd300_vgg16
    from torchvision.models.detection.ssd import SSDClassificationHead
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logging.warning("torch/torchvision 패키지가 설치되어 있지 않습니다. pip install torch torchvision")

logger = logging.getLogger('SSDInference')

class SSDAnalyzer:
    """SSD300 모델을 사용한 DICOM 이미지 분석 클래스"""
    
    def __init__(self, model_path='/models/ssd/ssd.pth'):
        self.model_path = model_path
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.confidence_threshold = 0.3
        self.input_size = 300  # SSD300 입력 크기
        self.num_classes = 15  # 14개 클래스 + 배경
        self.class_names = self._get_class_names()
        self.is_dummy_model = False
        self._load_model()
    
    def _get_class_names(self):
        """의료 영상 클래스 이름 정의 (14개 클래스 + 배경)"""
        return {
            0: 'background',
            1: 'Aortic enlargement',
            2: 'Atelectasis', 
            3: 'Calcification',
            4: 'Cardiomegaly',
            5: 'Consolidation',
            6: 'ILD',
            7: 'Infiltration',
            8: 'Lung Opacity',
            9: 'Nodule/Mass',
            10: 'Other lesion',
            11: 'Pleural effusion',
            12: 'Pleural thickening',
            13: 'Pulmonary fibrosis',
            14: 'Normal'
        }
    
    def _load_model(self):
        """SSD300 모델 로드 - 실제 모델 우선, 없으면 더미 모델"""
        try:
            if not TORCH_AVAILABLE:
                logger.error("PyTorch/torchvision 패키지를 사용할 수 없습니다.")
                self.model = self._create_dummy_ssd()
                self.is_dummy_model = True
                return False
            
            logger.info(f"🔍 SSD 모델 로드 시도: {self.model_path}, 디바이스: {self.device}")
            
            if os.path.exists(self.model_path):
                try:
                    # SSD300 모델 구조 생성
                    logger.info("🏗️ SSD300 모델 구조 생성 중...")
                    
                    # 기본 SSD300 모델 생성 (사전훈련된 가중치 사용)
                    self.model = ssd300_vgg16(weights="DEFAULT")
                    
                    # 기존 정보 얻기
                    in_channels = [512, 1024, 512, 256, 256, 256]
                    num_anchors = self.model.anchor_generator.num_anchors_per_location()
                    
                    # classification head 재정의 (커스텀 클래스 수에 맞게)
                    self.model.head.classification_head = SSDClassificationHead(
                        in_channels, num_anchors, self.num_classes
                    )
                    
                    logger.info(f"✅ SSD300 모델 구조 생성 완료 ({self.num_classes}개 클래스)")
                    
                    # 체크포인트 로드
                    checkpoint = torch.load(str(self.model_path), map_location=self.device)
                    logger.info(f"✅ SSD 체크포인트 로드 성공, 타입: {type(checkpoint)}")
                    
                    # state_dict 로드
                    if isinstance(checkpoint, dict) and not hasattr(checkpoint, 'eval'):
                        logger.info("📋 state_dict 로드 중...")
                        self.model.load_state_dict(checkpoint)
                    else:
                        logger.warning("❌ 예상치 못한 체크포인트 형태")
                        self.model = self._create_dummy_ssd()
                        self.is_dummy_model = True
                        return False
                    
                    # 모델 설정
                    self.model = self.model.to(self.device)
                    self.model.eval()
                    
                    logger.info("✅ SSD300 커스텀 모델 로드 완료!")
                    
                    # 모델 테스트
                    test_input = torch.randn(1, 3, 300, 300).to(self.device)
                    with torch.no_grad():
                        test_output = self.model(test_input)
                    
                    logger.info(f"✅ SSD300 모델 테스트 성공!")
                    return True
                    
                except Exception as e:
                    logger.error(f"❌ 커스텀 SSD300 모델 로드 실패: {e}")
                    logger.info("사전 훈련된 SSD300 모델로 폴백...")
                    
                    # 사전 훈련된 모델 사용
                    self.model = ssd300_vgg16(weights="DEFAULT")
                    self.model = self.model.to(self.device)
                    self.model.eval()
                    
                    logger.info("✅ 사전 훈련된 SSD300 모델 로드 완료")
                    return True
                    
            else:
                logger.warning(f"커스텀 모델을 찾을 수 없습니다: {self.model_path}")
                logger.info("사전 훈련된 SSD300 모델을 사용합니다.")
                
                # 사전 훈련된 모델 사용
                self.model = ssd300_vgg16(weights="DEFAULT")
                self.model = self.model.to(self.device)
                self.model.eval()
                
                logger.info("✅ 사전 훈련된 SSD300 모델 로드 완료")
                return True
                
        except Exception as e:
            logger.error(f"❌ SSD 모델 로드 전체 실패: {e}")
            logger.error(f"❌ 상세 에러: {traceback.format_exc()}")
            logger.info("더미 SSD 모델 사용")
            
            self.model = self._create_dummy_ssd()
            self.is_dummy_model = True
            return False
    
    def _create_dummy_ssd(self):
        """향상된 더미 SSD 모델"""
        class DummySSDModel:
            def __init__(self):
                self.device = torch.device('cpu')
                
            def eval(self):
                return self
                
            def to(self, device):
                self.device = device
                return self
                
            def __call__(self, input_tensor):
                # torchvision SSD 출력 형태 시뮬레이션
                batch_size = input_tensor.size(0)
                
                # 더미 검출 결과 생성
                num_detections = np.random.randint(2, 6)  # 2-5개 검출
                
                boxes = []
                scores = []
                labels = []
                
                for _ in range(num_detections):
                    # 랜덤 바운딩 박스 (정규화된 좌표)
                    x1 = np.random.uniform(0.1, 0.6)
                    y1 = np.random.uniform(0.1, 0.6)
                    x2 = np.random.uniform(x1 + 0.1, 0.9)
                    y2 = np.random.uniform(y1 + 0.1, 0.9)
                    
                    # 300x300 픽셀 좌표로 변환
                    boxes.append([x1 * 300, y1 * 300, x2 * 300, y2 * 300])
                    scores.append(np.random.uniform(0.4, 0.9))
                    labels.append(np.random.randint(1, 14))  # 1-13 클래스
                
                result = [{
                    'boxes': torch.tensor(boxes, dtype=torch.float32),
                    'scores': torch.tensor(scores, dtype=torch.float32),
                    'labels': torch.tensor(labels, dtype=torch.long)
                }]
                
                return result
        
        return DummySSDModel()
    
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
    
    def _enhance_medical_image(self, image):
        """의료 영상에 특화된 이미지 향상"""
        try:
            enhanced_image = image.copy()
            
            if len(image.shape) == 3:
                # RGB 이미지인 경우 - LAB 색공간에서 CLAHE 적용
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
            kernel = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]])
            enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
            
            return enhanced_image
            
        except Exception as e:
            logger.warning(f"이미지 향상 처리 실패: {str(e)}")
            return image
    
    def _preprocess_image(self, image):
        """SSD300 입력을 위한 이미지 전처리"""
        try:
            # 원본 이미지 크기 저장
            original_height, original_width = image.shape[:2]
            
            # OpenCV BGR을 RGB로 변환 (필요한 경우)
            if len(image.shape) == 3 and image.shape[2] == 3:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = image
            
            # torchvision 변환
            transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.Resize((self.input_size, self.input_size)),
                transforms.ToTensor(),
            ])
            
            input_tensor = transform(image_rgb).unsqueeze(0).to(self.device)
            
            return input_tensor, (original_width, original_height)
            
        except Exception as e:
            logger.error(f"이미지 전처리 실패: {str(e)}")
            return None, None
    
    def _run_inference(self, input_tensor):
        """SSD300 모델 추론 실행"""
        try:
            if self.model is None:
                raise ValueError("모델이 로드되지 않았습니다.")
            
            logger.info(f"🎯 SSD 추론 시작 - 입력 크기: {input_tensor.shape}")
            
            # 추론 실행
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(input_tensor)
            
            logger.info(f"SSD 모델 출력 타입: {type(predictions)}")
            
            if isinstance(predictions, list) and len(predictions) > 0:
                pred = predictions[0]
                if isinstance(pred, dict):
                    for key, value in pred.items():
                        if hasattr(value, 'shape'):
                            logger.info(f"  {key}: {value.shape}")
            
            return predictions
            
        except Exception as e:
            logger.error(f"모델 추론 실패: {str(e)}")
            return None
    
    def _parse_ssd_outputs(self, predictions, original_size):
        """SSD300 출력 파싱"""
        try:
            detections = []
            original_width, original_height = original_size
            
            if not predictions or len(predictions) == 0:
                return detections
                
            pred = predictions[0]  # 첫 번째 이미지
            
            if not isinstance(pred, dict):
                logger.warning(f"예상치 못한 예측 형태: {type(pred)}")
                return detections
                
            # torchvision SSD 출력: {'boxes': tensor, 'labels': tensor, 'scores': tensor}
            boxes = pred.get('boxes', torch.empty((0, 4)))
            labels = pred.get('labels', torch.empty((0,)))
            scores = pred.get('scores', torch.empty((0,)))
            
            logger.info(f"📊 SSD 출력: boxes={boxes.shape}, labels={labels.shape}, scores={scores.shape}")
            
            if len(boxes) == 0:
                logger.info("검출된 객체 없음")
                return detections
                
            # 신뢰도 임계값 적용
            valid_indices = scores > self.confidence_threshold
            valid_boxes = boxes[valid_indices]
            valid_labels = labels[valid_indices]
            valid_scores = scores[valid_indices]
            
            logger.info(f"🔍 임계값 {self.confidence_threshold} 이상: {len(valid_boxes)}개")
            
            # 스케일링 비율 (SSD input -> 원본)
            scale_x = original_width / self.input_size
            scale_y = original_height / self.input_size
            
            for i in range(len(valid_boxes)):
                box = valid_boxes[i].cpu().numpy()
                label = int(valid_labels[i].cpu().numpy())
                score = float(valid_scores[i].cpu().numpy())
                
                # 좌표 스케일링 (SSD input -> 원본)
                x1, y1, x2, y2 = box
                
                # 원본 해상도로 변환
                orig_x1 = int(x1 * scale_x)
                orig_y1 = int(y1 * scale_y)
                orig_x2 = int(x2 * scale_x)
                orig_y2 = int(y2 * scale_y)
                
                # 경계값 체크
                orig_x1 = max(0, min(orig_x1, original_width))
                orig_y1 = max(0, min(orig_y1, original_height))
                orig_x2 = max(0, min(orig_x2, original_width))
                orig_y2 = max(0, min(orig_y2, original_height))
                
                # 유효한 박스인지 확인
                if orig_x2 > orig_x1 + 5 and orig_y2 > orig_y1 + 5:
                    class_name = self.class_names.get(label, f'class_{label}')
                    
                    detection = {
                        'bbox': {
                            'x1': float(orig_x1),
                            'y1': float(orig_y1),
                            'x2': float(orig_x2),
                            'y2': float(orig_y2),
                            'width': float(orig_x2 - orig_x1),
                            'height': float(orig_y2 - orig_y1)
                        },
                        'confidence': score,
                        'class_id': label,
                        'class_name': class_name,
                        'area': float((orig_x2 - orig_x1) * (orig_y2 - orig_y1))
                    }
                    
                    # 의료 영상 특화 정보 추가
                    detection['medical_info'] = self._extract_medical_features(
                        detection, (original_height, original_width)
                    )
                    
                    detections.append(detection)
                    
                    logger.info(f"✅ SSD 검출: {class_name} ({score:.3f}) [{orig_x1},{orig_y1},{orig_x2},{orig_y2}]")
            
            return detections[:10]  # 최대 10개로 제한
            
        except Exception as e:
            logger.error(f"SSD 출력 파싱 실패: {e}")
            logger.error(f"상세 에러: {traceback.format_exc()}")
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
        
        if center_x < 0.33:
            regions.append('left')
        elif center_x > 0.67:
            regions.append('right')
        else:
            regions.append('central')
        
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
    
    def _generate_dummy_results(self, image_shape):
        """더미 검출 결과 생성"""
        height, width = image_shape[:2]
        
        dummy_detections = [
            {
                'bbox': {
                    'x1': float(width * 0.2),
                    'y1': float(height * 0.3),
                    'x2': float(width * 0.4),
                    'y2': float(height * 0.5),
                    'width': float(width * 0.2),
                    'height': float(height * 0.2)
                },
                'confidence': 0.74,
                'class_id': 4,
                'class_name': 'Cardiomegaly',
                'area': float(width * height * 0.04)
            },
            {
                'bbox': {
                    'x1': float(width * 0.6),
                    'y1': float(height * 0.4),
                    'x2': float(width * 0.85),
                    'y2': float(height * 0.7),
                    'width': float(width * 0.25),
                    'height': float(height * 0.3)
                },
                'confidence': 0.63,
                'class_id': 9,
                'class_name': 'Nodule/Mass',
                'area': float(width * height * 0.075)
            }
        ]
        
        # 의료 특징 추가
        for detection in dummy_detections:
            detection['medical_info'] = self._extract_medical_features(
                detection, (height, width)
            )
        
        return dummy_detections
    
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
            predictions = self._run_inference(input_tensor)
            if predictions is None:
                return {
                    'success': False,
                    'error': '모델 추론에 실패했습니다.',
                    'detections': []
                }
            
            # 결과 파싱
            detections = self._parse_ssd_outputs(predictions, original_size)
            
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
            
            # 결과 구성
            result = {
                'success': True,
                'detections': detections,
                'analysis_info': {
                    'model_type': 'SSD300_PyTorch',
                    'device': str(self.device),
                    'is_dummy_model': self.is_dummy_model,
                    'processing_time_seconds': processing_time,
                    'detection_count': len(detections),
                    'confidence_threshold': self.confidence_threshold,
                    'input_size': self.input_size
                },
                'dicom_info': dicom_info,
                'image_info': {
                    'original_shape': image.shape,
                    'processed_shape': enhanced_image.shape
                }
            }
            
            logger.info(f"✅ SSD 분석 완료: {len(detections)}개 검출, 처리시간: {processing_time:.2f}초")
            return result
            
        except Exception as e:
            logger.error(f"❌ SSD 분석 중 오류 발생: {str(e)}")
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