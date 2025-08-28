from django.urls import path
from .views import stt_upload

urlpatterns = [
    path('upload/', stt_upload , name= 'stt_upload'),
]