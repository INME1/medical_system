# ocs/middleware.py

import json
from .models import OCSLog

class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST' and (
            request.path.startswith('/api/orders') or
            request.path.startswith('/api/samples') or
            request.path.startswith('/api/results')
        ): 
            request._body_copy = request.body

        response = self.get_response(request)

        if request.method == 'POST' and hasattr(request, '_body_copy'):
            try:
                parsed_body = json.loads(request._body_copy.decode('utf-8'))
            except Exception:
                parsed_body = {}

            OCSLog.objects.create(
                # 이 미들웨어는 오더 생성 로그이므로 category는 'LIS'로 설정
                category     = 'LIS',
                # 기존 step 필드를 request_type 또는 직접 받은 step값으로 저장
                step         = parsed_body.get('step', parsed_body.get('request_type', 'order')),
                
                # OpenMRS UUID 필드
                patient_uuid = parsed_body.get('patient_uuid'),
                # Numeric ID(legacy) 필드
                patient_id   = parsed_body.get('patient_id', 'UNKNOWN'),
                doctor_uuid  = parsed_body.get('doctor_uuid'),
                doctor_id    = parsed_body.get('doctor_id'),
                
                # 상세 정보는 JSON 필드에 통째로 저장
                detail       = parsed_body
            )

        return response