# ocs/serializers.py

from rest_framework import serializers
from .models import LISLog

class LISLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LISLog
        fields = '__all__'