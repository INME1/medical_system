from django.db import models
from samples.models import Sample

class TestResult(models.Model):
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE)
    test_type = models.CharField(max_length=100, blank=True, null=True)
    component_name = models.CharField(max_length=50)  # 예: 'RBC'
    result_value = models.CharField(max_length=50)  # 문자열로 저장 (예: '4.3')
    result_unit = models.CharField(max_length=20)  # 예: 'g/dL'
    verified_by = models.IntegerField()  # 검토자 ID
    verified_date = models.DateTimeField()
    result_status = models.CharField(max_length=20, default='recorded')

    def __str__(self):
        return f"{self.test_type} - {self.component_name}"