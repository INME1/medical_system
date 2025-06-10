from django.urls import path
from .views import (
    ReportSaveView,
    ReportLoadView,
    ReportListView,
    ReportDetailView,
    ReportDeleteView,
    ReportStatusUpdateView,
    ReportSummaryView
)

app_name = 'dr_reports'

urlpatterns = [
    # React에서 호출하는 메인 API들
    path('save/', ReportSaveView.as_view(), name='report-save'),
    path('<str:study_uid>/', ReportLoadView.as_view(), name='report-load'),
    path('<str:study_uid>/delete/', ReportDeleteView.as_view(), name='report-delete'),
    
    # 레포트 상태 업데이트
    path('<str:study_uid>/status/', ReportStatusUpdateView.as_view(), name='report-status-update'),
    
    # 전체 목록 조회 (관리용)
    path('list/', ReportListView.as_view(), name='report-list'),
    
    # 개별 레포트 관리 (ID 기반)
    path('detail/<int:report_id>/', ReportDetailView.as_view(), name='report-detail'),
    
    # 레포트 통계 요약
    path('summary/', ReportSummaryView.as_view(), name='report-summary'),
]