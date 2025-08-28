from rest_framework import serializers
from .models import Doctor

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'department', 'medical_id', 'role', 'status', 'email']
    
    def to_representation(self, instance):
        """React 코드와 일치하도록 데이터 형태 조정"""
        data = super().to_representation(instance)
        
        # React에서 사용하는 color 필드 추가 (방사선사별 색상)
        colors = ['radiologist-blue', 'radiologist-green', 'radiologist-purple', 'radiologist-orange']
        color_index = (instance.id - 1) % len(colors)  # 1부터 시작하므로 -1
        
        return {
            'id': data['id'],
            'name': data['name'],
            'color': colors[color_index],  # React에서 사용하는 color
            'department': data['department'],
            'role': data['role'],
            'status': data['status'],
            'medical_id': data['medical_id'],
            'email': data['email']
        }

# 🆕 방사선사만 필터링하는 별도 시리얼라이저
class RadiologistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'department', 'role', 'status']
    
    def to_representation(self, instance):
        """React의 radiologists 배열 형태에 맞춤"""
        data = super().to_representation(instance)
        
        colors = ['radiologist-blue', 'radiologist-green', 'radiologist-purple', 'radiologist-orange']
        color_index = (instance.id - 1) % len(colors)
        
        return {
            'id': data['id'],
            'name': data['name'],
            'color': colors[color_index]
        }