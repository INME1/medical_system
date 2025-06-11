from django.db import models

class Order(models.Model):
    order_id    = models.AutoField(primary_key=True)
    patient_id  = models.UUIDField()
    doctor_id   = models.UUIDField()
    panel       = models.CharField(max_length=100)
    tests       = models.JSONField()
    order_date  = models.DateField()
    status      = models.CharField(max_length=50, default='CREATED')
    created_at  = models.DateTimeField(auto_now_add=True)
