# # dr_annotations/urls.py
# from django.urls import path
# from .views import (
#     AnnotationSaveView,
#     AnnotationLoadView, 
#     AnnotationDetailView,
#     AnnotationListView,
#     AnnotationDeleteAllView,
#     get_annotations_by_instances,
#     get_annotations_by_study,
# )

# app_name = 'dr_annotations'

# urlpatterns = [
#     path('save/', AnnotationSaveView.as_view(), name='annotation-save'),
#     path('list/', AnnotationListView.as_view(), name='annotation-list'),
#     # path('summary/', AnnotationSummaryView.as_view(), name='annotation-summary'),  # 필요시
#     path('by-instances/', get_annotations_by_instances, name='get_annotations_by_instances'),
#     path('study/<str:study_uid>/', get_annotations_by_study, name='get_annotations_by_study'),
    
#     # 어노테이션 저장/삭제 API  

#     # study_uid 관련 패턴들
#     path('<str:study_uid>/', AnnotationLoadView.as_view(), name='annotation-load'),
#     path('<str:study_uid>/delete/', AnnotationDeleteAllView.as_view(), name='annotation-delete-all'),
    
#     # ID 기반 패턴들
#     path('detail/<int:annotation_id>/', AnnotationDetailView.as_view(), name='annotation-detail'),
# ]


from django.urls import path
from .views import (
    AnnotationSaveView,
    AnnotationLoadView, 
    AnnotationDetailView,
    AnnotationListView,
    AnnotationDeleteAllView,
    AnnotationStatsView,
    get_annotations_by_instances,
    get_annotations_by_study,
)

app_name = 'dr_annotations'

urlpatterns = [
    # 메인 API들 (React에서 사용) - 인스턴스 단위 지원
    path('save/', AnnotationSaveView.as_view(), name='annotation-save'),
    path('load/<str:study_uid>/', AnnotationLoadView.as_view(), name='annotation-load'),  # ?instance_uid= 쿼리 파라미터 지원
    
    # 인스턴스별 조회 API (기존 views.py의 함수들)
    path('by-instances/', get_annotations_by_instances, name='get_annotations_by_instances'),
    path('study/<str:study_uid>/', get_annotations_by_study, name='get_annotations_by_study'),
    
    # 관리 API들
    path('list/', AnnotationListView.as_view(), name='annotation-list'),
    path('stats/', AnnotationStatsView.as_view(), name='annotation-stats'),
    
    # 개별 어노테이션 관리
    path('detail/<int:annotation_id>/', AnnotationDetailView.as_view(), name='annotation-detail'),
    path('detail/<int:annotation_id>/edit/', AnnotationDetailView.as_view(), name='annotation-edit'),
    path('detail/<int:annotation_id>/delete/', AnnotationDetailView.as_view(), name='annotation-delete'),
    
    # 일괄 삭제 - 인스턴스 단위 지원
    path('delete-all/<str:study_uid>/', AnnotationDeleteAllView.as_view(), name='annotation-delete-all'),  # ?instance_uid= 쿼리 파라미터 지원
]