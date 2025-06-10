from django.db import models
from django.utils import timezone

class TestOrder(models.Model):
    order_id = models.CharField(max_length=100, default='UNKNOWN')  # order_id 필드 추가
    patient_id = models.CharField(max_length=50)
    doctor_id = models.CharField(max_length=50)
    test_type = models.CharField(max_length=50)
    order_date = models.DateTimeField()
