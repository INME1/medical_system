import numpy as np
import cv2
import pydicom
import logging
import io
from typing import Optional, Tuple, Union
from .orthanc_api import OrthancAPI

logger = logging.getLogger('medical_integration')

class DICOMImageProcessor:
    """DICOM 이미지 처리 클래스"""
    
    @staticmethod
    def normalize_pixel_array(pixel_array: np.ndarray) -> np.ndarray:
        """픽셀 배열 정규화 (0-255 범위)"""
        try:
            # NaN 값 처리
            if np.isnan(pixel_array).any():
                pixel_array = np.nan_to_num(pixel_array, nan=0.0)
            
            # 데이터 타입별 처리
            if pixel_array.dtype == np.uint8:
                return pixel_array
            
            # 최소/최대값 계산
            min_val = np.min(pixel_array)
            max_val = np.max(pixel_array)
            
            if max_val == min_val:
                # 모든 픽셀이 같은 값인 경우
                return np.zeros_like(pixel_array, dtype=np.uint8)
            
            # 0-255 범위로 정규화
            normalized = ((pixel_array - min_val) / (max_val - min_val) * 255).astype(np.uint8)
            
            return normalized
            
        except Exception as e:
            logger.error(f"픽셀 배열 정규화 실패: {e}")
            # 안전한 기본값 반환
            return np.zeros_like(pixel_array, dtype=np.uint8)
    
    @staticmethod
    def apply_windowing(pixel_array: np.ndarray, window_center: float, window_width: float) -> np.ndarray:
        """DICOM 윈도우 레벨 적용"""
        try:
            window_min = window_center - window_width / 2
            window_max = window_center + window_width / 2
            
            # 윈도우 레벨 적용
            windowed = np.clip(pixel_array, window_min, window_max)
            
            # 0-255 범위로 정규화
            if window_max != window_min:
                windowed = ((windowed - window_min) / (window_max - window_min) * 255).astype(np.uint8)
            else:
                windowed = np.zeros_like(windowed, dtype=np.uint8)
            
            return windowed
            
        except Exception as e:
            logger.error(f"윈도우 레벨 적용 실패: {e}")
            return DICOMImageProcessor.normalize_pixel_array(pixel_array)
    
    @staticmethod
    def enhance_image_quality(image: np.ndarray) -> np.ndarray:
        """이미지 품질 향상 (SimCLR 분석을 위한 전처리)"""
        try:
            # 히스토그램 평활화
            if len(image.shape) == 2:
                # 그레이스케일
                enhanced = cv2.equalizeHist(image)
            else:
                # 컬러 이미지인 경우 LAB 색공간에서 처리
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
                lab[:,:,0] = cv2.equalizeHist(lab[:,:,0])
                enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            # 가우시안 필터로 노이즈 제거
            enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
            
            # 샤프닝 필터 적용
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            enhanced = cv2.filter2D(enhanced, -1, kernel)
            
            # 값 범위 클리핑
            enhanced = np.clip(enhanced, 0, 255).astype(np.uint8)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"이미지 품질 향상 실패: {e}")
            return image
    
    @staticmethod
    def resize_for_analysis(image: np.ndarray, target_size: Tuple[int, int] = (1024, 1024)) -> np.ndarray:
        """분석을 위한 이미지 리사이즈"""
        try:
            height, width = image.shape[:2]
            target_width, target_height = target_size
            
            # 종횡비 유지하며 리사이즈
            scale = min(target_width / width, target_height / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            
            resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
            
            # 패딩으로 목표 크기 맞추기
            if len(image.shape) == 2:
                padded = np.zeros((target_height, target_width), dtype=np.uint8)
            else:
                padded = np.zeros((target_height, target_width, image.shape[2]), dtype=np.uint8)
            
            # 중앙에 배치
            y_offset = (target_height - new_height) // 2
            x_offset = (target_width - new_width) // 2
            
            if len(image.shape) == 2:
                padded[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = resized
            else:
                padded[y_offset:y_offset+new_height, x_offset:x_offset+new_width, :] = resized
            
            return padded
            
        except Exception as e:
            logger.error(f"이미지 리사이즈 실패: {e}")
            return image

def get_dicom_image_from_orthanc(study_uid: str, series_uid: str = '', instance_uid: str = '') -> Optional[np.ndarray]:
    """
    Orthanc PACS에서 DICOM 이미지 추출 (SimCLR 분석용 - 개선 버전)
    
    Args:
        study_uid: Study Instance UID
        series_uid: Series Instance UID (선택적)
        instance_uid: Instance UID (선택적)
        
    Returns:
        numpy.ndarray: 처리된 이미지 배열 또는 None
    """
    try:
        orthanc_api = OrthancAPI()
        processor = DICOMImageProcessor()
        
        # 1. Study 정보 조회
        logger.info(f"🔍 Study 조회 중: {study_uid}")
        study_info = orthanc_api.get_study_by_uid(study_uid)
        
        if not study_info:
            logger.error(f"Study를 찾을 수 없음: {study_uid}")
            return None
        
        study_id = study_info.get('ID')
        logger.info(f"✅ Study 발견: {study_id}")
        
        # 2. 적절한 Instance 찾기
        target_instance_id = None
        
        if instance_uid:
            # 특정 Instance 요청
            logger.info(f"🎯 특정 Instance 조회: {instance_uid}")
            target_instance_id = orthanc_api.get_instance_id_by_uid(instance_uid)
        else:
            # 가장 적절한 Instance 자동 선택
            logger.info("🔍 최적 Instance 자동 선택 중...")
            target_instance_id = _find_best_instance(orthanc_api, study_id, series_uid)
        
        if not target_instance_id:
            logger.error("Instance ID를 확정할 수 없음")
            return None
        
        # 3. DICOM 파일 다운로드
        logger.info(f"📥 DICOM 파일 다운로드: {target_instance_id}")
        dicom_data = orthanc_api.get_instance_dicom(target_instance_id)
        
        if not dicom_data:
            logger.error("DICOM 데이터 다운로드 실패")
            return None
        
        # 4. DICOM 파일 파싱
        logger.info("🔍 DICOM 파일 파싱 중...")
        dicom_dataset = pydicom.dcmread(io.BytesIO(dicom_data))
        
        # 5. 픽셀 데이터 추출
        if not hasattr(dicom_dataset, 'pixel_array'):
            logger.error("DICOM 파일에 픽셀 데이터가 없음")
            return None
        
        pixel_array = dicom_dataset.pixel_array
        logger.info(f"📊 원본 이미지 정보: shape={pixel_array.shape}, dtype={pixel_array.dtype}")
        
        # 6. 이미지 전처리
        logger.info("🎨 이미지 전처리 시작...")
        
        # 윈도우 레벨 적용 (가능한 경우)
        try:
            window_center = getattr(dicom_dataset, 'WindowCenter', None)
            window_width = getattr(dicom_dataset, 'WindowWidth', None)
            
            if window_center is not None and window_width is not None:
                # 리스트인 경우 첫 번째 값 사용
                if isinstance(window_center, (list, tuple)):
                    window_center = window_center[0]
                if isinstance(window_width, (list, tuple)):
                    window_width = window_width[0]
                
                logger.info(f"🖼️ 윈도우 레벨 적용: center={window_center}, width={window_width}")
                processed_image = processor.apply_windowing(pixel_array, float(window_center), float(window_width))
            else:
                logger.info("📊 일반 정규화 적용")
                processed_image = processor.normalize_pixel_array(pixel_array)
                
        except Exception as window_error:
            logger.warning(f"윈도우 레벨 적용 실패, 일반 정규화 사용: {window_error}")
            processed_image = processor.normalize_pixel_array(pixel_array)
        
        # 7. 이미지 품질 향상
        logger.info("✨ 이미지 품질 향상...")
        enhanced_image = processor.enhance_image_quality(processed_image)
        
        # 8. 분석용 크기 조정
        logger.info("📏 분석용 리사이즈...")
        final_image = processor.resize_for_analysis(enhanced_image, target_size=(1024, 1024))
        
        logger.info(f"✅ 이미지 처리 완료: shape={final_image.shape}, dtype={final_image.dtype}")
        
        return final_image
        
    except Exception as e:
        logger.error(f"❌ DICOM 이미지 추출 실패: {str(e)}")
        logger.exception("상세 오류 정보:")
        return None

def _find_best_instance(orthanc_api: OrthancAPI, study_id: str, series_uid: str = None) -> Optional[str]:
    """Study에서 가장 적절한 Instance 찾기"""
    try:
        # Study 상세 정보 조회
        study_details = orthanc_api.get_study_with_series_and_instances(study_id)
        
        if not study_details or 'Series' not in study_details:
            logger.error("Study에 Series가 없음")
            return None
        
        # Series 우선순위 결정
        best_series = None
        best_score = 0
        
        for series in study_details['Series']:
            series_info = series.get('MainDicomTags', {})
            instances = series.get('Instances', [])
            
            if not instances:
                continue
            
            # 특정 Series가 요청된 경우
            if series_uid:
                if series_info.get('SeriesInstanceUID') == series_uid:
                    best_series = series
                    break
                else:
                    continue
            
            # 점수 계산 (Instance 수, 이미지 크기 등 고려)
            score = len(instances)
            
            # Modality 가중치
            modality = series_info.get('Modality', '').upper()
            if modality in ['CT', 'MR', 'CR', 'DX']:
                score += 10
            
            # Series Description 가중치
            description = series_info.get('SeriesDescription', '').lower()
            if any(keyword in description for keyword in ['axial', 'coronal', 'sagittal']):
                score += 5
            
            if score > best_score:
                best_score = score
                best_series = series
        
        if best_series and best_series.get('Instances'):
            # 첫 번째 Instance 선택 (일반적으로 가장 대표적)
            target_instance_id = best_series['Instances'][0]['ID']
            logger.info(f"✅ 최적 Instance 선택: {target_instance_id}")
            return target_instance_id
        else:
            logger.error("적절한 Instance를 찾을 수 없음")
            return None
            
    except Exception as e:
        logger.error(f"Instance 검색 오류: {e}")
        return None

def validate_dicom_for_simclr(image_array: np.ndarray) -> bool:
    """SimCLR 분석을 위한 이미지 유효성 검사"""
    try:
        if image_array is None:
            return False
        
        # 최소 크기 요구사항
        if image_array.shape[0] < 224 or image_array.shape[1] < 224:
            logger.warning(f"이미지가 너무 작음: {image_array.shape}")
            return False
        
        # 최대 크기 제한 (메모리 절약)
        if image_array.shape[0] > 2048 or image_array.shape[1] > 2048:
            logger.warning(f"이미지가 너무 큼: {image_array.shape}")
            return False
        
        # 데이터 타입 확인
        if image_array.dtype not in [np.uint8, np.uint16, np.float32, np.float64]:
            logger.warning(f"지원되지 않는 데이터 타입: {image_array.dtype}")
            return False
        
        # 빈 이미지 확인
        if np.all(image_array == 0):
            logger.warning("이미지가 모두 0값임")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"이미지 유효성 검사 실패: {e}")
        return False

def get_dicom_metadata(study_uid: str) -> Optional[dict]:
    """DICOM 메타데이터 추출"""
    try:
        orthanc_api = OrthancAPI()
        
        study_info = orthanc_api.get_study_by_uid(study_uid)
        if not study_info:
            return None
        
        # 메타데이터 정리
        metadata = {
            'study_uid': study_uid,
            'study_id': study_info.get('ID'),
            'patient_info': study_info.get('PatientMainDicomTags', {}),
            'study_info': study_info.get('MainDicomTags', {}),
            'series_count': len(study_info.get('Series', [])),
            'total_instances': sum(len(series.get('Instances', [])) for series in study_info.get('Series', []))
        }
        
        return metadata
        
    except Exception as e:
        logger.error(f"메타데이터 추출 실패: {e}")
        return None