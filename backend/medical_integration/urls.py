# backend/medical_integration/urls.py (최종 업데이트)

from django.urls import path
from . import views
from .views import get_all_openmrs_patients, proxy_openmrs_providers
app_name = 'medical_integration'

urlpatterns = [
    # 시스템 상태
    path('health/', views.health_check, name='health_check'),
    path('test-connections/', views.test_all_connections, name='test_connections'),
    
    # OpenMRS 환자 관리
    path('openmrs/patients/create/', views.create_patient, name='create_openmrs_patient'),
    path('openmrs/patients/search/', views.search_patients, name='search_openmrs_patients'),
    path('openmrs/patients/<str:uuid>/', views.get_patient, name='get_openmrs_patient'),
    path('openmrs/patients/', views.get_all_patients_simple, name='get_all_patients'),
    
    # Orthanc 환자 관리
    path('orthanc/patients/search/', views.search_orthanc_patients, name='search_orthanc_patients'),
    path('orthanc/patients/<str:patient_id>/', views.get_orthanc_patient, name='get_orthanc_patient'),
    
    # 🔥 DICOM 업로드 및 자동 매핑
    path('dicom/upload-with-mapping/', views.upload_dicom_with_auto_mapping, name='upload_dicom_with_auto_mapping'),
    path('dicom/upload/', views.upload_dicom_with_auto_mapping, name='upload_dicom'),  # 기존 호환성
    
    # 🔥 환자별 DICOM 조회
    path('patients/<str:patient_uuid>/dicom-studies/', views.get_patient_dicom_studies, name='get_patient_dicom_studies'),
    path('dicom/studies/<str:study_id>/details/', views.get_dicom_study_details, name='get_dicom_study_details'),
    
    # 🔥 환자 매핑 관리
    path('patient-mappings/', views.get_patient_mappings, name='get_patient_mappings'),
    path('patient-mappings/create/', views.create_patient_mapping, name='create_patient_mapping'),
    path('patient-mappings/manual/', views.create_manual_patient_mapping, name='create_manual_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/', views.get_patient_mapping, name='get_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/delete/', views.delete_patient_mapping, name='delete_patient_mapping'),
    path('patient-mappings/<int:mapping_id>/sync/', views.sync_patient_mapping, name='sync_patient_mapping'),
    
    # 🔥 매핑되지 않은 환자 관리
    path('orthanc/unmapped-patients/', views.get_unmapped_orthanc_patients, name='get_unmapped_orthanc_patients'),
    path('mappings/batch-auto-mapping/', views.batch_auto_mapping, name='batch_auto_mapping'),
    
    # 🧪 더미 데이터 및 테스트
    path('dummy-data/create/', views.create_dummy_data, name='create_dummy_data'),
    path('dummy-data/clear/', views.clear_dummy_data, name='clear_dummy_data'),
    path('mappings/test-status/', views.get_mapping_test_status, name='get_mapping_test_status'),
    path('openmrs/providers/', proxy_openmrs_providers, name='openmrs_providers'),
    path('openmrs-patients/', get_all_openmrs_patients, name='get_all_openmrs_patients'),
]