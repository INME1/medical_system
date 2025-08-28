from celery import Celery
import os

# Django 설정 모듈 지정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pacs_model.settings')

# Celery 앱 생성
app = Celery('pacs_model')

# Django 설정에서 Celery 설정 읽기
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django 앱에서 tasks.py 자동 발견
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

@app.task
def health_check():
    """Celery 상태 확인용 태스크"""
    return {'status': 'ok', 'message': 'Celery is running!'}