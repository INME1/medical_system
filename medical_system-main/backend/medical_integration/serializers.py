from rest_framework import serializers
from .models import Alert, CDSSResult

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'type', 'message', 'created_at', 'is_read']

class CDSSResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CDSSResult
        fields = '__all__'