from rest_framework import serializers
from .models import TestOrder

class TestOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestOrder
        fields = '__all__'
