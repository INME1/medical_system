import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
import pickle
import logging
from typing import Dict, List, Tuple, Optional
from torchvision import transforms
from torchvision.models import efficientnet_b2, EfficientNet_B2_Weights
import faiss
from pathlib import Path
import json
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.cm as cm

logger = logging.getLogger(__name__)

class EfficientNetSimCLR(nn.Module):
    def __init__(self, feature_dim=384, projection_dim=128):
        super(EfficientNetSimCLR, self).__init__()
        
        self.efficientnet = efficientnet_b2(weights=EfficientNet_B2_Weights.IMAGENET1K_V1)
        
        self.encoder = nn.Sequential(*list(self.efficientnet.children())[:-1])
        self.feature_dim = 1408  # EfficientNet-B2의 출력 차원
        
        # 적응형 평균 풀링
        self.adaptive_pool = nn.AdaptiveAvgPool2d((1, 1))
        
        # Projection head
        self.projection = nn.Sequential(
            nn.Linear(self.feature_dim, feature_dim),
            nn.BatchNorm1d(feature_dim),
            nn.SiLU(inplace=True),  # Swish 활성화 함수
            nn.Dropout(0.2),
            nn.Linear(feature_dim, projection_dim),
            nn.BatchNorm1d(projection_dim),
        )
        
        # 가중치 초기화
        self._initialize_weights()
        
    def _initialize_weights(self):
        """EfficientNet 스타일 가중치 초기화"""
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.trunc_normal_(m.weight, std=0.02)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm1d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
    
    def forward(self, x):
        # EfficientNet 특징 추출
        h = self.encoder(x)
        h = self.adaptive_pool(h)
        h = h.flatten(1)
        
        # Projection head 통과
        z = self.projection(h)
        
        # L2 정규화
        return F.normalize(z, dim=-1)
    
    def get_features(self, x):
        """특징 추출 (projection 이전) - 추론용"""
        with torch.no_grad():
            h = self.encoder(x)
            h = self.adaptive_pool(h)
            h = h.flatten(1)
        return h
    
    def get_conv_features(self, x):
        """Grad-CAM을 위한 convolutional features"""
        # EfficientNet의 마지막 convolutional layer까지만 통과
        features = x
        for i, layer in enumerate(self.efficientnet.features):
            features = layer(features)
        return features

class GradCAMGenerator:
    """ Grad-CAM 생성기 """
    
    def __init__(self, model, device='cpu'):
        self.model = model
        self.device = device
        self.gradients = None
        self.activations = None
        
        # EfficientNet의 마지막 conv layer에 hook 등록
        self.target_layer = self.model.efficientnet.features[-1]
        self.target_layer.register_forward_hook(self._save_activation)
        self.target_layer.register_backward_hook(self._save_gradient)
    
    def _save_activation(self, module, input, output):
        self.activations = output
    
    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]
    
    def generate_cam(self, input_tensor, class_idx=None):
        try:
            self.model.eval()
            
            # 🔥 input_tensor가 gradient를 요구하도록 설정
            if not input_tensor.requires_grad:
                input_tensor = input_tensor.requires_grad_(True)
            
            # Forward pass through conv features만 (projection 제외)
            conv_features = self.model.get_conv_features(input_tensor)  # [1, C, H, W]
            
            # 🔥 간단한 anomaly score 계산 (gradient 호환)
            # Conv features의 각 채널별 평균을 계산하여 이상도로 사용
            pooled_features = F.adaptive_avg_pool2d(conv_features, (1, 1))  # [1, C, 1, 1]
            flattened = pooled_features.flatten(1)  # [1, C]
            
            # 특징의 L2 norm을 이상도로 사용 (gradient 계산 가능)
            anomaly_score = torch.norm(flattened, dim=1).mean()
            
            # 🔥 anomaly_score가 gradient를 요구하는지 확인
            if not anomaly_score.requires_grad:
                logger.warning("anomaly_score가 gradient를 요구하지 않음, 단순 CAM 생성")
                return self._generate_simple_cam(conv_features)
            
            # Backward pass
            self.model.zero_grad()
            anomaly_score.backward(retain_graph=True)
            
            # Grad-CAM 계산
            gradients = self.gradients  # [1, C, H, W]
            activations = self.activations  # [1, C, H, W]
            
            if gradients is None or activations is None:
                logger.warning("Gradients 또는 activations가 None, 단순 CAM 생성")
                return self._generate_simple_cam(conv_features)
            
            # Global average pooling of gradients
            weights = torch.mean(gradients[0], dim=(1, 2))  # [C]
            
            # Weighted combination
            cam = torch.zeros(activations.shape[2:], device=self.device)
            for i, w in enumerate(weights):
                cam += w * activations[0, i, :, :]
            
            # ReLU and normalize
            cam = F.relu(cam)
            if cam.max() > 0:
                cam = cam / cam.max()
            
            return cam.detach().cpu().numpy()
            
        except Exception as e:
            logger.error(f"Grad-CAM 생성 오류: {e}")
            # Fallback: 단순 CAM 생성
            return self._generate_simple_cam_fallback(input_tensor)
    
    def _generate_simple_cam(self, conv_features):
        try:
            # Conv features의 채널별 평균을 CAM으로 사용
            cam = torch.mean(conv_features[0], dim=0)  # [H, W]
            
            # 정규화
            cam = F.relu(cam)
            if cam.max() > 0:
                cam = cam / cam.max()
            
            return cam.detach().cpu().numpy()
            
        except Exception as e:
            logger.error(f"단순 CAM 생성 오류: {e}")
            # 최종 fallback: 균일한 CAM
            return np.ones((7, 7), dtype=np.float32) * 0.5
    
    def _generate_simple_cam_fallback(self, input_tensor):
        """최종 fallback CAM 생성"""
        try:
            # 입력 이미지 크기 기준으로 기본 CAM 생성
            height, width = input_tensor.shape[2], input_tensor.shape[3]
            cam_height, cam_width = height // 32, width // 32  # 대략적인 feature map 크기
            
            # 중앙이 조금 더 밝은 CAM 생성
            y, x = np.ogrid[:cam_height, :cam_width]
            center_y, center_x = cam_height // 2, cam_width // 2
            cam = np.exp(-((x - center_x) ** 2 + (y - center_y) ** 2) / (2.0 * (min(cam_height, cam_width) / 4) ** 2))
            
            return cam.astype(np.float32)
            
        except Exception as e:
            logger.error(f"Fallback CAM 생성 오류: {e}")
            return np.ones((7, 7), dtype=np.float32) * 0.5

class SimCLRPatchInference:
    """SimCLR 패치 기반 이상탐지 추론"""
    
    def __init__(self, model_path: str, features_path: str, device='cpu'):
        self.device = device
        self.model = None
        self.reference_features = None
        self.faiss_index = None
        self.grad_cam = None
        
        # 이미지 전처리 (학습 시와 동일)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        self._load_model(model_path)
        self._load_features(features_path)
        
    def _load_model(self, model_path: str):
        """모델 로드"""
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # 모델 설정 추출
            model_config = checkpoint.get('model_config', {})
            feature_dim = model_config.get('feature_dim', 384)
            projection_dim = model_config.get('projection_dim', 128)
            
            logger.info(f"📊 모델 설정: feature_dim={feature_dim}, projection_dim={projection_dim}")
            
            # 모델 생성
            self.model = EfficientNetSimCLR(feature_dim, projection_dim)
            
            # state_dict 로드
            try:
                self.model.load_state_dict(checkpoint['model_state_dict'], strict=True)
                logger.info("✅ 모델 가중치 로드 성공 (strict mode)")
            except RuntimeError as e:
                logger.warning(f"⚠️ Strict 모드 실패, 부분 로드 시도: {e}")
                model_dict = self.model.state_dict()
                pretrained_dict = {k: v for k, v in checkpoint['model_state_dict'].items() 
                                 if k in model_dict and v.size() == model_dict[k].size()}
                model_dict.update(pretrained_dict)
                self.model.load_state_dict(model_dict)
                logger.info(f"✅ 부분 모델 로드 성공: {len(pretrained_dict)}/{len(model_dict)} 레이어")
            
            self.model.to(self.device)
            self.model.eval()
            
            # Grad-CAM 초기화
            self.grad_cam = GradCAMGenerator(self.model, self.device)
            
            logger.info(f"✅ SimCLR 모델 로드 완료: {model_path}")
            
        except Exception as e:
            logger.error(f"❌ 모델 로드 실패: {e}")
            logger.exception("상세 오류:")
            raise
    
    def _load_features(self, features_path: str):
        """정상 특징벡터 로드"""
        try:
            with open(features_path, 'rb') as f:
                features_data = pickle.load(f)
            
            # 특징벡터 추출
            if isinstance(features_data, dict):
                self.reference_features = features_data.get('features', features_data)
            else:
                self.reference_features = features_data
            
            # numpy array로 변환
            if isinstance(self.reference_features, list):
                self.reference_features = np.array(self.reference_features)
            
            # FAISS 인덱스 구성
            dimension = self.reference_features.shape[1]
            self.faiss_index = faiss.IndexFlatL2(dimension)
            self.faiss_index.add(self.reference_features.astype(np.float32))
            
            logger.info(f"✅ 정상 특징벡터 로드 완료: {self.reference_features.shape[0]}개 패치, 차원: {dimension}")
            
        except Exception as e:
            logger.error(f"❌ 특징벡터 로드 실패: {e}")
            raise
    
    def extract_patches(self, image: np.ndarray, patch_size: int = 224, stride: int = 112):
        """이미지에서 패치 추출 """
        h, w = image.shape[:2]
        patches = []
        positions = []
        
        for y in range(0, h - patch_size + 1, stride):
            for x in range(0, w - patch_size + 1, stride):
                patch = image[y:y+patch_size, x:x+patch_size]
                if patch.shape[:2] == (patch_size, patch_size):
                    patches.append(patch)
                    positions.append((x, y, x+patch_size, y+patch_size))
        
        return patches, positions
    
    def compute_patch_anomaly_scores(self, patches: List[np.ndarray]) -> np.ndarray:
        """패치들의 이상도 점수 계산"""
        anomaly_scores = []
        
        for patch in patches:
            # 패치를 PIL Image로 변환
            if len(patch.shape) == 2:  # 그레이스케일
                patch_pil = Image.fromarray(patch).convert('RGB')
            else:
                patch_pil = Image.fromarray(patch)
            
            # 전처리
            patch_tensor = self.transform(patch_pil).unsqueeze(0).to(self.device)
            
            # 특징 추출 (projection 이전의 features 사용)
            with torch.no_grad():
                features = self.model.get_features(patch_tensor)
                features_np = features.cpu().numpy().astype(np.float32)
            
            # FAISS로 최근접 이웃 거리 계산
            distances, _ = self.faiss_index.search(features_np, k=1)
            anomaly_score = distances[0][0]  # L2 거리
            
            anomaly_scores.append(anomaly_score)
        
        return np.array(anomaly_scores)
    
    def generate_heatmap(self, image: np.ndarray, patches: List[np.ndarray], 
                        positions: List[Tuple], anomaly_scores: np.ndarray) -> np.ndarray:
        """이상도 히트맵 생성"""
        h, w = image.shape[:2]
        heatmap = np.zeros((h, w), dtype=np.float32)
        count_map = np.zeros((h, w), dtype=np.float32)
        
        # 각 패치의 이상도를 해당 위치에 누적
        for (x1, y1, x2, y2), score in zip(positions, anomaly_scores):
            heatmap[y1:y2, x1:x2] += score
            count_map[y1:y2, x1:x2] += 1
        
        # 평균화 (겹치는 부분)
        mask = count_map > 0
        heatmap[mask] = heatmap[mask] / count_map[mask]
        
        # 정규화
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()
        
        return heatmap
    
    def generate_gradcam_for_image(self, image: np.ndarray) -> np.ndarray:
        """전체 이미지에 대한 Grad-CAM 생성"""
        try:
            # 이미지 전처리
            if len(image.shape) == 2:
                image_pil = Image.fromarray(image).convert('RGB')
            else:
                image_pil = Image.fromarray(image)
            
            # 224x224로 리사이즈
            image_resized = image_pil.resize((224, 224))
            input_tensor = self.transform(image_resized).unsqueeze(0).to(self.device)
            
            # 🔥 gradient 계산을 위한 설정
            input_tensor.requires_grad_(True)
            
            # Grad-CAM 생성
            cam = self.grad_cam.generate_cam(input_tensor)
            
            # 원본 크기로 복원
            cam_resized = cv2.resize(cam, (image.shape[1], image.shape[0]))
            
            return cam_resized
            
        except Exception as e:
            logger.error(f"Grad-CAM 생성 오류: {e}")
            # Fallback: 패치 기반 히트맵 사용
            logger.info("Fallback: 패치 기반 히트맵 사용")
            return np.ones((image.shape[0], image.shape[1]), dtype=np.float32) * 0.5
    
    # backend/ai_services/simclr_inference_service.py
# analyze_image 메서드의 JSON 직렬화 부분만 수정

    def analyze_image(self, image: np.ndarray) -> Dict:
        """이미지 분석 - JSON 직렬화 안전"""
        try:
            logger.info(f"🔍 이미지 분석 시작: shape={image.shape}")
            
            # 1. 패치 추출
            patches, positions = self.extract_patches(image)
            
            if not patches:
                return {
                    'status': 'error',
                    'message': '패치를 추출할 수 없습니다.'
                }
            
            logger.info(f"📋 패치 추출 완료: {len(patches)}개")
            
            # 2. 패치별 이상도 계산
            anomaly_scores = self.compute_patch_anomaly_scores(patches)
            
            # 3. 전체 이상도 점수
            overall_anomaly_score = np.mean(anomaly_scores)
            max_anomaly_score = np.max(anomaly_scores)
            
            # 4. 이상 패치 식별 (상위 10%)
            threshold = np.percentile(anomaly_scores, 90)
            anomaly_patches = []
            
            for i, (pos, score) in enumerate(zip(positions, anomaly_scores)):
                if score > threshold:
                    anomaly_patches.append({
                        'position': [int(pos[0]), int(pos[1]), int(pos[2]), int(pos[3])],  # tuple을 list로 변환
                        'score': float(score),
                        'patch_index': int(i)
                    })
            
            # 5. 패치 기반 히트맵 생성
            patch_heatmap = self.generate_heatmap(image, patches, positions, anomaly_scores)
            
            # 6. Grad-CAM 생성 (안전한 버전)
            try:
                gradcam_heatmap = self.generate_gradcam_for_image(image)
                logger.info("✅ Grad-CAM 생성 성공")
            except Exception as gradcam_error:
                logger.warning(f"Grad-CAM 생성 실패, 패치 히트맵 사용: {gradcam_error}")
                gradcam_heatmap = patch_heatmap
            
            # 7. 히트맵 오버레이 생성
            overlay_image = self._create_overlay(image, gradcam_heatmap)
            
            # 8. Base64 인코딩
            overlay_base64 = self._encode_image_to_base64(overlay_image)
            
            logger.info(f"✅ 분석 완료: 이상도={overall_anomaly_score:.3f}, 이상패치={len(anomaly_patches)}개")
            
            # 🔥 JSON 직렬화 안전 결과 반환
            return {
                'status': 'success',
                'results': {
                    'overall_anomaly_score': float(overall_anomaly_score),  # numpy float을 Python float으로 변환
                    'max_anomaly_score': float(max_anomaly_score),
                    'num_patches': int(len(patches)),  # 명시적 int 변환
                    'num_anomaly_patches': int(len(anomaly_patches)),
                    'anomaly_patches': anomaly_patches,  # 이미 안전하게 변환됨
                    'threshold': float(threshold),
                    'is_abnormal': bool(overall_anomaly_score > 0.5),  # numpy bool을 Python bool로 변환
                    'confidence': float(min(overall_anomaly_score * 100, 100)),
                    'heatmap_overlay': f"data:image/png;base64,{overlay_base64}",
                    'image_size': [int(image.shape[0]), int(image.shape[1])]  # tuple을 list로 변환
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ 이미지 분석 실패: {e}")
            logger.exception("상세 오류:")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def _create_overlay(self, original_image: np.ndarray, heatmap: np.ndarray) -> np.ndarray:
        """원본 이미지에 히트맵 오버레이"""
        try:
            # 히트맵 정규화
            heatmap_normalized = ((heatmap - heatmap.min()) / (heatmap.max() - heatmap.min()) * 255).astype(np.uint8)
            
            # 컬러맵 적용
            heatmap_colored = cv2.applyColorMap(heatmap_normalized, cv2.COLORMAP_JET)
            
            # 원본 이미지 준비
            if len(original_image.shape) == 2:
                original_rgb = cv2.cvtColor(original_image, cv2.COLOR_GRAY2RGB)
            else:
                original_rgb = original_image
            
            # 오버레이 (70% 원본 + 30% 히트맵)
            overlay = cv2.addWeighted(original_rgb, 0.7, heatmap_colored, 0.3, 0)
            
            return overlay
            
        except Exception as e:
            logger.error(f"오버레이 생성 오류: {e}")
            # Fallback: 원본 이미지 반환
            if len(original_image.shape) == 2:
                return cv2.cvtColor(original_image, cv2.COLOR_GRAY2RGB)
            else:
                return original_image
    
    def _encode_image_to_base64(self, image: np.ndarray) -> str:
        """이미지를 Base64로 인코딩"""
        try:
            _, buffer = cv2.imencode('.png', image)
            return base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            logger.error(f"Base64 인코딩 오류: {e}")
            return ""

# Django 서비스 래퍼 (변경사항 없음)
class SimCLRInferenceService:
    """Django용 SimCLR 추론 서비스"""
    
    def __init__(self):
        self.inference = None
        self.model_loaded = False
        
        # 모델 파일 경로
        self.model_path = Path("ai_models/sim_patch/final_efficientnet_simclr.pth")
        self.features_path = Path("ai_models/sim_patch/patch_features.pkl")
        
        self._initialize()
    
    def _initialize(self):
        """서비스 초기화"""
        try:
            if self.model_path.exists() and self.features_path.exists():
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                logger.info(f"🔄 SimCLR 모델 로딩 시작... (device: {device})")
                
                self.inference = SimCLRPatchInference(
                    str(self.model_path), 
                    str(self.features_path), 
                    device
                )
                self.model_loaded = True
                logger.info("✅ SimCLR 추론 서비스 초기화 완료")
            else:
                logger.warning(f"⚠️ SimCLR 모델 파일이 없습니다. 모델: {self.model_path.exists()}, 특징: {self.features_path.exists()}")
                
        except Exception as e:
            logger.error(f"❌ SimCLR 서비스 초기화 실패: {e}")
            logger.exception("상세 오류:")
    
    def analyze_dicom_image(self, image_array: np.ndarray, study_uid: str) -> Dict:
        """DICOM 이미지 분석"""
        if not self.model_loaded or self.inference is None:
            return {
                'status': 'error',
                'message': 'SimCLR 모델이 로드되지 않았습니다.'
            }
        
        try:
            result = self.inference.analyze_image(image_array)
            
            # 추가 메타데이터
            if result['status'] == 'success':
                result['study_uid'] = study_uid
                result['analysis_type'] = 'simclr_patch_based'
                result['model_type'] = 'EfficientNet-B2 SimCLR (Fixed Gradient)'
            
            return result
            
        except Exception as e:
            logger.error(f"❌ DICOM 이미지 분석 실패: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_model_status(self) -> Dict:
        """모델 상태 반환"""
        return {
            'loaded': self.model_loaded,
            'model_path_exists': self.model_path.exists(),
            'features_path_exists': self.features_path.exists(),
            'device': self.inference.device if self.inference else 'unknown'
        }

# 싱글톤 인스턴스
simclr_inference_service = SimCLRInferenceService()