from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_study_now, name='analyze_now'),           # YOLO
    path('analyze-ssd/', views.analyze_with_ssd, name='analyze_ssd'),        # SSD
    path('results/<str:study_uid>/', views.get_analysis_results, name='get_results'),
    path('clear/<str:study_uid>/', views.clear_results, name='clear_results'),
    path('status/', views.model_status, name='model_status'),
    path('check/<str:study_uid>/<str:model_type>/', views.check_existing_analysis, name='check_existing_analysis'),
    path('pacs-studies/', views.get_pacs_studies, name='get_pacs_studies'),  # 이 줄만 추가
    path('results/save/', views.save_analysis_result, name='save_analysis_result'),  # ✅ 이 줄 추가
]