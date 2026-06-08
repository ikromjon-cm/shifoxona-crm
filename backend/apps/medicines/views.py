from rest_framework import viewsets, filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import MedicineCategory, Supplier, Medicine, MedicineBatch
from .serializers import (
    MedicineCategorySerializer, SupplierSerializer,
    MedicineListSerializer, MedicineDetailSerializer, MedicineCreateSerializer,
    MedicineBatchSerializer
)


class MedicineCategoryViewSet(viewsets.ModelViewSet):
    queryset = MedicineCategory.objects.all()
    serializer_class = MedicineCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    search_fields = ['name', 'contact_person', 'phone', 'email']
    ordering_fields = ['name', 'created_at']


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier', 'is_active']
    search_fields = ['name', 'barcode', 'series_number', 'description']
    ordering_fields = ['name', 'created_at', 'quantity', 'purchase_price', 'selling_price']

    def get_serializer_class(self):
        if self.action == 'list':
            return MedicineListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MedicineCreateSerializer
        return MedicineDetailSerializer

    def get_queryset(self):
        qs = Medicine.objects.all()
        if self.action == 'list':
            qs = qs.select_related('category', 'supplier')
        elif self.action == 'retrieve':
            qs = qs.prefetch_related('batches').select_related('category', 'supplier')
        return qs

    def perform_create(self, serializer):
        medicine = serializer.save()
        from apps.notifications.models import Notification
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for user in User.objects.filter(is_active=True, is_blocked=False):
            Notification.objects.create(
                user=user,
                type='medicine',
                title='Yangi mahsulot qo\'shildi',
                message=f'{medicine.name} mahsuloti omborga qo\'shildi',
            )


class MedicineBatchViewSet(viewsets.ModelViewSet):
    queryset = MedicineBatch.objects.all()
    serializer_class = MedicineBatchSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['medicine']
    ordering_fields = ['-created_at']
