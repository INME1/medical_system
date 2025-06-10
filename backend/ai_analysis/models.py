from django.db import models
from django.utils import timezone

class AIAnalysisResult(models.Model):
    """AI 분석 결과 (바운딩박스)"""
    
    # 환자/스터디 정보
    patient_id = models.CharField(max_length=100)
    study_uid = models.CharField(max_length=255)
    series_uid = models.CharField(max_length=255)
    instance_uid = models.CharField(max_length=255)
    instance_number = models.IntegerField()
    
    # AI 결과
    label = models.CharField(max_length=50)  # pneumonia, nodule 등
    bbox = models.JSONField()  # [x1, y1, x2, y2]
    confidence_score = models.FloatField()
    ai_text = models.TextField(blank=True)
    
    # 메타데이터  
    modality = models.CharField(max_length=10)
    model_name = models.CharField(max_length=100)
    model_version = models.CharField(max_length=50)
    image_width = models.IntegerField()
    image_height = models.IntegerField()
    processing_time = models.FloatField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_analysis_results'
    
    def __str__(self):
        return f"{self.patient_id} - {self.label}"