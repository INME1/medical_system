from celery import shared_task
import logging
from ultralytics import YOLO
import requests
import numpy as np
from PIL import Image
import io

logger = logging.getLogger(__name__)

@shared_task
def analyze_cxr_real(study_uid, patient_id):
    """실제 YOLO 모델로 CXR 분석"""
    
    try:
        logger.info(f"🫁 실제 CXR 분석 시작: {patient_id}")
        
        # 1. YOLO 모델 로드
        model_path = "C:/path/to/your/yolo_model.pt"  # 실제 경로로 수정
        model = YOLO(model_path)
        
        # 2. Orthanc에서 이미지 가져오기
        image = get_image_from_orthanc(study_uid)
        
        # 3. YOLO 추론
        results = model(image)
        
        # 4. 결과 저장
        from .models import AIAnalysisResult
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # DB에 저장
                    AIAnalysisResult.objects.create(
                        patient_id=patient_id,
                        study_uid=study_uid,
                        series_uid=f"{study_uid}.1",
                        instance_uid=f"{study_uid}.1.1",
                        instance_number=1,
                        label=model.names[class_id],  # 실제 클래스명
                        bbox=[int(x1), int(y1), int(x2), int(y2)],
                        confidence_score=confidence,
                        ai_text=f"{model.names[class_id]} 검출",
                        modality="CR", 
                        model_name="YOLOv8_CXR",
                        model_version="custom",
                        image_width=int(image.width),
                        image_height=int(image.height),
                        processing_time=1.0
                    )
        
        logger.info(f"✅ 실제 분석 완료: {patient_id}")
        return "실제 분석 완료"
        
    except Exception as e:
        logger.error(f"❌ 분석 실패: {e}")
        raise

def get_image_from_orthanc(study_uid):
    """Orthanc에서 이미지 가져오기"""
    
    orthanc_url = "http://localhost:8042"
    auth = ("orthanc", "orthanc")
    
    # 스터디의 첫 번째 인스턴스 가져오기
    instances = requests.get(f"{orthanc_url}/studies/{study_uid}/instances", auth=auth).json()
    first_instance = instances[0]['ID']
    
    # PNG로 변환된 이미지 가져오기
    image_data = requests.get(f"{orthanc_url}/instances/{first_instance}/preview", auth=auth)
    
    # PIL Image로 변환
    image = Image.open(io.BytesIO(image_data.content))
    return image