# # ocs/serializers.py

# from rest_framework import serializers
# from .models import OCSLog

# class OCSLogSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OCSLog
#         fields = [
#             'id',
#             'created_at',
#             'category',
#             'patient_uuid',
#             'patient_id',
#             'doctor_uuid',
#             'doctor_id',   # legacy ID
#             'step',
#             'detail',
#         ]


# backend/ocs/serializers.py
from rest_framework import serializers
from .models import OCSLog

class OCSLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OCSLog
        fields = '__all__'
