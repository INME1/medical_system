# backend/medical_integration/ohif_urls.py

from django.urls import path, re_path
from . import ohif_proxy_views

app_name = 'ohif'

urlpatterns = [
    # OHIF 설정
    path('config/', ohif_proxy_views.ohif_config, name='ohif_config'),
    
    # Study 목록 (OHIF용)
    path('studies/', ohif_proxy_views.ohif_studies_list, name='ohif_studies'),
    
    # DICOMweb API 프록시 (QIDO-RS/WADO-RS)
    re_path(r'^dicom-web/(?P<path>.*)$', ohif_proxy_views.dicom_web_proxy, name='dicomweb_proxy'),
    
    # WADO-URI 프록시
    path('wado/', ohif_proxy_views.wado_proxy, name='wado_proxy'),
    
    # 일반 Orthanc API 프록시
    re_path(r'^orthanc/(?P<path>.*)$', ohif_proxy_views.orthanc_proxy, name='orthanc_proxy'),
    
    # 특정 OHIF 요구사항
    path('studies/<str:study_uid>/metadata/', ohif_proxy_views.orthanc_proxy, {'path': 'studies'}, name='study_metadata'),
    path('studies/<str:study_uid>/series/', ohif_proxy_views.orthanc_proxy, {'path': 'studies'}, name='study_series'),
]
