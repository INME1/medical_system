# ocs/urls.py
from django.urls import path
from .views import create_log_view, get_logs_view, OCSLogListAPIView, combined_log_view 

urlpatterns = [
    path('create/', create_log_view,    name='create_log'),
    path('',       get_logs_view,      name='get_logs'),
    path('logs/',  OCSLogListAPIView.as_view(), name='ocs-logs'),

    path('combined/', combined_log_view, name='combined_log_view'),
]

