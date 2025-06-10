from django.urls import path
from .views import create_order, get_order, list_orders

urlpatterns = [
    path('', list_orders),
    path('create/', create_order),
    path('<int:order_id>/', get_order),
]