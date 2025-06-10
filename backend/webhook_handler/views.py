from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

from .models import WebhookEvent

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def webhook_study_complete(request):
    """Orthanc에서 스터디 완료 Webhook 수신"""
    try:
        # JSON 데이터 파싱
        data = json.loads(request.body)
        
        # 기본값 설정
        study_uid = data.get('study_id', data.get('study_uid', ''))
        patient_id = data.get('patient_id', '')
        modality = data.get('modality', 'UNKNOWN')
        
        # Webhook 이벤트 저장
        webhook_event = WebhookEvent.objects.create(
            event_type='study_complete',
            study_uid=study_uid,
            patient_id=patient_id,
            modality=modality,
            status='received',
            orthanc_payload=data
        )
        
        logger.info(f"Webhook 수신: {patient_id} - {modality}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Webhook received successfully',
            'webhook_id': webhook_event.id
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook request")
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON format'
        }, status=400)
        
    except Exception as e:
        logger.error(f"Webhook 처리 오류: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error'
        }, status=500)

def webhook_logs(request):
    """최근 Webhook 로그 조회 (간단한 페이지)"""
    try:
        events = WebhookEvent.objects.all()[:10]  # 최근 10개
        
        logs_html = "<h2>최근 Webhook 로그</h2><ul>"
        for event in events:
            logs_html += f"<li>{event.patient_id} - {event.modality} - {event.status} ({event.received_at})</li>"
        logs_html += "</ul>"
        
        return JsonResponse({
            'status': 'success',
            'count': events.count(),
            'html': logs_html
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)