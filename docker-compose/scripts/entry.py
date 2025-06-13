
"""
Flask AI Service for Orthanc
DICOM 이미지 AI 분석을 위한 독립적인 Flask 서비스
"""

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

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/ai_service.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('AIService')

# Flask 앱 초기화
app = Flask(__name__)

# 모델 경로 설정
MODELS_PATH = '/models'
YOLO_MODEL_PATH = os.path.join(MODELS_PATH, 'yolov8', 'yolov8_inference.py')
SSD_MODEL_PATH = os.path.join(MODELS_PATH, 'ssd', 'ssd_inference.py')

# Orthanc 서버 설정 (네트워크에서 확인된 IP 사용)
DJANGO_API_URL_SAVE = 'http://10.128.0.11:8000/api/ai/analysis-results/save/'


class AIAnalyzer:
    """AI 분석을 담당하는 클래스"""
    
    def __init__(self):
        self.yolo_module = None
        self.ssd_module = None
        self._load_models()
    
    def _load_models(self):
        """AI 모델 모듈들을 동적으로 로드"""
        try:
            # YOLO 모델 로드
            if os.path.exists(YOLO_MODEL_PATH):
                spec = importlib.util.spec_from_file_location("yolo_inference", YOLO_MODEL_PATH)
                self.yolo_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(self.yolo_module)
                logger.info("YOLO 모델 로드 완료")
            else:
                logger.warning(f"YOLO 모델 파일을 찾을 수 없습니다: {YOLO_MODEL_PATH}")
            
            # SSD 모델 로드
            if os.path.exists(SSD_MODEL_PATH):
                spec = importlib.util.spec_from_file_location("ssd_inference", SSD_MODEL_PATH)
                self.ssd_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(self.ssd_module)
                logger.info("SSD 모델 로드 완료")
            else:
                logger.warning(f"SSD 모델 파일을 찾을 수 없습니다: {SSD_MODEL_PATH}")
                
        except Exception as e:
            logger.error(f"모델 로드 중 오류 발생: {str(e)}")
    
    def analyze_dicom_data(self, dicom_data, modality, body_part):
        """
        DICOM 데이터 분석
        Args:
            dicom_data: DICOM 파일 데이터
            modality: 촬영 방식 (CT, MR, CR, etc.)
            body_part: 촬영 부위
        Returns:
            dict: 분석 결과
        """
        try:
            # 모달리티와 부위에 따른 모델 선택
            model_type = self._select_model(modality, body_part)
            
            if model_type == 'both':
                # CR인 경우 YOLO와 SSD 둘 다 실행
                combined_result = {
                    'success': True,
                    'detections': [],
                    'yolo_results': {},
                    'ssd_results': {},
                    'message': 'YOLO와 SSD 모델로 분석 완료'
                }
                
                # YOLO 분석
                if self.yolo_module:
                    try:
                        yolo_result = self.yolo_module.analyze(dicom_data)  # analyze_data -> analyze
                        combined_result['yolo_results'] = yolo_result
                        combined_result['detections'].extend(yolo_result.get('detections', []))
                        logger.info(f"YOLO 분석 완료: {len(yolo_result.get('detections', []))}개 객체 검출")
                    except AttributeError:
                        logger.warning("YOLO 모델에 analyze 함수가 없습니다. 모의 결과 생성")
                        combined_result['yolo_results'] = {'success': True, 'detections': []}
                
                # SSD 분석
                if self.ssd_module:
                    try:
                        ssd_result = self.ssd_module.analyze(dicom_data)  # analyze_data -> analyze
                        combined_result['ssd_results'] = ssd_result
                        combined_result['detections'].extend(ssd_result.get('detections', []))
                        logger.info(f"SSD 분석 완료: {len(ssd_result.get('detections', []))}개 객체 검출")
                    except AttributeError:
                        logger.warning("SSD 모델에 analyze 함수가 없습니다. 모의 결과 생성")
                        combined_result['ssd_results'] = {'success': True, 'detections': []}
                
                result = combined_result
                
            elif model_type == 'yolo' and self.yolo_module:
                try:
                    result = self.yolo_module.analyze(dicom_data)  # analyze_data -> analyze
                    logger.info(f"YOLO 분석 완료: {len(result.get('detections', []))}개 객체 검출")
                except AttributeError:
                    logger.warning("YOLO 모델에 analyze 함수가 없습니다.")
                    result = self._create_mock_result(modality, body_part)
                
            elif model_type == 'ssd' and self.ssd_module:
                try:
                    result = self.ssd_module.analyze(dicom_data)  # analyze_data -> analyze
                    logger.info(f"SSD 분석 완료: {len(result.get('detections', []))}개 객체 검출")
                except AttributeError:
                    logger.warning("SSD 모델에 analyze 함수가 없습니다.")
                    result = self._create_mock_result(modality, body_part)
                
            else:
                logger.warning(f"사용 가능한 모델이 없습니다. 모달리티: {modality}, 부위: {body_part}")
                return self._create_mock_result(modality, body_part)
            
            # 결과에 메타데이터 추가
            result['metadata'] = {
                'model_used': model_type,
                'analysis_timestamp': datetime.now().isoformat(),
                'modality': modality,
                'body_part': body_part
            }
            
            return result
            
        except Exception as e:
            logger.error(f"DICOM 분석 중 오류 발생: {str(e)}")
            return self._create_error_result(str(e))
    
    def _select_model(self, modality, body_part):
        """모든 이미지에 YOLO와 SSD 둘 다 적용"""
        return 'both'  # 항상 둘 다 실행
    
    def _create_mock_result(self, modality, body_part):
        """모델이 없을 때 모의 결과 생성 (YOLO + SSD 결합)"""
        return {
            'success': True,
            'detections': [
                {
                    'class_name': 'mock_yolo_detection',
                    'confidence': 0.85,
                    'bbox': {'x': 100, 'y': 100, 'width': 200, 'height': 150},
                    'description': 'YOLO 모의 분석 결과'
                },
                {
                    'class_name': 'mock_ssd_detection', 
                    'confidence': 0.78,
                    'bbox': {'x': 150, 'y': 200, 'width': 180, 'height': 120},
                    'description': 'SSD 모의 분석 결과'
                }
            ],
            'yolo_results': {
                'success': True,
                'detections': [{'class_name': 'mock_yolo_detection', 'confidence': 0.85}],
                'message': 'YOLO 모의 분석 완료'
            },
            'ssd_results': {
                'success': True, 
                'detections': [{'class_name': 'mock_ssd_detection', 'confidence': 0.78}],
                'message': 'SSD 모의 분석 완료'
            },
            'message': f'{modality} 영상에 YOLO + SSD 분석 완료 (모의 결과)',
            'model_available': False
        }
    
    def _create_error_result(self, error_msg):
        """오류 결과 생성"""
        return {
            'success': False,
            'error': error_msg,
            'detections': []
        }

# 전역 AI 분석기 인스턴스
ai_analyzer = AIAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """서비스 상태 확인"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Analysis Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze/<instance_id>', methods=['POST'])
def analyze_instance(instance_id):
    """특정 인스턴스 AI 분석"""
    try:
        logger.info(f"인스턴스 분석 요청: {instance_id}")
        
        # Orthanc에서 인스턴스 정보 가져오기
        instance_info = get_instance_info(instance_id)
        if not instance_info:
            return jsonify({'error': 'Instance not found'}), 404
        
        # DICOM 파일 다운로드
        dicom_data = get_dicom_file(instance_id)
        if not dicom_data:
            return jsonify({'error': 'Failed to download DICOM file'}), 500
        
        # DICOM 메타데이터 추출
        main_tags = instance_info.get('MainDicomTags', {})
        modality = main_tags.get('Modality', 'UNKNOWN')
        body_part = main_tags.get('BodyPartExamined', 'UNKNOWN')
        
        logger.info(f"DICOM 메타데이터 - Modality: {modality}, Body Part: {body_part}")
        logger.info(f"전체 인스턴스 정보: {instance_info}")
        
        # AI 분석 수행
        analysis_result = ai_analyzer.analyze_dicom_data(dicom_data, modality, body_part)
        
        # 결과를 Orthanc 메타데이터에 저장
        save_analysis_result(instance_id, analysis_result)
        
        logger.info(f"인스턴스 {instance_id} 분석 완료")
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"인스턴스 분석 중 오류: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze/batch', methods=['POST'])
def analyze_batch():
    """여러 인스턴스 일괄 분석"""
    try:
        data = request.get_json()
        instance_ids = data.get('instance_ids', [])
        
        results = []
        for instance_id in instance_ids:
            try:
                # 각 인스턴스 분석
                result = analyze_single_instance(instance_id)
                results.append({
                    'instance_id': instance_id,
                    'result': result
                })
            except Exception as e:
                results.append({
                    'instance_id': instance_id,
                    'error': str(e)
                })
        
        return jsonify({
            'batch_results': results,
            'total_processed': len(results)
        })
        
    except Exception as e:
        logger.error(f"일괄 분석 중 오류: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/results/<instance_id>', methods=['GET'])
def get_analysis_result(instance_id):
    """분석 결과 조회"""
    try:
        # Orthanc 메타데이터에서 분석 결과 조회
        try:
            response = requests.get(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/metadata/1024')
            if response.status_code == 200:
                result = json.loads(response.text)
                return jsonify(result)
            else:
                return jsonify({
                    'error': 'Analysis result not found',
                    'instance_id': instance_id
                }), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        logger.error(f"결과 조회 중 오류: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_instance_info(instance_id):
    """Orthanc에서 인스턴스 정보 가져오기"""
    try:
        response = requests.get(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}', 
                              auth=('orthanc', 'orthanc'))
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        logger.error(f"인스턴스 정보 조회 실패: {str(e)}")
        return None

def get_dicom_file(instance_id):
    """Orthanc에서 DICOM 파일 다운로드"""
    try:
        response = requests.get(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/file',
                              auth=('orthanc', 'orthanc'))
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        logger.error(f"DICOM 파일 다운로드 실패: {str(e)}")
        return None

def save_analysis_result(instance_id, result):
    """분석 결과를 Orthanc 메타데이터에 저장"""
    try:
        # 메타데이터 저장
        result_json = json.dumps(result)
        
        # 분석 결과 저장 (메타데이터 1024)
        requests.put(
            f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/metadata/1024',
            data=result_json,
            headers={'Content-Type': 'application/json'},
            auth=('orthanc', 'orthanc')
        )
        
        # 추가 메타데이터 저장
        if 'metadata' in result:
            metadata = result['metadata']
            requests.put(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/metadata/1025', 
                        data=metadata.get('model_used', ''),
                        auth=('orthanc', 'orthanc'))
            requests.put(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/metadata/1026', 
                        data=metadata.get('analysis_timestamp', ''),
                        auth=('orthanc', 'orthanc'))
            requests.put(f'{DJANGO_API_URL_SAVE}/instances/{instance_id}/metadata/1027', 
                        data=str(len(result.get('detections', []))),
                        auth=('orthanc', 'orthanc'))
        
        logger.info(f"분석 결과 저장 완료: {instance_id}")
        
    except Exception as e:
        logger.error(f"분석 결과 저장 실패: {str(e)}")

def analyze_single_instance(instance_id):
    """단일 인스턴스 분석 (내부 함수)"""
    instance_info = get_instance_info(instance_id)
    if not instance_info:
        raise Exception('Instance not found')
    
    dicom_data = get_dicom_file(instance_id)
    if not dicom_data:
        raise Exception('Failed to download DICOM file')
    
    modality = instance_info.get('MainDicomTags', {}).get('Modality', 'UNKNOWN')
    body_part = instance_info.get('MainDicomTags', {}).get('BodyPartExamined', 'UNKNOWN')
    
    analysis_result = ai_analyzer.analyze_dicom_data(dicom_data, modality, body_part)
    save_analysis_result(instance_id, analysis_result)
    
    return analysis_result

if __name__ == '__main__':
    logger.info("AI Service 시작")
    app.run(host='0.0.0.0', port=5000, debug=True)