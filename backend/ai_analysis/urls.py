
from django.urls import path
from . import views 
from .views import AIAnalysisResultSaveAPIView # AIAnalysisResultSaveAPIView는 POST 처리

urlpatterns = [
    path('analyze/', views.analyze_study_now, name='analyze_now'),
    path('analyze-ssd/', views.analyze_with_ssd, name='analyze_ssd'),
    
    # POST 요청 (AI 분석 결과 저장)
    path('results/save/', AIAnalysisResultSaveAPIView.as_view(), name='AIAnalysisResultSaveAPIView'),
    
    # AI 분석 결과 조회 (GET 요청) - 이 부분을 수정합니다.
    # 기존: path('results/save/<str:study_uid>/', views.get_analysis_results, name='get_results'),
    # 수정: 'save/' 부분을 제거하여 프론트엔드 요청 URL과 일치시킵니다.
    path('results/<str:study_uid>/', views.get_analysis_results, name='get_results'), # <-- 이 줄 수정!
    
    # 나머지 URL들은 그대로 둡니다.
    path('clear/<str:study_uid>/', views.clear_results, name='clear_results'),
    path('status/', views.model_status, name='model_status'),
    path('check/<str:study_uid>/<str:model_type>/', views.check_existing_analysis, name='check_existing_analysis'),
    path('pacs-studies/', views.get_pacs_studies, name='get_pacs_studies'), 
]