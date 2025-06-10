from django.db import models
from samples.models import Sample
print("=== lis_cdss/models.py loaded ===")
class CDSSResult(models.Model):
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE)
    test_type = models.CharField(max_length=100)
    component_name = models.CharField(max_length=50)
    value = models.CharField(max_length=50)
    unit = models.CharField(max_length=20)
    verified_by = models.IntegerField()
    verified_date = models.DateTimeField()

    def __str__(self):
        return f"{self.sample} - {self.test_type} - {self.component_name}"

    class Meta:
        db_table = "lis_cdss_cdssresult"  # 원하는 테이블 이름 지정 (실제 테이블명이 이걸로 생김)
