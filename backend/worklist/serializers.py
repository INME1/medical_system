from rest_framework import serializers
from .models import StudyRequest

class StudyRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyRequest
        fields = '__all__'
        
    def validate_birth_date(self, value):
        if not value:
            raise serializers.ValidationError("생년월일은 필수입니다.")
        return value