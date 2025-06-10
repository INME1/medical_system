from rest_framework import serializers
from .models import Sample, TestOrder


class SampleSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=TestOrder.objects.all())
   
    class Meta:
        model = Sample
        fields = '__all__'
