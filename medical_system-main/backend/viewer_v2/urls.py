# backend/viewer_v2/urls.py

from django.urls import path, re_path
from . import views

app_name = 'viewer_v2'

urlpatterns = [
    # =================================================================
    # DICOMweb 표준 QIDO-RS/WADO-RS API
    # =================================================================
    
    # QIDO-RS: Study 검색 및 조회
    path('studies/', views.qido_studies, name='qido_studies'),
    path('studies/<str:study_uid>/', views.qido_study_detail, name='qido_study_detail'),
    path('studies/<str:study_uid>/metadata/', views.qido_study_metadata, name='qido_study_metadata'),
    
    # QIDO-RS: Series 조회
    path('studies/<str:study_uid>/series/', views.qido_series, name='qido_series'),
    path('studies/<str:study_uid>/series/<str:series_uid>/', views.qido_series_detail, name='qido_series_detail'),
    path('studies/<str:study_uid>/series/<str:series_uid>/metadata/', views.qido_series_metadata, name='qido_series_metadata'),
    
    # QIDO-RS: Instance 조회
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/', views.qido_instances, name='qido_instances'),
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/<str:instance_uid>/', views.qido_instance_detail, name='qido_instance_detail'),
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/<str:instance_uid>/metadata/', views.qido_instance_metadata, name='qido_instance_metadata'),
    
    # WADO-RS: 이미지 렌더링
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/<str:instance_uid>/frames/<int:frame>/rendered', 
         views.wado_rendered, name='wado_rendered'),
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/<str:instance_uid>/rendered', 
         views.wado_instance_rendered, name='wado_instance_rendered'),
    
    # WADO-RS: DICOM 파일 다운로드
    path('studies/<str:study_uid>/series/<str:series_uid>/instances/<str:instance_uid>',
         views.wado_instance_file, name='wado_instance_file'),
    
    # =================================================================
    # RESTful API (환자 중심)
    # =================================================================
    
    # 환자 관련 API
    path('patients/', views.get_all_patients, name='get_all_patients'),
    path('patients/<str:patient_id>/', views.get_patient, name='get_patient'),
    path('patients/<str:patient_id>/studies/', views.get_patient_studies, name='get_patient_studies'),
    path('patients/<str:patient_id>/studies/<str:study_uid>/', views.get_patient_study_detail, name='get_patient_study_detail'),
    
    # =================================================================
    # 편의 API (추가 기능)
    # =================================================================
    
    # 검색 API
    path('search/patients/', views.search_patients, name='search_patients'),
    path('search/studies/', views.search_studies, name='search_studies'),
    
    # 미리보기 API
    path('preview/instances/<str:instance_uid>/', views.get_instance_preview, name='get_instance_preview'),
    path('preview/studies/<str:study_uid>/thumbnail/', views.get_study_thumbnail, name='get_study_thumbnail'),
    
    # 통계 및 정보 API
    path('stats/', views.get_orthanc_stats, name='get_orthanc_stats'),
    path('system/', views.get_system_info, name='get_system_info'),
    
    # =================================================================
    # Orthanc 직접 프록시 (필요시)
    # =================================================================
    
    # Orthanc 원본 API 프록시
    re_path(r'^orthanc/(?P<path>.*)$', views.orthanc_proxy, name='orthanc_proxy'),
    
    # =================================================================
    # 테스트 및 디버깅 API
    # =================================================================
    
    # 연결 테스트
    path('test/connection/', views.test_orthanc_connection, name='test_orthanc_connection'),
    path('test/dicomweb/', views.test_dicomweb, name='test_dicomweb'),
    
    # 디버그 정보
    path('debug/patient/<str:patient_id>/', views.debug_patient_data, name='debug_patient_data'),
    path('debug/study/<str:study_uid>/', views.debug_study_data, name='debug_study_data'),
]