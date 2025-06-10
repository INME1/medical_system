from django.urls import path
from . import views

urlpatterns = [
    path('study-complete/', views.webhook_study_complete, name='webhook_study_complete'),
    path('logs/', views.webhook_logs, name='webhook_logs'),
]