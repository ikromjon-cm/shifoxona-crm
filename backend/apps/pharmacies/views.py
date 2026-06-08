from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import Pharmacy, PharmacyProduct
from .serializers import PharmacySerializer, PharmacyDetailSerializer, PharmacyProductSerializer
from apps.accounts.permissions import IsSuperAdmin, IsSuperAdminOrReadOnly


class PharmacyViewSet(viewsets.ModelViewSet):
    queryset = Pharmacy.objects.all()
    permission_classes = [IsSuperAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'address', 'phone', 'responsible_person']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PharmacyDetailSerializer
        return PharmacySerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            return Pharmacy.objects.prefetch_related('products__medicine')
        return Pharmacy.objects.all()


class PharmacyProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PharmacyProduct.objects.all()
    serializer_class = PharmacyProductSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['pharmacy', 'medicine']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return PharmacyProduct.objects.select_related('medicine', 'pharmacy')
