# backend/statisticsboard/apps.py

from django.apps import AppConfig

class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'statisticsboard'
    verbose_name = 'EMR 대시보드'