# backend/medical_integration/simclr_urls.py
# SimCLR API 전용 URL 패턴 (분리)

from django.urls import path
from . import simclr_views

app_name = 'simclr'

urlpatterns = [
    # 🔥 React에서 호출하는 정확한 경로
    path('simclr/', simclr_views.simclr_patch_analysis, name='simclr_analysis'),
    path('simclr/status/', simclr_views.simclr_model_status, name='simclr_status'),
    path('simclr/reload/', simclr_views.reload_simclr_model, name='simclr_reload'),
    path('simclr/history/', simclr_views.simclr_analysis_history, name='simclr_history'),
]