#!/usr/bin/env python3
"""
Orthanc Python Plugin for AI Analysis
DICOM 이미지 저장 시 자동으로 AI 모델을 통한 분석 수행
"""
import orthanc
import json
import sys
import os
import logging
from datetime import datetime
import importlib.util

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/orthanc_ai.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('OrthancAI')

# 모델 경로 설정
MODELS_PATH = '//home/medical_system/backend/ai_models'
YOLO_MODEL_PATH = os.path.join(MODELS_PATH, 'yolov8', 'yolov8_inference.py')
SSD_MODEL_PATH = os.path.join(MODELS_PATH, 'ssd', 'ssd_inference.py')

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
    
    def analyze_dicom(self, dicom_path, modality, body_part):
        """
        DICOM 이미지 분석
        Args:
            dicom_path: DICOM 파일 경로
            modality: 촬영 방식 (CT, MR, CR, etc.)
            body_part: 촬영 부위
        Returns:
            dict: 분석 결과
        """
        try:
            # 모달리티와 부위에 따른 모델 선택
            model_type = self._select_model(modality, body_part)
            
            if model_type == 'yolo' and self.yolo_module:
                result = self.yolo_module.analyze(dicom_path)
                logger.info(f"YOLO 분석 완료: {len(result.get('detections', []))}개 객체 검출")
                
            elif model_type == 'ssd' and self.ssd_module:
                result = self.ssd_module.analyze(dicom_path)
                logger.info(f"SSD 분석 완료: {len(result.get('detections', []))}개 객체 검출")
                
            else:
                logger.warning(f"사용 가능한 모델이 없습니다. 모달리티: {modality}, 부위: {body_part}")
                return self._create_empty_result()
            
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
        """모달리티와 부위에 따라 적절한 모델 선택"""
        # 간단한 규칙 기반 모델 선택
        # 실제 운영에서는 더 복잡한 로직 구현 가능
        
        if modality in ['CT', 'MR']:
            if 'CHEST' in body_part.upper() or 'LUNG' in body_part.upper():
                return 'yolo'  # 흉부 영상은 YOLO 사용
            else:
                return 'ssd'   # 기타 부위는 SSD 사용
        elif modality in ['CR', 'DX']:
            return 'yolo'      # X-ray는 YOLO 사용
        else:
            return 'ssd'       # 기본값은 SSD
    
    def _create_empty_result(self):
        """빈 결과 생성"""
        return {
            'success': True,
            'detections': [],
            'message': '분석할 수 있는 모델이 없습니다.'
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

def OnStoredInstance(receivedDicom, tags, metadata, origin):
    """
    DICOM 인스턴스가 저장될 때 호출되는 콜백 함수
    """
    try:
        instance_id = receivedDicom['ID']
        logger.info(f"새로운 DICOM 인스턴스 저장됨: {instance_id}")
        
        # DICOM 태그에서 정보 추출
        modality = tags.get('Modality', 'UNKNOWN')
        body_part = tags.get('BodyPartExamined', 'UNKNOWN')
        patient_id = tags.get('PatientID', 'UNKNOWN')
        study_date = tags.get('StudyDate', 'UNKNOWN')
        
        logger.info(f"분석 시작 - Patient: {patient_id}, Modality: {modality}, Body Part: {body_part}")
        
        # DICOM 파일 경로 구성 (Orthanc 내부 경로)
        dicom_path = f"/var/lib/orthanc/db/{instance_id}"
        
        # AI 분석 수행
        analysis_result = ai_analyzer.analyze_dicom(dicom_path, modality, body_part)
        
        # 분석 결과를 인스턴스 메타데이터에 저장
        if analysis_result['success']:
            # 결과를 JSON 문자열로 변환하여 저장
            result_json = json.dumps(analysis_result)
            
            # Orthanc API를 통해 메타데이터 저장
            orthanc.RestApiPut(f'/instances/{instance_id}/metadata/1024', result_json)
            orthanc.RestApiPut(f'/instances/{instance_id}/metadata/1025', analysis_result['metadata']['model_used'])
            orthanc.RestApiPut(f'/instances/{instance_id}/metadata/1026', analysis_result['metadata']['analysis_timestamp'])
            orthanc.RestApiPut(f'/instances/{instance_id}/metadata/1027', str(len(analysis_result.get('detections', []))))
            
            logger.info(f"AI 분석 완료 및 저장됨: {instance_id}")
        else:
            logger.error(f"AI 분석 실패: {instance_id}, 오류: {analysis_result.get('error', 'Unknown error')}")
            
    except Exception as e:
        logger.error(f"OnStoredInstance 콜백 처리 중 오류 발생: {str(e)}")

def OnChange(changeType, level, resource):
    """
    Orthanc 리소스 변경 시 호출되는 콜백 함수
    """
    if changeType == orthanc.ChangeType.STABLE_STUDY:
        logger.info(f"Study가 안정화됨: {resource}")
    elif changeType == orthanc.ChangeType.NEW_INSTANCE:
        logger.info(f"새로운 인스턴스 생성: {resource}")

def GetAnalysisResult(output, uri, **request):
    """
    분석 결과를 조회하는 REST API 엔드포인트
    URL: /ai-analysis/{instance-id}
    """
    try:
        # URI에서 인스턴스 ID 추출
        parts = uri.split('/')
        if len(parts) < 3:
            output.AnswerBuffer("Invalid URI", "text/plain", 400)
            return
        
        instance_id = parts[2]
        
        # 메타데이터에서 분석 결과 조회
        try:
            result_json = orthanc.RestApiGet(f'/instances/{instance_id}/metadata/1024')
            model_used = orthanc.RestApiGet(f'/instances/{instance_id}/metadata/1025')
            timestamp = orthanc.RestApiGet(f'/instances/{instance_id}/metadata/1026')
            detection_count = orthanc.RestApiGet(f'/instances/{instance_id}/metadata/1027')
            
            # 응답 데이터 구성
            response = {
                'instance_id': instance_id,
                'analysis_result': json.loads(result_json),
                'model_used': model_used,
                'analysis_timestamp': timestamp,
                'detection_count': int(detection_count)
            }
            
            output.AnswerBuffer(json.dumps(response, indent=2), "application/json")
            
        except Exception as e:
            if "404" in str(e):
                output.AnswerBuffer(json.dumps({
                    'error': 'Analysis result not found for this instance',
                    'instance_id': instance_id
                }), "application/json", 404)
            else:
                raise e
                
    except Exception as e:
        logger.error(f"GetAnalysisResult API 오류: {str(e)}")
        output.AnswerBuffer(json.dumps({
            'error': str(e)
        }), "application/json", 500)

# Orthanc 플러그인 초기화 시 REST API 등록
orthanc.RegisterRestCallback('/ai-analysis/(.*)', GetAnalysisResult)

logger.info("Orthanc AI Plugin 초기화 완료")