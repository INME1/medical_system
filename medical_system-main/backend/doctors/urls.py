# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import DoctorViewSet

# # 🆕 doctors 앱에 이 파일이 없으면 새로 생성
# router = DefaultRouter()
# router.register(r'doctors', DoctorViewSet, basename='doctor')

# urlpatterns = [
#     path('', include(router.urls)),
#     # 🆕 current_user 엔드포인트 추가
#     path('doctors/current_user/', DoctorViewSet.as_view({'get': 'current_user'}), name='current-user'),
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet

router = DefaultRouter()
router.register(r'', DoctorViewSet, basename='doctor')  # 🔥 빈 문자열로 변경!

urlpatterns = [
    path('', include(router.urls)),
    # ❌ 이 줄은 삭제 (Router가 자동으로 생성함)
    # path('doctors/current_user/', DoctorViewSet.as_view({'get': 'current_user'}), name='current-user'),
]