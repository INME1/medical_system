from django.urls import path, include
from . import views
from .views import (
    # 기존 imports
    get_all_openmrs_patients,
    proxy_openmrs_providers,
    identifier_based_waiting_list,
    create_identifier_based_mapping,
    reception_list_view,
    UrgentAlertList,
    UrgentAlertCount,
    AlertMarkRead,
    get_patient_mapping,
    assign_room,
    cancel_waiting_registration,
    # 🔥 새로 추가된 함수들 (대기 종료 관련)
    unassign_room,
    complete_treatment,                    # 진료 완료 + 대기 종료
    unassign_room_by_room_number,
    get_room_status,
    batch_update_status,
    assign_room,
    get_waiting_statistics,               # 🔥 대기 통계
    get_completed_patients_today, 
    completed_patients_list, # 🔥 완료 환자 목록
    receive_cdss_result,
    get_cdss_result_by_patient
)

app_name = 'medical_integration'

urlpatterns = [
    
    # 통합 분석 엔드포인트 (기존 + SimCLR)
    path('health/', views.health_check, name='health_check'),
    path('test-connections/', views.test_all_connections, name='test_connections'),
    # OCS 매핑관련
    path('openmrs/patients/map/', views.list_openmrs_patients_map, name='list_openmrs_patients_map'),
    path('openmrs/providers/map/', views.list_openmrs_providers_map, name='list_openmrs_providers_map'),

    # OpenMRS 환자 관리
    path('openmrs/patients/create/', views.create_patient, name='create_openmrs_patient'),
    path('openmrs/patients/search/', views.search_patients, name='search_openmrs_patients'),
    path('openmrs/patients/<str:uuid>/', views.get_patient, name='get_openmrs_patient'),
    path('openmrs/patients/', views.get_all_patients_simple, name='get_all_patients'),
    path('person-uuid-by-identifier/<str:identifier>/', views.get_person_uuid_by_identifier, name='get_person_uuid_by_identifier'),
    
    # Orthanc 환자 관리
    path('orthanc/studies/', views.get_orthanc_studies, name='get_orthanc_studies'),
    path('orthanc/patients/<str:patient_id>/', views.get_orthanc_patient, name='get_orthanc_patient'),
    path('orthanc/studies/search-by-patient/', views.search_orthanc_studies_by_patient_id, name='search_orthanc_studies_by_patient_id'),
    # DICOM 업로드 및 자동 매핑
    path('dicom/upload-with-mapping/', views.upload_dicom_with_auto_mapping, name='upload_dicom_with_auto_mapping'),
    path('dicom/upload/', views.upload_dicom_with_auto_mapping, name='upload_dicom'),

    # 환자별 DICOM 조회
    path('patients/<str:patient_uuid>/dicom-studies/', views.get_patient_dicom_studies, name='get_patient_dicom_studies'),
    path('dicom/studies/<str:study_id>/details/', views.get_dicom_study_details, name='get_dicom_study_details'),

    # 환자 매핑 관리
    path('patient-mappings/', views.get_patient_mappings, name='get_patient_mappings'),
    path('patient-mappings/create/', views.create_patient_mapping, name='create_patient_mapping'),
    path('patient-mappings/manual/', views.create_manual_patient_mapping, name='create_manual_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/', views.get_patient_mapping, name='get_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/delete/', views.delete_patient_mapping, name='delete_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/sync/', views.sync_patient_mapping, name='sync_patient_mapping'),
    path('completed-patients-list/', views.completed_patients_list, name='completed_patients_list'),
    
    # 매핑되지 않은 환자 관리
    path('orthanc/unmapped-patients/', views.get_unmapped_orthanc_patients, name='get_unmapped_orthanc_patients'),
    path('mappings/batch-auto-mapping/', views.batch_auto_mapping, name='batch_auto_mapping'),

    # 더미 데이터 및 테스트
    path('dummy-data/create/', views.create_dummy_data, name='create_dummy_data'),
    path('dummy-data/clear/', views.clear_dummy_data, name='clear_dummy_data'),
    path('mappings/test-status/', views.get_mapping_test_status, name='get_mapping_test_status'),
    path('openmrs/providers/', proxy_openmrs_providers, name='openmrs_providers'),
    path('openmrs-patients/', get_all_openmrs_patients, name='get_all_openmrs_patients'),
    
    # 🔥 대기 관리 (수정된 버전)
    path('identifier-waiting/', identifier_based_waiting_list, name='identifier_based_waiting'),           # 기존 버전
    path('reception-list/', reception_list_view, name='reception_list'),
    path('identifier-based/', create_identifier_based_mapping, name='create_identifier_based_mapping'),
    path('reception/active-list/', views.get_active_waiting_list, name='get_active_waiting_list'),
    
    
    # 🔥 대기 통계 및 완료 환자 관리
    path('waiting-statistics/', get_waiting_statistics, name='waiting_statistics'),                      # 🔥 대기 현황 통계
    path('completed-patients/', get_completed_patients_today, name='completed_patients_today'),    # 🔥 완료 환자 목록
    path('waiting-board/', views.waiting_board_view, name='waiting_board'),
    
    # 알림 API
    path('alerts/urgent/', UrgentAlertList.as_view(), name='urgent_alert_list'),
    path('alerts/urgent/count/', UrgentAlertCount.as_view(), name='urgent_alert_count'),
    path('alerts/<int:pk>/mark-read/', AlertMarkRead.as_view(), name='alert_mark_read'),
    path('cancel-waiting/<int:mapping_id>/', cancel_waiting_registration, name='cancel_waiting_registration'),
    # 🔥 진료실 배정 관리 (완전한 버전)
    path('assign-room/', assign_room, name='assign_room'),
    path('unassign-room/', unassign_room, name='unassign_room'),
    path('complete-treatment/', complete_treatment, name='complete_treatment'),                          # 🔥 진료 완료 + 대기 종료
    path('unassign-room-by-number/', unassign_room_by_room_number, name='unassign_room_by_number'),
    
    # 🔥 진료실 상태 관리
    path('room-status/', get_room_status, name='get_room_status'),
    path('batch-update-status/', batch_update_status, name='batch_update_status'),
    
    # 기존 환자 관리
    path('patients/create-auto-id/', views.create_patient_auto_id, name='create_patient_auto_id'),
    path('patients/create/', views.create_patient, name='create_patient'),
    
    # lis 결과 받아오기
    path('receive_cdss_result/', receive_cdss_result),
    path('cdss_result/', get_cdss_result_by_patient),
    
    path('orthanc/instances/<str:instance_id>/preview/', views.orthanc_instance_preview, name='orthanc_instance_preview'),
]   