from django.urls import path
from .views import (create_sample, list_samples_by_order, delete_sample,
                    get_loinc_by_sample_type, alias_mapping_list, 
                    get_test_types_by_alias, list_all_samples, 
                    get_sample_by_id, create_test_result_for_sample)

urlpatterns = [
    path('', list_all_samples),
    path('create', create_sample),
    path('delete/<int:sample_id>', delete_sample),
    path('<int:order_id>', list_samples_by_order),
    path('alias-mapping/', alias_mapping_list),
    path('loinc-by-sample-type', get_loinc_by_sample_type),
    path('test-types-by-alias/', get_test_types_by_alias),
    path('get/<int:sample_id>/', get_sample_by_id),
    path('<int:sample_id>/create-result', create_test_result_for_sample),
]