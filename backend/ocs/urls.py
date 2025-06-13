# backend/ocs/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('',        views.integration_logs,      name='integration_logs'),
    path('create/', views.create_integration_log, name='create_integration_log'),
    
]
