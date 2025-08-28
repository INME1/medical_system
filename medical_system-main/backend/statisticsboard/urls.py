# backend/statisticsboard/urls.py

from django.urls import path
from . import views

app_name = 'statisticsboard'

urlpatterns = [
    # 개별 API 엔드포인트
    path('main-stats/', views.get_main_stats, name='main_stats'),
    path('patient-distribution/', views.get_patient_distribution, name='patient_distribution'),
    path('doctor-stats/', views.get_doctor_stats, name='doctor_stats'),
    path('room-stats/', views.get_room_stats, name='room_stats'),
    path('exam-stats/', views.get_exam_stats, name='exam_stats'),
    path('ai-stats/', views.get_ai_stats, name='ai_stats'),
    
    # 통합 API
    path('all/', views.get_all_statisticsboard_data, name='all_statisticsboard_data'),
]