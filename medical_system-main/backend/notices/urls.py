
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import NoticeCommonViewSet, NoticeRISViewSet

# router = DefaultRouter()
# # 🔧 router 등록 확인
# router.register(r'notices/common', NoticeCommonViewSet, basename='notice-common')
# router.register(r'notices/ris', NoticeRISViewSet, basename='notice-ris')

# urlpatterns = [
#     path('', include(router.urls)),
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoticeCommonViewSet, NoticeRISViewSet

router = DefaultRouter()
router.register(r'common', NoticeCommonViewSet, basename='noticecommon')
router.register(r'ris', NoticeRISViewSet, basename='noticeris')

urlpatterns = [
    path('', include(router.urls)),
]