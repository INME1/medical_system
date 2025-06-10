# ocs/models.py
from django.db import models

class LISLog(models.Model):
    STEP_CHOICES = [
        ('order', '오더 생성'),
        ('sample', '샘플 등록'),
        ('result', '결과 등록'),
    ]

    step = models.CharField(max_length=10, choices=STEP_CHOICES)
    patient_id = models.CharField(max_length=100)
    doctor_id = models.CharField(max_length=100, null=True, blank=True)
    order_id = models.CharField(max_length=100, null=True, blank=True)
    sample_id = models.CharField(max_length=100, null=True, blank=True)

    request_detail = models.TextField(blank=True)  # 오더/샘플 상세
    result_detail = models.TextField(blank=True)   # 결과 상세

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_step_display()}] {self.patient_id} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
