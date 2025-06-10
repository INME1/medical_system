# ocs/urls.py
from django.urls import path
from .views import create_log_view, get_logs_view, LISLogListAPIView, combined_log_view  

urlpatterns = [
    # 로그 생성 (POST)
    path('create/', create_log_view, name='create_log'),
    # 로그 목록 조회 (GET, 필터 포함)
    path('', get_logs_view, name='get_logs'),
    # 클래스 기반 조회 API
    path('list/', LISLogListAPIView.as_view(), name='log_list'),

    path('combined/', combined_log_view, name='combined_log_view'),
]

