from rest_framework import viewsets
from .models import Order
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        pid = self.request.query_params.get('patientId')
        return Order.objects.filter(patient_id=pid) if pid else super().get_queryset()
