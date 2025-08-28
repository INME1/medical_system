from rest_framework import serializers
from .models import AIAnalysisResult

class AIAnalysisResultSerializer(serializers.ModelSerializer):
    bbox = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=4,
        max_length=4,
        help_text="Bounding box coordinates: [x1, y1, x2, y2]"
    )

    class Meta:
        model = AIAnalysisResult
        fields = '__all__'
