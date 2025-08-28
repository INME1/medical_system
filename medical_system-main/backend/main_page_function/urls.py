# backend/main_page_function/urls.py (업데이트)

from django.urls import path
from . import views

app_name = 'main_page_function'

urlpatterns = [

    
    # 메인 페이지 데이터
    path('main-data/', views.get_main_page_data, name='main_page_data'),
    
    # 공지사항 관련 (기존)
    path('notices/', views.get_notices, name='notices'),
    path('notices/create/', views.create_notice, name='create_notice'),
    
    # 공지사항 게시판 (새로 추가)
    path('notices/board/', views.get_notices_board, name='notices_board'),
    path('notices/<int:notice_id>/', views.get_notice_detail, name='notice_detail'),
    path('notices/<int:notice_id>/update/', views.update_notice, name='update_notice'),
    path('notices/<int:notice_id>/delete/', views.delete_notice, name='delete_notice'),
    path('alerts/urgent/count/', views.alert_count, name='alert_count'),
    # 의사 상태 관리
    path('doctor/<str:doctor_id>/status/', views.update_doctor_status, name='update_doctor_status'),
    
    # 시스템 상태
    path('health-check/', views.health_check, name='health_check'),
]