# from rest_framework import serializers
# from .models import NoticeCommon, NoticeRIS

# class NoticeCommonSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = NoticeCommon
#         fields = '__all__'

# class NoticeRISSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = NoticeRIS
#         fields = '__all__'

# serializers.py
from rest_framework import serializers
from .models import NoticeCommon, NoticeRIS

class NoticeCommonSerializer(serializers.ModelSerializer):
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = NoticeCommon
        fields = [
            'id', 'title', 'content', 'notice_type', 'notice_type_display',
            'is_active', 'is_pinned', 'created_by', 'created_at', 'updated_at',
            'start_date', 'end_date', 'views', 'is_valid'
        ]
        read_only_fields = ['views', 'created_at', 'updated_at']

class NoticeRISSerializer(serializers.ModelSerializer):
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = NoticeRIS
        fields = [
            'id', 'title', 'content', 'notice_type', 'notice_type_display',
            'is_active', 'is_pinned', 'created_by', 'created_at', 'updated_at',
            'start_date', 'end_date', 'views', 'is_valid', 'target_department'
        ]
        read_only_fields = ['views', 'created_at', 'updated_at']
