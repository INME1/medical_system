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
    path('api/analysis/', include('medical_integration.simclr_urls')),
    # 각 앱별 prefix로 충돌 방지
    path('api/integration/', include('medical_integration.urls')),
    
    path('api/orders/',   include('orders_emr.urls')),
    path('api/worklist/', include('worklist.urls')),
    path('api/samples/', include('samples.urls')),
    path('api/tests/', include('tests.urls')),
    path('api/account/', include('accounts.urls')),
    path('api/cdss/', include('lis_cdss.urls')),
    path('api/ohif/', include('medical_integration.ohif_urls')),
    
    path('api/openmrs/', include('openmrs_models.urls')),
    # OpenMRS 직접 연결 (호환성 유지)
    path('api/openmrs-vitals/', openmrs_vitals, name='openmrs_vitals'),
    path('api/openmrs-encounters/', openmrs_encounters, name='openmrs_encounters'),
    # RIS 기능
    path('webhook/', include('webhook_handler.urls')),
    path('api/ai/', include('ai_analysis.urls')),
    path('api/dr-annotations/', include('dr_annotations.urls')), #뷰어 만들어서 수정함
    path('api/reports/', include('dr_reports.urls')),
    path('api/pacsdocs/', include('pacsdocs.urls')),
    path('api/viewer-v2/', include('viewer_v2.urls')),   # 새로 추가
    
    # stt
    path('api/stt/', include('stt_service.urls')),
    path('api/statisticsboard/', include('statisticsboard.urls')),
    path('api/main-page-function/', include('main_page_function.urls')),  # 새로 추가
    path('api/schedules/', include('schedules.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/notices/', include('notices.urls')),
    path('api/worklists/', include('worklists.urls')),
    path('api/health/', health_check_view, name='health_check'),
    
    # 🔧 Frontend API 호출 경로에 맞춰 수정
    path('api/study-requests/', include('worklists.urls')),  # Frontend가 호출하는 경로
    path('api/', include('schedules.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)