from rest_framework import serializers
from .models import CDSSResult

class CDSSResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CDSSResult
        fields = '__all__'
