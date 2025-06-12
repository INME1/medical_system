from rest_framework import serializers
from .models import Sample
from orders_emr.models import Order


class SampleSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
   
    class Meta:
        model = Sample
        fields = '__all__'
