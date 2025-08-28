from django.db import models
from django.utils import timezone

class WebhookEvent(models.Model):
    """Orthanc Webhook 이벤트 로그"""
    
    # 기본 이벤트 정보
    event_type = models.CharField(max_length=50, default='study_complete')
    study_uid = models.CharField(max_length=255, help_text="StudyInstanceUID")
    patient_id = models.CharField(max_length=100, help_text="환자 ID")
    modality = models.CharField(max_length=10, help_text="CT, MR 등")
    
    # 처리 상태
    status = models.CharField(
        max_length=20, 
        default='received',
        choices=[
            ('received', '수신됨'),
            ('processing', '처리중'),
            ('completed', '완료'),
            ('failed', '실패'),
        ]
    )
    
    # 시간 정보
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # 기술적 정보
    celery_task_id = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    orthanc_payload = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'webhook_events'
        ordering = ['-received_at']
    
    def __str__(self):
        return f"{self.patient_id} - {self.modality} - {self.status}"