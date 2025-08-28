import json
import sys
import os
import logging
from datetime import datetime
import importlib.util
import requests
from flask import Flask, request, jsonify
import pydicom
import io
import base64
import time
import traceback
from flask_cors import CORS


# 로깅 설정
# StreamHandler에 인코딩을 명시적으로 'utf-8'로 설정하여 한글 깨짐 및 UnicodeEncodeError 방지
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

file_handler = logging.FileHandler('/var/log/ai_service.log', encoding='utf-8')
file_handler.setFormatter(log_formatter)

stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(log_formatter)
stream_handler.encoding = 'utf-8' # <-- 이 부분이 중요합니다.

logging.basicConfig(
    level=logging.INFO, # 운영 환경에서는 INFO, 디버깅 시에는 DEBUG
    handlers=[
        file_handler,
        stream_handler
    ]
)
logger = logging.getLogger('AIService')

# Flask 앱 초기화
app = Flask(__name__)
CORS(app, origins=["http://35.225.63.41:3000", "*"])  # 개발환경용

# 경로 및 서버 설정
MODELS_PATH = '/models'
YOLO_MODEL_PATH = os.path.join(MODELS_PATH, 'yolov8', 'yolov8_inference.py')
SSD_MODEL_PATH = os.path.join(MODELS_PATH, 'ssd', 'ssd_inference.py')
ORTHANC_URL = os.getenv("ORTHANC_URL", "http://orthanc:8042")
DJANGO_URL = 'http://35.225.63.41:8000'

ORTHANC_USERNAME = 'orthanc'
ORTHANC_PASSWORD = 'orthanc'

auth_tuple = (ORTHANC_USERNAME, ORTHANC_PASSWORD)

class AIAnalyzer:
    MEDICAL_CLASSES = {
        0: 'Normal', 1: 'Aortic enlargement', 2: 'Atelectasis',
        3: 'Calcification', 4: 'Cardiomegaly', 5: 'Consolidation',
        6: 'ILD', 7: 'Infiltration', 8: 'Lung Opacity',
        9: 'Nodule/Mass', 10: 'Other lesion', 11: 'Pleural effusion',
        12: 'Pleural thickening', 13: 'Pulmonary fibrosis'
    }

    def __init__(self):
        self.yolo_module = None
        self.ssd_module = None
        self._load_models()

    def _load_models(self):
        try:
            if os.path.exists(YOLO_MODEL_PATH):
                spec = importlib.util.spec_from_file_location("yolo_inference", YOLO_MODEL_PATH)
                self.yolo_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(self.yolo_module)
                logger.info(f"YOLO 모델 로드 완료: {YOLO_MODEL_PATH}")
            if os.path.exists(SSD_MODEL_PATH):
                spec = importlib.util.spec_from_file_location("ssd_inference", SSD_MODEL_PATH)
                self.ssd_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(self.ssd_module)
                logger.info(f"SSD 모델 로드 완료: {SSD_MODEL_PATH}")
        except Exception as e:
            logger.error(f"모델 로드 중 오류 발생: {e}")
            logger.error(traceback.format_exc())
            
    def analyze_dicom_data(self, dicom_data, modality):
        start_time = time.time()
        try:
            if modality != 'CR':
                return self._create_mock_result(modality, skipped=True)

            # 🔥 개별 모델 분석 및 저장
            analysis_results = []

            # YOLO 모델 분석
            if self.yolo_module:
                try:
                    yolo_result = self.yolo_module.analyze(dicom_data)
                    if yolo_result.get('success'):
                        processing_time = time.time() - start_time
                        yolo_final = {
                            'success': True,
                            'detections': yolo_result.get('detections', []),
                            'model_type': 'yolo',
                            'metadata': {
                                'model_used': 'yolo',
                                'analysis_timestamp': datetime.now().isoformat(),
                                'modality': modality,
                                'processing_time': processing_time,
                                'model_version': 'yolov8_v1.0'
                            }
                        }
                        analysis_results.append(yolo_final)
                        logger.info(f"✅ YOLO 분석 성공: {len(yolo_result.get('detections', []))}개 탐지")
                except Exception as e:
                    logger.error(f"YOLO 분석 오류: {e}")
                    logger.error(traceback.format_exc())

            # SSD 모델 분석
            if self.ssd_module:
                try:
                    ssd_result = self.ssd_module.analyze(dicom_data)
                    if ssd_result.get('success'):
                        processing_time = time.time() - start_time
                        ssd_final = {
                            'success': True,
                            'detections': ssd_result.get('detections', []),
                            'model_type': 'ssd',
                            'metadata': {
                                'model_used': 'ssd',
                                'analysis_timestamp': datetime.now().isoformat(),
                                'modality': modality,
                                'processing_time': processing_time,
                                'model_version': 'ssd_v1.0'
                            }
                        }
                        analysis_results.append(ssd_final)
                        logger.info(f"✅ SSD 분석 성공: {len(ssd_result.get('detections', []))}개 탐지")
                except Exception as e:
                    logger.error(f"SSD 분석 오류: {e}")
                    logger.error(traceback.format_exc())

            return analysis_results

        except Exception as e:
            logger.error(f"DICOM 분석 실패: {e}")
            logger.error(traceback.format_exc())
            return [self._create_error_result(str(e))]

    def _create_mock_result(self, modality, skipped=False):
        return [{
            'success': True,
            'detections': [],
            'message': f"{modality} 모달리티 분석 스킵됨.",
            'skipped': skipped,
            'metadata': {}
        }]

    def _create_error_result(self, error_msg):
        return [{
            'success': False,
            'error': error_msg,
            'detections': []
        }]

ai_analyzer = AIAnalyzer()

def resolve_instance_id(uid_or_id):
    """
    내부 UUID 또는 SOPInstanceUID 둘 다 처리
    """
    if '-' in uid_or_id:
        return uid_or_id  # UUID 형식이면 그대로
    else:
        try:
            find_url = f"{ORTHANC_URL}/tools/find"
            query = {
                "Level": "Instance",
                "Query": {
                    "SOPInstanceUID": uid_or_id
                }
            }
            response = requests.post(find_url, auth=auth_tuple, json=query, timeout=10)
            response.raise_for_status()
            matches = response.json()
            if matches:
                return matches[0]  # 첫 번째 매칭 ID
        except Exception as e:
            logger.warning(f"UID 매핑 실패: {uid_or_id}, 이유: {e}")
    return None


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/analyze/<instance_id>', methods=['POST'])
def analyze_instance(instance_id):
    try:
        # SOPInstanceUID → Orthanc 내부 ID 매핑
        resolved_id = resolve_instance_id(instance_id)
        if not resolved_id:
            return jsonify({'error': 'Instance not found'}), 404

        logger.info(f"인스턴스 분석 요청 (Resolved ID: {resolved_id})")

        # ⛔ 기존 instance_id → ✅ resolved_id 사용
        instance_info = get_instance_info(resolved_id)
        if not instance_info:
            return jsonify({'error': 'Instance info not found'}), 404

        dicom_data = get_dicom_file(resolved_id)
        if not dicom_data:
            return jsonify({'error': 'DICOM download failed'}), 500

        modality = instance_info['MainDicomTags'].get('Modality', 'UNKNOWN')
        
        # 🔥 해상도 추출 우선순위 변경
        # 1. DICOM 데이터에서 직접 추출 (최우선)
        image_width, image_height = get_image_dimensions_from_data(dicom_data)
        
        # 2. 추출 실패시 Orthanc에서 시도
        if not image_width or not image_height:
            logger.warning("⚠️ DICOM 직접 추출 실패, Orthanc API 시도")
            try:
                orthanc_url = "http://35.225.63.41:8042"
                auth = ("orthanc", "orthanc")
                tags_response = requests.get(f"{orthanc_url}/instances/{resolved_id}/tags", auth=auth, timeout=10)
                
                if tags_response.status_code == 200:
                    tags = tags_response.json()
                    rows = tags.get("0028,0010", {}).get("Value", [None])[0]
                    cols = tags.get("0028,0011", {}).get("Value", [None])[0]
                    
                    if rows and cols:
                        image_height = int(rows)
                        image_width = int(cols)
                        logger.info(f"📐 Orthanc API에서 해상도 추출: {image_width}x{image_height}")
            except Exception as e:
                logger.warning(f"⚠️ Orthanc API 해상도 추출 실패: {e}")
        
        # 3. 최종 기본값
        if not image_width or not image_height:
            image_width, image_height = 512, 512  # 🔥 1024에서 512로 변경
            logger.warning(f"⚠️ 모든 해상도 추출 실패, 기본값 사용: {image_width}x{image_height}")

        analysis_results = ai_analyzer.analyze_dicom_data(dicom_data, modality)

        saved_results = []
        for result in analysis_results:
            if result.get('success') and not result.get('skipped'):
                result['metadata'] = result.get('metadata', {})
                result['metadata']['image_width'] = image_width
                result['metadata']['image_height'] = image_height

                save_result = save_analysis_result(instance_id, result, dicom_data)
                saved_results.append(save_result)

        return jsonify({
            'success': True,
            'total_models': len(analysis_results),
            'saved_count': len(saved_results),
            'results': analysis_results,
            'image_dimensions': f"{image_width}x{image_height}",
            'resolution_source': 'DICOM_direct' if image_width != 512 else 'default'  # 🔥 출처 정보
        })

    except Exception as e:
        logger.error(f"분석 실패: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# 🔥 새로운 함수: DICOM 데이터에서 직접 해상도 추출
def get_image_dimensions_from_data(dicom_data):
    """DICOM 바이너리 데이터에서 해상도 정보 추출"""
    try:
        import pydicom
        import io
        
        dicom_file = pydicom.dcmread(io.BytesIO(dicom_data))
        
        # Rows, Columns 태그에서 해상도 추출
        height = getattr(dicom_file, 'Rows', None)
        width = getattr(dicom_file, 'Columns', None)
        
        if height and width:
            height, width = int(height), int(width)
            logger.info(f"📐 DICOM Rows/Columns에서 해상도 추출: {width}x{height}")
            return width, height
        
        # 2. 백업: PixelData에서 추출 시도
        if hasattr(dicom_file, 'pixel_array'):
            try:
                pixel_array = dicom_file.pixel_array
                if len(pixel_array.shape) >= 2:
                    height, width = pixel_array.shape[:2]
                    logger.info(f"📐 DICOM pixel_array에서 해상도 추출: {width}x{height}")
                    return int(width), int(height)
            except Exception as e:
                logger.warning(f"⚠️ pixel_array 접근 실패: {e}")
        
        # 3. 다른 태그들 시도
        alternative_tags = [
            ('BitsAllocated', 'BitsStored'),  # 픽셀 정보
            ('PhotometricInterpretation',),   # 색상 정보
            ('SamplesPerPixel',),             # 채널 정보
        ]
        
        for tags in alternative_tags:
            if all(hasattr(dicom_file, tag) for tag in tags):
                logger.info(f"📋 DICOM에 {tags} 태그 존재 - 이미지 데이터 있음")
                break
        else:
            logger.warning(f"⚠️ DICOM에서 이미지 관련 태그를 찾을 수 없음")
            return None, None
        
        logger.warning(f"⚠️ DICOM에서 해상도 정보 없음, 다른 방법 필요")
        return None, None
            
    except Exception as e:
        logger.error(f"❌ DICOM 해상도 추출 실패: {e}")
        return None, None

    

@app.route('/results/<instance_id>', methods=['GET'])
def get_analysis_result(instance_id):
    try:
        # ✅ 먼저 내부 Orthanc ID로 변환 (SOPInstanceUID 지원)
        resolved_id = resolve_instance_id(instance_id)
        if not resolved_id:
            return jsonify({'error': 'Instance not found'}), 404

        instance_info = get_instance_info(resolved_id)
        if not instance_info:
            return jsonify({'error': 'Instance info not found'}), 404

        study_uid = instance_info.get('MainDicomTags', {}).get('StudyInstanceUID')
        if not study_uid:
            return jsonify({'error': 'Study UID not found'}), 404

        url = f"{DJANGO_URL}/api/ai/results/save/{study_uid}/"
        logger.info(f"📥 결과 조회 URL: {url}")
        resp = requests.get(url, timeout=80)

        if resp.status_code == 200:
            return jsonify(resp.json())

        return jsonify({'error': 'Failed to fetch results', 'details': resp.text}), resp.status_code

    except Exception as e:
        logger.error(f"❌ 결과 조회 실패: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


def get_instance_info(instance_id):
    try:
        # ✅ 먼저 instance_id가 SOPInstanceUID인지 확인하고 Orthanc 내부 ID로 변환
        if '-' not in instance_id:  # SOPInstanceUID는 보통 '-' 없음
            logger.info(f"🔍 SOPInstanceUID 감지됨, 내부 ID로 매핑 시도: {instance_id}")
            resolved = resolve_instance_id(instance_id)
            if not resolved:
                logger.warning(f"❌ SOPInstanceUID를 내부 Orthanc ID로 매핑 실패: {instance_id}")
                return None
            instance_id = resolved  # 매핑 성공 시 내부 ID로 교체

        # 🔍 실제 인스턴스 정보 요청
        r1 = requests.get(f"{ORTHANC_URL}/instances/{instance_id}", auth=auth_tuple, timeout=80)
        logger.info(f"➡️ GET {ORTHANC_URL}/instances/{instance_id}")
        logger.info(f"➡️ 응답 코드: {r1.status_code}")
        if r1.status_code != 200:
            logger.warning(f"Orthanc 인스턴스 정보 조회 실패: {instance_id}, Status: {r1.status_code}, Response: {r1.text}")
            return None
        instance_info = r1.json()

        # 🔍 Simplified 태그도 병합
        r2 = requests.get(f"{ORTHANC_URL}/instances/{instance_id}/simplified-tags", auth=auth_tuple, timeout=80)
        if r2.status_code == 200:
            tags = r2.json()
            instance_info.setdefault('MainDicomTags', {})
            for key in ['PatientID', 'StudyInstanceUID', 'SeriesInstanceUID', 'instance_id', 'InstanceNumber', 'Modality']:
                if key in tags:
                    instance_info['MainDicomTags'][key] = tags[key]

        # ✅ 필수 태그 검증
        required_keys = ['StudyInstanceUID', 'SeriesInstanceUID', 'SOPInstanceUID']
        for key in required_keys:
            if not instance_info['MainDicomTags'].get(key):
                logger.warning(f"{key}가 누락됨. Instance ID: {instance_id}")
                return None

        return instance_info

    except Exception as e:
        logger.error(f"get_instance_info 실패: {e}")
        logger.error(traceback.format_exc())
        return None

def get_dicom_file(instance_id):
    try:
        r = requests.get(f"{ORTHANC_URL}/instances/{instance_id}/file", auth=auth_tuple, timeout=80)
        if r.status_code == 200:
            return r.content
        logger.warning(f"DICOM 파일 다운로드 실패: {instance_id}, Status: {r.status_code}, Response: {r.text}")
        return None
    except Exception as e:
        logger.error(f"get_dicom_file 실패: {e}")
        logger.error(traceback.format_exc())
        return None

# 🔥 수정된 save_analysis_result 함수 (dicom_data 매개변수 추가)
def save_analysis_result(instance_id, result_dict, dicom_data=None):
    try:
        # bbox를 x, y, width, height 형식으로 변환하는 헬퍼 함수
        def normalize_bbox(bbox_data):
            logger.debug(f"🔍 normalize_bbox 호출: {bbox_data} (type: {type(bbox_data)})")
            if isinstance(bbox_data, dict):
                # case 1: {'x':..., 'y':..., 'width':..., 'height':...}
                if all(k in bbox_data for k in ['x', 'y', 'width', 'height']):
                    return {
                        "x": int(bbox_data.get("x", 0)),
                        "y": int(bbox_data.get("y", 0)),
                        "width": int(bbox_data.get("width", 0)),
                        "height": int(bbox_data.get("height", 0)),
                    }
                # case 2: {'x1':..., 'y1':..., 'x2':..., 'y2':...}
                elif all(k in bbox_data for k in ['x1', 'y1', 'x2', 'y2']):
                    x1 = bbox_data.get("x1", 0)
                    y1 = bbox_data.get("y1", 0)
                    x2 = bbox_data.get("x2", 0)
                    y2 = bbox_data.get("y2", 0)
                    return {
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(x2 - x1),
                        "height": int(y2 - y1),
                    }
            # case 3: [x1, y1, x2, y2] (list/tuple)
            elif isinstance(bbox_data, (list, tuple)) and len(bbox_data) == 4:
                x1, y1, x2, y2 = bbox_data
                return {
                    "x": int(x1),
                    "y": int(y1),
                    "width": int(x2 - x1),
                    "height": int(y2 - y1),
                }
            # Torchvision Tensor (예: torch.Tensor([[x1,y1,x2,y2]]))
            elif hasattr(bbox_data, 'tolist') and isinstance(bbox_data.tolist(), list) and len(bbox_data.tolist()) == 4:
                x1, y1, x2, y2 = bbox_data.tolist()
                logger.debug(f"🔍 bbox_data가 torch.Tensor 라이크 객체임: {x1, y1, x2, y2}")
                return {
                    "x": int(x1),
                    "y": int(y1),
                    "width": int(x2 - x1),
                    "height": int(y2 - y1),
                }
            
            # 모든 경우에 해당하지 않으면 기본값 반환
            logger.warning(f"⚠️ 알 수 없는 bbox 형식: {bbox_data} (type: {type(bbox_data)}). 기본값 사용.")
            return {"x": 0, "y": 0, "width": 0, "height": 0}
        
        # 🔥 해상도 정보 획득 (이미 추출된 것 우선 사용)
        model_width = result_dict.get("metadata", {}).get("image_width")
        model_height = result_dict.get("metadata", {}).get("image_height")

        # 🔥 DICOM 데이터에서 실제 해상도 추출 (우선순위 높임)
        dicom_width, dicom_height = None, None
        if dicom_data:
            dicom_width, dicom_height = get_image_dimensions_from_data(dicom_data)
        
        # 🔥 우선순위 변경: DICOM 추출 > 모델 제공 > 기본값
        if dicom_width and dicom_height:
            final_width = dicom_width
            final_height = dicom_height
            source = "DICOM"
        elif model_width and model_height:
            final_width = model_width
            final_height = model_height
            source = "Model"
        else:
            # 🔥 기본값도 더 합리적으로 설정
            final_width = 512   # 의료영상 일반적 크기
            final_height = 512
            source = "Default"
            logger.warning(f"⚠️ 해상도 추출 실패, 기본값 사용: {final_width}x{final_height}")
        
        logger.info(f"📐 최종 해상도: {final_width}x{final_height} (출처: {source})")

        
        detections = []
        raw_detections = result_dict.get("detections", [])

        logger.debug(f"🔍 save_analysis_result 시작. raw_detections 타입: {type(raw_detections)}, 내용: {raw_detections}")

        # raw_detections가 리스트인지 확인하고, 아니면 빈 리스트로 처리
        if not isinstance(raw_detections, list):
            if isinstance(raw_detections, str):
                try:
                    raw_detections = json.loads(raw_detections)
                    logger.debug(f"✅ raw_detections 문자열 → dict 파싱됨: {raw_detections}")
                    if not isinstance(raw_detections, list):
                         logger.error(f"❌ 'detections' 키의 값이 JSON 파싱 후에도 리스트가 아닙니다. 실제 타입: {type(raw_detections)}")
                         raw_detections = []
                except json.JSONDecodeError as e:
                    logger.error(f"❌ 'detections' 키의 값이 리스트가 아니며, JSON 파싱 실패: {e} - 원본: '{raw_detections}'")
                    raw_detections = []
                except Exception as e:
                    logger.error(f"❌ 'detections' 키 알 수 없는 파싱 오류: {e} - 원본: '{raw_detections}'")
                    raw_detections = []
            else:
                logger.error(f"❌ 'detections' 키의 값이 리스트가 아닙니다. 실제 타입: {type(raw_detections)}. 빈 리스트로 초기화.")
                raw_detections = []

        for i, item in enumerate(raw_detections):
            logger.debug(f"📦 현재 {i}번째 item: {item} (type: {type(item)})")

            # 문자열일 경우 JSON 파싱 시도 (각 item별로)
            if isinstance(item, str):
                try:
                    item = json.loads(item)
                    logger.debug(f"✅ {i}번째 item 문자열 → dict 파싱됨: {item}")
                except json.JSONDecodeError as e:
                    logger.error(f"❌ {i}번째 item JSON 파싱 실패: {e} - 원본 문자열: '{item}'")
                    continue
                except Exception as e:
                    logger.error(f"❌ {i}번째 item 알 수 없는 파싱 오류: {e} - 원본 문자열: '{item}'")
                    continue

            elif hasattr(item, 'keys') and callable(getattr(item, 'keys')):
                logger.debug(f"✅ {i}번째 item은 dict처럼 보입니다. 키 확인: {list(item.keys())}")
            elif hasattr(item, 'boxes') and hasattr(item, 'labels') and hasattr(item, 'scores'):
                logger.debug(f"✅ {i}번째 item은 모델의 원시 출력 객체 (boxes, labels, scores 포함).")
                continue

            # 여전히 딕셔너리가 아니면 무시
            if not isinstance(item, dict):
                logger.warning(f"⚠️ {i}번째 item이 최종적으로 dict가 아님, 무시: {item} (type: {type(item)})")
                continue

            # bbox 처리 (normalize_bbox 함수 사용)
            normalized_bbox = normalize_bbox(item.get("bbox"))
            if normalized_bbox is None: 
                 logger.warning(f"⚠️ {i}번째 item의 bbox 정규화 실패. 기본값 사용.")
                 normalized_bbox = {"x": 0, "y": 0, "width": 0, "height": 0}

            # 클래스 이름, 확신도, 설명 필드 유연하게 처리
            class_name = item.get("label") or item.get("class_name", "")
            confidence = item.get("confidence_score") or item.get("confidence", 0.0)
            description = item.get("ai_text") or item.get("description", "")
            
            # Ensure confidence is float
            try:
                confidence = float(confidence)
            except (ValueError, TypeError):
                confidence = 0.0
                logger.warning(f"⚠️ {i}번째 item의 confidence 값이 숫자가 아님: {item.get('confidence_score') or item.get('confidence')}. 0.0으로 설정.")

            detections.append({
                "class_name": class_name, 
                "confidence": confidence,
                "bbox": normalized_bbox,
                "description": description
            })

        # 🔥 해상도 정보를 포함한 payload 생성
        payload = {
            "instance_id": instance_id,
            "model_type": result_dict.get("model_type", "unknown"),
            "result": {
                "detections": detections,
                "metadata": {
                    **result_dict.get("metadata", {}),
                    # 🔥 해상도 정보 추가
                    "image_width": final_width,
                    "image_height": final_height,
                    "resolution_source": source  # 해상도 출처 정보
                },
                "processing_time": float(result_dict.get("processing_time", 0.0)),
                # 🔥 최상위 레벨에도 해상도 정보 추가
                "image_width": final_width,
                "image_height": final_height
            }
        }

        url = f"{DJANGO_URL}/api/ai/results/save/"
        headers = {'Content-Type': 'application/json'}

        logger.info(f"📡 Django에 {result_dict.get('model_type', 'unknown')} 분석 결과 전송: {instance_id} (해상도: {final_width}x{final_height})")
        resp = requests.post(url, json=payload, headers=headers, timeout=15)

        if resp.status_code in [200, 201]:
            try:
                response_json = resp.json()
                count = response_json.get('count', 0)
                logger.info(f"✅ {result_dict.get('model_type', 'unknown')} 분석 결과 저장 완료: {count}건, 응답: {response_json}")
                return response_json
            except json.JSONDecodeError:
                logger.info(f"✅ {result_dict.get('model_type', 'unknown')} 분석 결과 저장 완료, Django 응답은 JSON 형식이 아님: {resp.text}")
                return {"status": "success", "message": resp.text}
        else:
            logger.warning(f"⚠️ Django 전송 실패: {resp.status_code} - {resp.text}")
            return {"status": "error", "message": resp.text}

    except Exception as e:
        logger.error(f"🔥 분석 결과 저장 중 예외 발생: {e}")
        logger.error(traceback.format_exc())
        return {"status": "error", "message": str(e)}


def analyze_single_instance(instance_id):
    instance_info = get_instance_info(instance_id)
    if not instance_info:
        raise Exception("Instance not found")

    dicom_data = get_dicom_file(instance_id)
    if not dicom_data:
        raise Exception("DICOM file download failed")

    # 해상도 정보 미리 추출
    image_width, image_height = get_image_dimensions_from_data(dicom_data)

    modality = instance_info['MainDicomTags'].get('Modality', 'UNKNOWN')
    results = ai_analyzer.analyze_dicom_data(dicom_data, modality)
    
    # 결과가 리스트인지 확인 (analyze_dicom_data는 리스트 반환)
    if not isinstance(results, list):
        results = [results]
    
    # 각 결과에 해상도 정보 추가하고 저장
    for result in results:
        if result and result.get('success'):
            # 해상도 정보 추가
            result['metadata'] = result.get('metadata', {})
            result['metadata']['image_width'] = image_width
            result['metadata']['image_height'] = image_height
            
            save_analysis_result(instance_id, result, dicom_data)
        else:
            raise Exception(f"AI analysis failed: {result.get('error', 'unknown') if result else 'No result'}")

    return results[0] if len(results) == 1 else results


@app.route('/analyze-study/<study_uid>', methods=['POST'])
def analyze_study_by_uid(study_uid):
    """
    StudyInstanceUID (DICOM UID)로부터 분석 실행 (프론트엔드 대응)
    """
    try:
        logger.info(f"📩 studyUID 분석 요청 도착: {study_uid}")
        
        # 1. study_uid → 내부 Orthanc Study ID 조회
        find_url = f"{ORTHANC_URL}/tools/find"
        query = {
            "Level": "Study",
            "Query": {
                "StudyInstanceUID": study_uid
            }
        }
        find_response = requests.post(find_url, auth=auth_tuple, json=query, timeout=10)
        if find_response.status_code != 200 or not find_response.json():
            logger.error(f"❌ studyUID {study_uid} 에 해당하는 스터디를 찾을 수 없음")
            return jsonify({"error": "Study UID not found in Orthanc"}), 404

        orthanc_study_id = find_response.json()[0]
        logger.info(f"✅ studyUID → 내부 Orthanc ID 매핑 성공: {orthanc_study_id}")

        # 2. 해당 스터디의 인스턴스 조회
        series_list = requests.get(f"{ORTHANC_URL}/studies/{orthanc_study_id}/series", auth=auth_tuple).json()
        if not series_list:
            return jsonify({'error': 'No series found in study'}), 404

        instance_ids = []
        for series in series_list:
            series_id = series.get("ID")
            instances = requests.get(f"{ORTHANC_URL}/series/{series_id}/instances", auth=auth_tuple).json()
            instance_ids.extend([inst["ID"] for inst in instances])

        if not instance_ids:
            return jsonify({'error': 'No instances found in study'}), 404

        logger.info(f"🔍 총 {len(instance_ids)}개의 인스턴스를 분석합니다")

        # 3. 각 인스턴스를 분석
        all_results = []
        for instance_id in instance_ids:
            try:
                result = analyze_single_instance(instance_id)
                all_results.append({
                    "instance_id": instance_id,
                    "result": result
                })
            except Exception as e:
                logger.warning(f"⚠️ 인스턴스 분석 실패: {instance_id}, 원인: {e}")

        return jsonify({
            "study_uid": study_uid,
            "orthanc_study_id": orthanc_study_id,
            "analyzed_instances": len(all_results),
            "results": all_results
        })

    except Exception as e:
        logger.error(f"🔥 Study 분석 실패: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info("🚀 Flask 서버 시작됨 - 포트 5000, 디버깅 모드 비활성화")
    app.run(host="0.0.0.0", port=5000, debug=False)
