from rest_framework import serializers
from .models import AIAnalysisResult

class AIAnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysisResult
        fields = '__all__'
