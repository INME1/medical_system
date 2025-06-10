# ocs/middleware.py

import json
from datetime import datetime
from .models import OCSLog

class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST' and request.path.startswith('/ocs/api/order'):
            request._body_copy = request.body

        response = self.get_response(request)

        if request.method == 'POST' and hasattr(request, '_body_copy'):
            try:
                parsed_body = json.loads(request._body_copy.decode('utf-8'))
            except Exception:
                parsed_body = {}

            OCSLog.objects.create(
                patient_id=parsed_body.get('patient_id', 'UNKNOWN'),
                doctor_id=parsed_body.get('doctor_id', 'UNKNOWN'),
                request_type=parsed_body.get('request_type', '요청'),
                request_detail=json.dumps(parsed_body)[:500],
                request_time=datetime.now()
            )

        return response