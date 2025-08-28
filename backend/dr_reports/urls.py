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
    # 🔥 구체적인 경로를 먼저 배치
    path('save/', ReportSaveView.as_view(), name='report-save'),
    path('list/', ReportListView.as_view(), name='report-list'),                    # 🔥 먼저!
    path('summary/', ReportSummaryView.as_view(), name='report-summary'),
    path('detail/<int:report_id>/', ReportDetailView.as_view(), name='report-detail'),
    
    # 🔥 동적 경로는 마지막에 배치
    path('<str:study_uid>/', ReportLoadView.as_view(), name='report-load'),         # 🔥 나중에!
    path('<str:study_uid>/delete/', ReportDeleteView.as_view(), name='report-delete'),
    path('<str:study_uid>/status/', ReportStatusUpdateView.as_view(), name='report-status-update'),
]