# # ocs/models.py
# from django.db import models

# class OCSLog(models.Model):
#     # ── 기존 STEP_CHOICES(=action) 재사용 ──
#     STEP_CHOICES = [
#         ('order', '오더 생성'),
#         ('sample', '샘플 등록'),
#         ('result', '결과 등록'),
#     ]

#     # ── 새로 추가 ──
#     CATEGORY_CHOICES = [
#         ('LIS',      'LIS'),
#         ('PACS',     'PACS'),
#         ('LOGIN',    'Login'),
#         ('EMR',      'EMR'),
#         ('WORKLIST', 'Worklist'),
#     ]
#     category      = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
#     patient_uuid  = models.CharField(max_length=36, blank=True, null=True)
#     doctor_uuid   = models.CharField(max_length=36, blank=True, null=True)
#     detail        = models.JSONField(blank=True, null=True)
    
#     step         = models.CharField(max_length=10, choices=STEP_CHOICES)
#     patient_id   = models.CharField(max_length=100)  # numeric ID(legacy)
#     doctor_id    = models.CharField(max_length=100, null=True, blank=True)  # legacy

#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"[{self.category}/{self.get_step_display()}] {self.patient_id} @ {self.created_at:%Y-%m-%d %H:%M:%S}"

# backend/ocs/models.py
from django.db import models
import uuid

class OCSLog(models.Model):
    """
    실제 로그를 저장하는 모델
    """
    timestamp  = models.DateTimeField(auto_now_add=True)
    patient_id = models.UUIDField(null=True, blank=True)
    doctor_id  = models.UUIDField(null=True, blank=True)
    raw_data   = models.JSONField(help_text="요청 payload 전체")  # 형식 구애 없이 다 저장
    system     = models.CharField(max_length=50, default='OCS-Integration')

    class Meta:
        ordering = ['-timestamp']
