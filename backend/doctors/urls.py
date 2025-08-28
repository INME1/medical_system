from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet

router = DefaultRouter()
router.register(r'', DoctorViewSet, basename='doctor')  # 🔥 빈 문자열로 변경!

urlpatterns = [
    path('', include(router.urls)),
]