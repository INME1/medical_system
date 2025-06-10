from django.urls import path
from .views import (
    AnnotationSaveView,
    AnnotationLoadView, 
    AnnotationDetailView,
    AnnotationListView,
    AnnotationDeleteAllView
)

app_name = 'dr_annotations'

urlpatterns = [
    # React에서 호출하는 메인 API들
    path('save/', AnnotationSaveView.as_view(), name='annotation-save'),
    path('<str:study_uid>/', AnnotationLoadView.as_view(), name='annotation-load'),
    
    # 개별 어노테이션 관리
    path('detail/<int:annotation_id>/', AnnotationDetailView.as_view(), name='annotation-detail'),
    
    # 전체 목록 조회 (관리용)
    path('list/', AnnotationListView.as_view(), name='annotation-list'),
    
    # 특정 study의 모든 어노테이션 삭제
    path('<str:study_uid>/delete-all/', AnnotationDeleteAllView.as_view(), name='annotation-delete-all'),
]