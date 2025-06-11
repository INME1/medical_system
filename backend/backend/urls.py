# backend/backend/urls.py (수정된 버전)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from openmrs_models.views import openmrs_vitals, openmrs_encounters
# from . import views
# 기본 헬스체크 뷰 추가
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check_view(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Medical Platform Backend',
        'timestamp': '2025-05-30'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 헬스체크
    path('api/health/', health_check_view, name='health_check'),
    
    # 각 앱별 prefix로 충돌 방지
    path('api/integration/', include('medical_integration.urls')),
    path('api/orders/',      include('orders_emr.urls')),
    path('api/worklist/', include('worklist.urls')),
    path('api/samples/', include('samples.urls')),
    path('api/tests/', include('tests.urls')),
    path('api/logs/', include('ocs.urls')),
    path('api/account/', include('accounts.urls')),
    path('api/cdss/', include('lis_cdss.urls')),
    path('api/ohif/', include('medical_integration.ohif_urls')),
    # OpenMRS 직접 연결 (호환성 유지)
    path('api/openmrs-vitals/', openmrs_vitals, name='openmrs_vitals'),
    path('api/openmrs-encounters/', openmrs_encounters, name='openmrs_encounters'),
    # path('api/openmrs-patients/', views.get_all_openmrs_patients),
    # RIS 기능
    path('webhook/', include('webhook_handler.urls')),
    path('api/ai/', include('ai_analysis.urls')),
    path('api/annotations/', include('dr_annotations.urls')),
    path('api/reports/', include('dr_reports.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)