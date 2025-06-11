# # backend/emr_orders/urls.py

# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import OrderViewSet

# router = DefaultRouter()
# router.register(r'ords', OrderViewSet, basename='ord')

# urlpatterns = [
#     path('', include(router.urls)),
# ]

# backend/orders_emr/urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
# 빈 prefix로 등록하면 /api/orders/ 로 바로 CRUD 사용 가능
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
