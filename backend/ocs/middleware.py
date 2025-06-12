# ocs/middleware.py

# backend/ocs/middleware.py

import json
import re
from datetime import datetime
from pymongo import MongoClient
from django.conf import settings

UUID_FIELD_PATTERN = re.compile(r'.*_uuid$')  # patient_uuid, doctor_uuid, 등

class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # MongoDB 연결 정보
        self.mongo_uri = settings.MONGO_URI
        self.db_name = settings.DB_NAME
        self.coll_name = settings.COLLECTION_NAME

    def __call__(self, request):
        # JSON POST 요청만 가로채기
        if request.method == 'POST' and request.content_type == 'application/json':
            try:
                body = request.body.decode('utf-8')
                data = json.loads(body) if body else {}
            except Exception:
                data = {}
            # 바디에 uuid 필드가 하나라도 있으면 로그 저장
            if any(UUID_FIELD_PATTERN.match(k) for k in data.keys()):
                self._save_to_mongo(request.path, data)

        return self.get_response(request)

    def _save_to_mongo(self, path, data):
        client = MongoClient(self.mongo_uri)
        db = client[self.db_name]
        coll = db[self.coll_name]

        # Mongo 문서 형식
        log_doc = {
            'path': path,                   # 호출 경로
            'payload': data,                # 원본 바디
            'timestamp': datetime.utcnow()  # 시간
        }
        try:
            coll.insert_one(log_doc)
        except Exception as e:
            print(f"[API LOGGING ERROR] {e}")
        finally:
            client.close()
