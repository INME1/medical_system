from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoticeCommonViewSet, NoticeRISViewSet

router = DefaultRouter()
router.register(r'common', NoticeCommonViewSet, basename='noticecommon')
router.register(r'ris', NoticeRISViewSet, basename='noticeris')

urlpatterns = [
    path('', include(router.urls)),
]