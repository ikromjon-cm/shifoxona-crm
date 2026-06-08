from django.db import models
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import Inventory, InventoryCount
from .serializers import InventorySerializer, InventoryCountSerializer
from apps.accounts.permissions import IsSuperAdmin
from rest_framework.permissions import IsAuthenticated
from apps.medicines.models import MedicineBatch


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['medicine', 'medicine__category']
    search_fields = ['medicine__name', 'medicine__barcode']

    def get_queryset(self):
        return Inventory.objects.select_related('medicine').all()

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        items = self.get_queryset().filter(quantity__lte=models.F('min_quantity'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        expiring_batches = MedicineBatch.objects.filter(
            expiry_date__lte=timezone.now().date() + timedelta(days=30),
            quantity__gt=0
        ).select_related('medicine')
        medicines = []
        for batch in expiring_batches:
            medicines.append({
                'medicine_id': batch.medicine_id,
                'medicine_name': batch.medicine.name,
                'barcode': batch.medicine.barcode,
                'batch_series': batch.series_number,
                'batch_quantity': batch.quantity,
                'expiry_date': batch.expiry_date,
            })
        return Response(medicines)


class InventoryCountViewSet(viewsets.ModelViewSet):
    queryset = InventoryCount.objects.all()
    serializer_class = InventoryCountSerializer
    permission_classes = [IsSuperAdmin]
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return InventoryCount.objects.select_related('medicine', 'counted_by')

    def perform_create(self, serializer):
        serializer.save(counted_by=self.request.user)
