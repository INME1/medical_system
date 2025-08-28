# backend/main_page_function/serializers.py

from rest_framework import serializers
from .models import Notice, DoctorStats

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'notice_type', 'is_active', 
            'is_pinned', 'created_by', 'created_at', 'updated_at',
            'start_date', 'end_date', 'views'  # views 필드 추가
        ]
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['notice_type_display'] = instance.get_notice_type_display()
        data['is_valid'] = instance.is_valid()
        return data

class DoctorStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorStats
        fields = '__all__'