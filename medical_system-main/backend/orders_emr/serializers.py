from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order            # 여기에도 Order
        fields = [
            'order_id',
            'patient_id',
            'doctor_id',
            'panel',
            'tests',
            'order_date',
            'status',
            'created_at',
        ]
