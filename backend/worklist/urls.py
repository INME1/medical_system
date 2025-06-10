from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyRequestViewSet
from . import views

router = DefaultRouter()
router.register(r'study-requests', StudyRequestViewSet, basename='studyrequest')

urlpatterns = [
    path('', include(router.urls)),
    # WorkList용 API
    path('work-list/', views.work_list, name='work_list'),
    path('work-list/<int:pk>/', views.work_list_detail, name='work_list_detail'),
]