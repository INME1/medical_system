from django.db import models
from django.conf import settings

class DrReport(models.Model):
    # 판독 상태 선택지
    STATUS_CHOICES = [
        ('draft', '초안'),
        ('completed', '완료'),
        ('approved', '승인')
    ]
    
    # 기본 식별자
    id = models.AutoField(primary_key=True)
    
    # 환자 및 스터디 정보
    patient_id = models.CharField(max_length=100, help_text="환자 ID (PACS에서 가져옴)")
    study_uid = models.CharField(
        max_length=255, 
        unique=True,  # study_uid당 하나의 레포트만
        db_index=True, 
        help_text="StudyInstanceUID"
    )
    
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
    
    # 레포트 내용
    dr_report = models.TextField(blank=True, help_text="판독 소견")
    report_status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft',
        help_text="판독 상태"
    )
    
    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dr_reports'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['study_uid']),
            models.Index(fields=['patient_id']),
            models.Index(fields=['doctor_id']),
            models.Index(fields=['report_status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Report - {self.patient_id} ({self.get_report_status_display()}) - {self.study_uid[:20]}..."
    
    def __repr__(self):
        return f"<DrReport: {self.id} - {self.patient_id} - {self.report_status}>"
    
    @property
    def is_draft(self):
        """초안 상태인지 확인"""
        return self.report_status == 'draft'
    
    @property
    def is_completed(self):
        """완료 상태인지 확인"""
        return self.report_status == 'completed'
    
    @property
    def is_approved(self):
        """승인 상태인지 확인"""
        return self.report_status == 'approved'
    
    def get_status_color(self):
        """상태에 따른 색상 반환 (관리자 페이지용)"""
        colors = {
            'draft': '#6c757d',      # 회색
            'completed': '#28a745',  # 초록색
            'approved': '#007bff'    # 파란색
        }
        return colors.get(self.report_status, '#6c757d')