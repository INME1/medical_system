# backend/orders_emr/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DRF Router 설정
router = DefaultRouter()
# router.register(r'', views.OrderViewSet, basename='order')  # ViewSet 사용시

app_name = 'orders_emr'

urlpatterns = [
    # REST API 엔드포인트들
    path('', views.order_list_create, name='order_list_create'),  # GET: 목록, POST: 생성
    path('<int:order_id>/', views.order_detail, name='order_detail'),  # GET, PUT, DELETE
    path('<int:order_id>/status/', views.update_order_status, name='update_order_status'),  # PATCH: 상태 업데이트
    
    # LIS 통합 관련 엔드포인트들
    path('search/', views.search_orders, name='search_orders'),  # GET: 검색
    path('by-patient/<str:patient_id>/', views.orders_by_patient, name='orders_by_patient'),  # GET: 환자별 주문
    path('pending/', views.pending_orders, name='pending_orders'),  # GET: 대기중 주문들
    path('stats/', views.order_statistics, name='order_statistics'),  # GET: 통계
    
    # 검사 패널 관련
    path('panels/', views.available_panels, name='available_panels'),  # GET: 사용 가능한 패널들
    path('panels/<str:panel_name>/components/', views.panel_components, name='panel_components'),  # GET: 패널 구성요소
    
    # 배치 작업
    path('bulk-create/', views.bulk_create_orders, name='bulk_create_orders'),  # POST: 대량 생성
    path('bulk-update/', views.bulk_update_status, name='bulk_update_status'),  # POST: 대량 상태 업데이트
    
    # 통합 로그
    path('logs/', views.integration_logs, name='integration_logs'),  # GET: 통합 로그 조회
    path('logs/create/', views.create_integration_log, name='create_integration_log'),  # POST: 로그 생성
]