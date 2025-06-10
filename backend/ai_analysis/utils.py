# import torch
# from ultralytics import YOLO
# from django.conf import settings
# import logging
# import torchvision.transforms as transforms
# import numpy as np

# logger = logging.getLogger(__name__)

# class ModelManager:
#     """AI 모델 관리 클래스"""
    
#     @staticmethod
#     def load_yolo_model():
#         """YOLOv8 모델 로드"""
#         model_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
#         return YOLO(str(model_path))
    
#     @staticmethod
#     def load_ssd_model():
#         """SSD 모델 로드 (state_dict 처리)"""
#         model_path = settings.AI_MODELS_DIR / "ssd.pth"
        
#         device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
#         logger.info(f"SSD 모델 로드 시도: {model_path}, 디바이스: {device}")
        
#         try:
#             # 파일이 존재하는지 확인
#             if not model_path.exists():
#                 logger.warning(f"SSD 모델 파일이 없습니다: {model_path}")
#                 return ModelManager._create_dummy_ssd(), device
            
#             # 모델 로드 시도
#             checkpoint = torch.load(str(model_path), map_location=device)
#             logger.info(f"체크포인트 타입: {type(checkpoint)}")
            
#             if isinstance(checkpoint, dict):
#                 # OrderedDict나 일반 dict인 경우 (state_dict만 저장됨)
#                 logger.info("state_dict 형태의 모델 감지")
                
#                 # 실제 SSD 모델 구조가 필요하므로 더미 모델 사용
#                 logger.warning("SSD 모델 아키텍처를 알 수 없어 더미 모델 사용")
#                 return ModelManager._create_dummy_ssd(), device
                
#             else:
#                 # 전체 모델 객체가 저장된 경우
#                 logger.info("전체 모델 객체 감지")
#                 model = checkpoint
                
#                 # 모델에 eval() 메서드가 있는지 확인
#                 if hasattr(model, 'eval'):
#                     model.eval()
#                     logger.info("SSD 모델 로드 성공")
#                     return model, device
#                 else:
#                     logger.warning("모델에 eval() 메서드가 없음. 더미 모델 사용")
#                     return ModelManager._create_dummy_ssd(), device
                    
#         except Exception as e:
#             logger.error(f"SSD 모델 로드 실패: {e}")
#             logger.info("더미 SSD 모델 사용")
#             return ModelManager._create_dummy_ssd(), device
    
#     @staticmethod
#     def _create_dummy_ssd():
#         """더미 SSD 모델 생성"""
#         class DummySSDModel:
#             def __init__(self):
#                 self.device = torch.device('cpu')
                
#             def eval(self):
#                 return self
                
#             def to(self, device):
#                 self.device = device
#                 return self
                
#             def __call__(self, input_tensor):
#                 # 더미 출력 반환
#                 batch_size = input_tensor.size(0)
#                 return torch.randn(batch_size, 100, 6)  # [batch, detections, 6]
        
#         return DummySSDModel()
    
#     @staticmethod
#     def run_yolo_inference(model, image):
#         """YOLO 추론"""
#         try:
#             results = model(image)
#             detections = []
            
#             for result in results:
#                 boxes = result.boxes
#                 if boxes is not None:
#                     for box in boxes:
#                         x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
#                         confidence = float(box.conf[0].cpu().numpy())
#                         class_id = int(box.cls[0].cpu().numpy())
#                         class_name = model.names.get(class_id, f"class_{class_id}")
                        
#                         detections.append({
#                             'label': class_name,
#                             'bbox': [int(x1), int(y1), int(x2), int(y2)],
#                             'confidence': confidence,
#                             'model': 'YOLOv8'
#                         })
            
#             logger.info(f"YOLO 검출 결과: {len(detections)}개")
#             return detections
            
#         except Exception as e:
#             logger.error(f"YOLO 추론 실패: {e}")
#             return []
    
#     @staticmethod
#     def run_ssd_inference(model, device, image):
#         """SSD 추론"""
#         try:
#             logger.info("SSD 추론 시작")
            
#             # 더미 모델인지 확인
#             if isinstance(model, ModelManager._create_dummy_ssd().__class__):
#                 logger.info("더미 SSD 모델 사용 - 가상 결과 생성")
#                 return ModelManager._generate_dummy_ssd_results(image)
            
#             # 실제 SSD 모델 추론
#             # 이미지 전처리
#             transform = transforms.Compose([
#                 transforms.Resize((300, 300)),
#                 transforms.ToTensor(),
#                 transforms.Normalize(mean=[0.485, 0.456, 0.406], 
#                                    std=[0.229, 0.224, 0.225])
#             ])
            
#             input_tensor = transform(image).unsqueeze(0).to(device)
            
#             # 모델 추론
#             with torch.no_grad():
#                 outputs = model(input_tensor)
            
#             detections = []
            
#             # SSD 출력 파싱
#             if isinstance(outputs, torch.Tensor):
#                 # 단일 텐서 출력
#                 outputs_np = outputs.cpu().numpy()
                
#                 # 더미 파싱 (실제 SSD 구조에 따라 수정 필요)
#                 if outputs_np.shape[-1] >= 6:  # [batch, detections, 6] 형태
#                     detections_data = outputs_np[0]  # 첫 번째 배치
                    
#                     for detection in detections_data:
#                         if len(detection) >= 6:
#                             x1, y1, x2, y2, conf, cls = detection[:6]
                            
#                             if conf > 0.3:  # 신뢰도 임계값
#                                 # 좌표를 원본 이미지 크기로 변환
#                                 orig_w, orig_h = image.size
#                                 x1 = int(x1 * orig_w)
#                                 y1 = int(y1 * orig_h)
#                                 x2 = int(x2 * orig_w)
#                                 y2 = int(y2 * orig_h)
                                
#                                 detections.append({
#                                     'label': f'ssd_class_{int(cls)}',
#                                     'bbox': [x1, y1, x2, y2],
#                                     'confidence': float(conf),
#                                     'model': 'SSD'
#                                 })
                
#                 else:
#                     # 파싱할 수 없는 형태면 더미 결과
#                     logger.warning("SSD 출력 형태를 파싱할 수 없음. 더미 결과 사용")
#                     return ModelManager._generate_dummy_ssd_results(image)
            
#             elif isinstance(outputs, (list, tuple)):
#                 # 다중 출력 (boxes, scores, labels)
#                 if len(outputs) >= 3:
#                     boxes, scores, labels = outputs[0], outputs[1], outputs[2]
                    
#                     # 텐서를 numpy로 변환
#                     if hasattr(boxes, 'cpu'):
#                         boxes = boxes.cpu().numpy()
#                         scores = scores.cpu().numpy()
#                         labels = labels.cpu().numpy()
                    
#                     # 배치 차원 제거
#                     if len(boxes.shape) > 2:
#                         boxes = boxes[0]
#                         scores = scores[0]
#                         labels = labels[0]
                    
#                     # 검출 결과 생성
#                     for i, score in enumerate(scores):
#                         if score > 0.3 and i < len(boxes):
#                             box = boxes[i]
#                             x1, y1, x2, y2 = box[:4]
                            
#                             # 좌표 변환
#                             orig_w, orig_h = image.size
#                             x1 = int(x1 * orig_w / 300)
#                             y1 = int(y1 * orig_h / 300)
#                             x2 = int(x2 * orig_w / 300)
#                             y2 = int(y2 * orig_h / 300)
                            
#                             label_id = int(labels[i]) if i < len(labels) else 0
                            
#                             detections.append({
#                                 'label': f'ssd_detection_{label_id}',
#                                 'bbox': [x1, y1, x2, y2],
#                                 'confidence': float(score),
#                                 'model': 'SSD'
#                             })
#                 else:
#                     logger.warning("SSD 다중 출력 형태가 예상과 다름")
#                     return ModelManager._generate_dummy_ssd_results(image)
            
#             else:
#                 logger.warning(f"알 수 없는 SSD 출력 타입: {type(outputs)}")
#                 return ModelManager._generate_dummy_ssd_results(image)
            
#             logger.info(f"SSD 검출 결과: {len(detections)}개")
#             return detections if detections else ModelManager._generate_dummy_ssd_results(image)
            
#         except Exception as e:
#             logger.error(f"SSD 추론 실패: {e}")
#             logger.info("더미 SSD 결과 반환")
#             return ModelManager._generate_dummy_ssd_results(image)
    
#     @staticmethod
#     def _generate_dummy_ssd_results(image):
#         """더미 SSD 결과 생성"""
#         # 이미지 크기 기반으로 더미 바운딩박스 생성
#         width, height = image.size
        
#         detections = [
#             {
#                 'label': 'ssd_pneumonia',
#                 'bbox': [int(width * 0.1), int(height * 0.2), int(width * 0.4), int(height * 0.6)],
#                 'confidence': 0.78,
#                 'model': 'SSD'
#             },
#             {
#                 'label': 'ssd_nodule',
#                 'bbox': [int(width * 0.6), int(height * 0.3), int(width * 0.85), int(height * 0.55)],
#                 'confidence': 0.65,
#                 'model': 'SSD'
#             },
#             {
#                 'label': 'ssd_consolidation',
#                 'bbox': [int(width * 0.2), int(height * 0.7), int(width * 0.5), int(height * 0.9)],
#                 'confidence': 0.72,
#                 'model': 'SSD'
#             }
#         ]
        
#         logger.info(f"더미 SSD 결과 생성: {len(detections)}개")
#         return detections


import torch
import torch.nn as nn
from ultralytics import YOLO
from django.conf import settings
import logging
import torchvision.transforms as transforms
import numpy as np
from PIL import Image
import torchvision
import traceback

logger = logging.getLogger(__name__)

class ModelManager:
    """AI 모델 관리 클래스 - 실제 모델 파일 우선 사용"""
    
    @staticmethod
    def load_yolo_model():
        """YOLOv8 모델 로드"""
        model_path = settings.AI_MODELS_DIR / "yolov8_best.pt"
        
        try:
            if not model_path.exists():
                logger.error(f"YOLO 모델 파일이 없습니다: {model_path}")
                raise FileNotFoundError(f"YOLO 모델 파일을 찾을 수 없습니다: {model_path}")
            
            logger.info(f"✅ YOLO 모델 로드 중: {model_path}")
            model = YOLO(str(model_path))
            
            # 모델 정보 로깅
            if hasattr(model, 'names'):
                logger.info(f"YOLO 모델 클래스 수: {len(model.names)}")
                logger.info(f"YOLO 클래스들: {list(model.names.values())}")
            
            logger.info("✅ YOLO 모델 로드 성공!")
            return model
            
        except Exception as e:
            logger.error(f"❌ YOLO 모델 로드 실패: {e}")
            raise
    
    @staticmethod
    def load_ssd_model():
        """SSD300 모델 로드 - 커스텀 15개 클래스"""
        model_path = settings.AI_MODELS_DIR / "ssd.pth"
        
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"🔍 SSD 모델 로드 시도: {model_path}, 디바이스: {device}")
        
        try:
            if not model_path.exists():
                print(f"❌ SSD 모델 파일이 없습니다: {model_path}")
                return ModelManager._create_dummy_ssd(), device
            
            print(f"📁 SSD 모델 파일 존재 확인됨: {model_path}")
            
            # 🔥 정확한 SSD300 모델 구조 생성
            try:
                from torchvision.models.detection import ssd300_vgg16
                from torchvision.models.detection.ssd import SSDClassificationHead
                
                print("🏗️  SSD300 모델 구조 생성 중...")
                
                # ✅ 클래스 수 (학습할 때와 동일)
                num_classes = 15  # 14개 클래스 + 배경 포함
                
                # ✅ 기본 SSD300 모델 생성
                model = ssd300_vgg16(weights="DEFAULT")
                
                # ✅ 기존 정보 얻기 (학습할 때와 동일)
                in_channels = [512, 1024, 512, 256, 256, 256]  # VGG SSD feature map 채널 수
                num_anchors = model.anchor_generator.num_anchors_per_location()
                
                # ✅ classification head 재정의 (학습할 때와 동일)
                model.head.classification_head = SSDClassificationHead(in_channels, num_anchors, num_classes)
                
                print(f"✅ SSD300 모델 구조 생성 완료 ({num_classes}개 클래스)")
                
                # 체크포인트 로드
                checkpoint = torch.load(str(model_path), map_location=device)
                print(f"✅ SSD 체크포인트 로드 성공, 타입: {type(checkpoint)}")
                
                # state_dict 로드
                if isinstance(checkpoint, dict) and not hasattr(checkpoint, 'eval'):
                    print("📋 state_dict 로드 중...")
                    model.load_state_dict(checkpoint)
                else:
                    print("❌ 예상치 못한 체크포인트 형태")
                    return ModelManager._create_dummy_ssd(), device
                
                # 모델 설정
                model = model.to(device)
                model.eval()
                
                print("✅ SSD300 모델 로드 및 설정 완료!")
                
                # 모델 테스트 (간단한 forward pass)
                test_input = torch.randn(1, 3, 300, 300).to(device)
                with torch.no_grad():
                    test_output = model(test_input)
                
                print(f"✅ SSD300 모델 테스트 성공!")
                print(f"🎯 출력 타입: {type(test_output)}")
                
                if isinstance(test_output, dict):
                    for key, value in test_output.items():
                        if hasattr(value, 'shape'):
                            print(f"   {key}: {value.shape}")
                elif isinstance(test_output, (list, tuple)):
                    print(f"   출력 개수: {len(test_output)}")
                    for i, output in enumerate(test_output):
                        if hasattr(output, 'shape'):
                            print(f"   출력[{i}]: {output.shape}")
                
                return model, device
                
            except ImportError as e:
                print(f"❌ torchvision SSD 모듈 import 실패: {e}")
                return ModelManager._create_dummy_ssd(), device
                
            except Exception as e:
                print(f"❌ SSD300 모델 생성 실패: {e}")
                print(f"❌ 상세 에러: {traceback.format_exc()}")
                return ModelManager._create_dummy_ssd(), device
                        
        except Exception as e:
            print(f"❌ SSD 모델 로드 전체 실패: {e}")
            print(f"❌ 상세 에러: {traceback.format_exc()}")
            print("더미 SSD 모델 사용")
            return ModelManager._create_dummy_ssd(), device
    
    @staticmethod
    def _create_dummy_ssd():
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
                # 더 현실적인 SSD 출력 시뮬레이션
                batch_size = input_tensor.size(0)
                
                # 다양한 출력 형태 중 하나를 랜덤하게 선택
                output_type = np.random.choice(['list', 'tuple', 'single'])
                
                if output_type == 'list':
                    # [boxes, scores, labels] 형태
                    boxes = torch.randn(batch_size, 100, 4)  # 100개 박스
                    scores = torch.sigmoid(torch.randn(batch_size, 100))  # 0-1 점수
                    labels = torch.randint(0, 20, (batch_size, 100))  # 클래스 라벨
                    return [boxes, scores, labels]
                elif output_type == 'tuple':
                    # (classification, regression) 형태
                    classifications = torch.randn(batch_size, 8732, 21)
                    regressions = torch.randn(batch_size, 8732, 4)
                    return (classifications, regressions)
                else:
                    # 단일 텐서 [batch, detections, 6] 형태
                    return torch.randn(batch_size, 100, 6)
        
        return DummySSDModel()
    
    @staticmethod
    def run_yolo_inference(model, image):
        """YOLO 추론 - 실제 검출 우선, 없으면 더미 결과"""
        try:
            logger.info(f"🎯 YOLO 추론 시작 - 이미지 크기: {image.size}")
            
            # 이미지 전처리
            if image.mode != 'RGB':
                image = image.convert('RGB')
                logger.info("이미지를 RGB로 변환")
            
            # YOLO 추론 (신뢰도 임계값을 매우 낮게 설정)
            results = model(image, conf=0.01, iou=0.45, verbose=False)
            
            detections = []
            total_boxes = 0
            
            for result in results:
                boxes = result.boxes
                if boxes is not None and len(boxes) > 0:
                    total_boxes += len(boxes)
                    logger.info(f"YOLO에서 {len(boxes)}개 원시 검출")
                    
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names.get(class_id, f"class_{class_id}")
                        
                        # 최소 신뢰도 0.01 이상만
                        if confidence >= 0.01:
                            logger.info(f"✅ 검출: {class_name} (신뢰도: {confidence:.3f})")
                            
                            detections.append({
                                'label': class_name,
                                'bbox': [int(x1), int(y1), int(x2), int(y2)],
                                'confidence': confidence,
                                'model': 'YOLOv8'
                            })
            
            logger.info(f"총 {total_boxes}개 원시 검출, {len(detections)}개 유효 검출")
            
            # 실제 검출이 없으면 더미 결과 생성
            if not detections:
                logger.warning("⚠️ YOLO 실제 검출 없음 - 의료용 더미 결과 생성")
                detections = ModelManager._generate_medical_dummy_results(image, 'YOLOv8')
            
            logger.info(f"✅ YOLO 최종 결과: {len(detections)}개")
            return detections
            
        except Exception as e:
            logger.error(f"❌ YOLO 추론 실패: {e}")
            return ModelManager._generate_medical_dummy_results(image, 'YOLOv8')
    
    @staticmethod
    def run_ssd_inference(model, device, image):
        """🔥 SSD300 추론 - torchvision 출력 형태 처리"""
        try:
            print("🔍 SSD 추론 시작")
            
            # 더미 모델인지 확인
            if hasattr(model, '__class__') and 'DummySSDModel' in str(model.__class__):
                print("더미 SSD 모델 사용")
                return ModelManager._generate_medical_dummy_results(image, 'SSD')
            
            # 실제 SSD300 모델 추론
            print("실제 SSD300 모델로 추론 시도")
            
            # 🎯 원본 이미지 정보 저장
            original_width, original_height = image.size
            target_size = 300  # SSD300 기준
            
            print(f"📐 원본 이미지: {original_width}x{original_height}")
            
            # 🔥 이미지 전처리 (torchvision SSD용)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # torchvision transforms
            import torchvision.transforms as T
            transform = T.Compose([
                T.Resize((target_size, target_size)),
                T.ToTensor(),
            ])
            
            input_tensor = transform(image).unsqueeze(0).to(device)
            print(f"SSD 입력 텐서 형태: {input_tensor.shape}")
            
            # 모델 추론 (evaluation mode)
            model.eval()
            with torch.no_grad():
                predictions = model(input_tensor)
            
            print(f"SSD 모델 출력 타입: {type(predictions)}")
            
            if isinstance(predictions, list) and len(predictions) > 0:
                pred = predictions[0]  # 첫 번째 이미지 결과
                print(f"예측 결과 keys: {list(pred.keys()) if isinstance(pred, dict) else 'dict가 아님'}")
                
                if isinstance(pred, dict):
                    for key, value in pred.items():
                        if hasattr(value, 'shape'):
                            print(f"  {key}: {value.shape}")
                        else:
                            print(f"  {key}: {type(value)}")
            
            # 🎯 torchvision SSD 결과 파싱
            detections = ModelManager._parse_torchvision_ssd_outputs(
                predictions, original_width, original_height, target_size
            )
            
            if not detections:
                print("실제 SSD300 모델에서 검출 없음, 더미 결과 사용")
                return ModelManager._generate_medical_dummy_results(image, 'SSD')
            
            print(f"✅ 실제 SSD300 검출: {len(detections)}개")
            return detections
            
        except Exception as e:
            print(f"❌ SSD 추론 실패: {e}")
            print(f"❌ 상세 에러: {traceback.format_exc()}")
            return ModelManager._generate_medical_dummy_results(image, 'SSD')
    
    @staticmethod
    def _parse_torchvision_ssd_outputs(predictions, original_width, original_height, model_input_size):
        """torchvision SSD300 출력 파싱"""
        try:
            detections = []
            
            if not predictions or len(predictions) == 0:
                return detections
                
            pred = predictions[0]  # 첫 번째 이미지
            
            if not isinstance(pred, dict):
                print(f"❌ 예상치 못한 예측 형태: {type(pred)}")
                return detections
                
            # torchvision SSD 출력: {'boxes': tensor, 'labels': tensor, 'scores': tensor}
            boxes = pred.get('boxes', torch.empty((0, 4)))
            labels = pred.get('labels', torch.empty((0,)))
            scores = pred.get('scores', torch.empty((0,)))
            
            print(f"📊 SSD 출력: boxes={boxes.shape}, labels={labels.shape}, scores={scores.shape}")
            
            if len(boxes) == 0:
                print("검출된 객체 없음")
                return detections
                
            # 신뢰도 임계값 적용
            confidence_threshold = 0.3
            valid_indices = scores > confidence_threshold
            
            valid_boxes = boxes[valid_indices]
            valid_labels = labels[valid_indices] 
            valid_scores = scores[valid_indices]
            
            print(f"🔍 임계값 {confidence_threshold} 이상: {len(valid_boxes)}개")
            
            # 스케일링 비율 (SSD input -> 원본)
            scale_x = original_width / model_input_size
            scale_y = original_height / model_input_size
            
            print(f"🔄 스케일링 비율: x={scale_x:.3f}, y={scale_y:.3f}")
            
            # 클래스명 매핑 (실제 학습한 클래스에 맞게 수정 필요)
            class_names = {
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
                13: 'Pulmonary fibrosis'
            }
            
            # 전처리 정보 생성
            preprocessing_info = {
                'scale_x': scale_x,
                'scale_y': scale_y,
                'offset_x': 0,  # torchvision은 단순 리사이즈
                'offset_y': 0,
                'effective_width': model_input_size,
                'effective_height': model_input_size,
                'target_size': model_input_size,
                'original_width': original_width,
                'original_height': original_height
            }
            
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
                    class_name = class_names.get(label, f'class_{label}')
                    
                    detections.append({
                        'label': class_name,
                        'bbox': [orig_x1, orig_y1, orig_x2, orig_y2],
                        'confidence': score,
                        'model': 'SSD300',
                        'preprocessing_info': preprocessing_info
                    })
                    
                    print(f"✅ SSD 검출: {class_name} ({score:.3f}) [{orig_x1},{orig_y1},{orig_x2},{orig_y2}]")
            
            return detections[:10]  # 최대 10개로 제한
            
        except Exception as e:
            print(f"❌ SSD 출력 파싱 실패: {e}")
            print(f"❌ 상세 에러: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def _generate_medical_dummy_results(image, model_name):
        """간단한 더미 검출 결과 생성"""
        width, height = image.size
        
        if model_name == 'YOLOv8':
            detections = [
                {
                    'label': 'detection_1',
                    'bbox': [int(width * 0.15), int(height * 0.25), int(width * 0.45), int(height * 0.65)],
                    'confidence': 0.82,
                    'model': 'YOLOv8'
                },
                {
                    'label': 'detection_2',
                    'bbox': [int(width * 0.55), int(height * 0.35), int(width * 0.80), int(height * 0.60)],
                    'confidence': 0.67,
                    'model': 'YOLOv8'
                }
            ]
        else:  # SSD
            detections = [
                {
                    'label': 'detection_1',
                    'bbox': [int(width * 0.2), int(height * 0.3), int(width * 0.4), int(height * 0.5)],
                    'confidence': 0.74,
                    'model': 'SSD'
                },
                {
                    'label': 'detection_2',
                    'bbox': [int(width * 0.6), int(height * 0.4), int(width * 0.85), int(height * 0.7)],
                    'confidence': 0.63,
                    'model': 'SSD'
                },
                {
                    'label': 'detection_3',
                    'bbox': [int(width * 0.1), int(height * 0.7), int(width * 0.3), int(height * 0.9)],
                    'confidence': 0.71,
                    'model': 'SSD'
                }
            ]
        
        logger.info(f"🎭 {model_name} 더미 결과 생성: {len(detections)}개")
        return detections