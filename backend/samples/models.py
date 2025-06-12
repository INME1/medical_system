from django.db import models
from orders_emr.models import Order

class Sample(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    sample_type = models.CharField(max_length=50)
    loinc_code = models.CharField(max_length=50)
    collection_date = models.DateTimeField()
    test_type = models.CharField(max_length=50, default='기타')
    sample_status = models.CharField(max_length=20, default="collected")
    is_deleted = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Sample {self.id} - {self.sample_type}"
    
class AliasMapping(models.Model):
    sample_type = models.CharField(max_length=50, default="기타")
    alias_name = models.CharField(max_length=100, unique=True)
    test_type_keywords = models.TextField(help_text="Comma-separated keywords")

    def __str__(self):
        return f"{self.sample_type} - {self.alias_name}"
    
class LOINCCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.TextField()
    description = models.TextField(blank=True, null=True)
    component = models.TextField(blank=True, null=True)
    property = models.CharField(max_length=100, blank=True, null=True)
    system = models.CharField(max_length=100, blank=True, null=True)
    method = models.CharField(max_length=100, blank=True, null=True)
    sample_type = models.CharField(max_length=50, blank=True, null=True)
    test_type = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.code} - {self.name}"
