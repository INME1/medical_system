from django.urls import path
from .views import create_test_result, get_test_results_by_sample

urlpatterns = [
    path('run', create_test_result),
    path('results/<int:sample_id>', get_test_results_by_sample)
]