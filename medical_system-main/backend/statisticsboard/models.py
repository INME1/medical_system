# backend/dashboard/statisticsboard.py

from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta

class DashboardStats(models.Model):
    """대시보드 통계 캐시 모델"""
    stat_type = models.CharField(max_length=50)  # 'main_stats', 'patient_distribution', etc.
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['stat_type']
