from django.db import models
from django.conf import settings

class AnnotationResult(models.Model):
    # 기본 식별자
    id = models.AutoField(primary_key=True)
    
    # 환자 및 스터디 정보
    patient_id = models.CharField(max_length=100, help_text="환자 ID (PACS에서 가져옴)")
    study_uid = models.CharField(max_length=255, db_index=True, help_text="StudyInstanceUID")
    series_uid = models.CharField(max_length=255, blank=True, null=True, help_text="SeriesInstanceUID")
    instance_uid = models.CharField(max_length=255, blank=True, null=True, help_text="InstanceUID (슬라이스 고유 ID)")
    instance_number = models.IntegerField(blank=True, null=True, help_text="인스턴스 넘버(이미지 인덱스)")
    
    # 판독의 정보 (하드코딩)
    doctor_id = models.CharField(
        max_length=50, 
        default=getattr(settings, 'DEFAULT_DOCTOR_ID', 'DR001'),
        help_text="판독의 ID"
    )
    doctor_name = models.CharField(
        max_length=100, 
        default=getattr(settings, 'DEFAULT_DOCTOR_NAME', '김영상'),
        help_text="판독의 이름"
    )
    
    # 어노테이션 데이터
    label = models.CharField(max_length=100, help_text="의사가 마킹한 라벨")
    bbox = models.JSONField(help_text="바운딩박스 좌표 [x1, y1, x2, y2]")
    dr_text = models.TextField(blank=True, null=True, help_text="선택적 코멘트 (의견, 진단 등)")
    
    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dr_annotations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['study_uid']),
            models.Index(fields=['series_uid']),
            models.Index(fields=['instance_uid']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['doctor_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.label} - {self.patient_id} ({self.study_uid[:20]}...)"
    
    def __repr__(self):
        return f"<AnnotationResult: {self.id} - {self.label}>"