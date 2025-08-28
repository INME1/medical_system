# backend/openmrs_models/urls.py (PatientVisitHistoryViewSet 추가)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DRF Router 설정
router = DefaultRouter()

# 🔥 SOAP 진단 ViewSet 등록
try:
    router.register(r'soap-diagnoses', views.SoapDiagnosisViewSet, basename='soap-diagnoses')
    print("✅ SoapDiagnosisViewSet 등록 성공")
except (ImportError, AttributeError) as e:
    print(f"⚠️ SoapDiagnosisViewSet 등록 실패: {e}")

# 🔥 SOAP 기반 내원 이력 ViewSet 등록 (테이블 불필요)
try:
    router.register(r'visit-history', views.SoapBasedVisitHistoryViewSet, basename='visit-history')
    print("✅ SoapBasedVisitHistoryViewSet 등록 성공")
except (ImportError, AttributeError) as e:
    print(f"⚠️ SoapBasedVisitHistoryViewSet 등록 실패: {e}")

urlpatterns = [
    # 🔥 함수 기반 뷰 (직접 등록)
    
    # 🏥 DRF Router URLs
    path('', include(router.urls)),
    
    # 🔥 기존 function-based views
    path('vitals/', views.openmrs_vitals, name='openmrs_vitals'),
    path('encounters/', views.openmrs_encounters, name='openmrs_encounters'),
]