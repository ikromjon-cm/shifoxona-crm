from rest_framework import viewsets, filters, status, generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Pharmacy, PharmacyProduct
from .serializers import (
    PharmacySerializer, PharmacyDetailSerializer,
    PharmacyProductSerializer, PharmacyRegisterSerializer,
    PharmacyLoginSerializer, PharmacyApprovalSerializer
)
from apps.accounts.permissions import IsSuperAdmin, IsSuperAdminOrReadOnly
from apps.accounts.serializers import get_tokens_for_user

User = get_user_model()


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
            return Pharmacy.objects.prefetch_related('products__medicine', 'orders')
        return Pharmacy.objects.all()


class PharmacyProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PharmacyProduct.objects.all()
    serializer_class = PharmacyProductSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['pharmacy', 'medicine']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return PharmacyProduct.objects.select_related('medicine', 'pharmacy')


class PharmacyRegisterView(generics.CreateAPIView):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacyRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pharmacy = serializer.save()
        return Response({
            'message': 'Ro\'yxatdan o\'tish muvaffaqiyatli. Admin tomonidan tasdiqlanishi kutilmoqda.',
            'pharmacy': PharmacySerializer(pharmacy).data,
        }, status=status.HTTP_201_CREATED)


class PharmacyLoginView(generics.GenericAPIView):
    serializer_class = PharmacyLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'message': 'Muvaffaqiyatli tizimga kirdingiz',
            'tokens': tokens,
            'user': {
                'id': user.id,
                'login': user.login,
                'role': user.role,
                'pharmacy': PharmacySerializer(user.pharmacy_profile).data if hasattr(user, 'pharmacy_profile') else None,
            }
        })


class PharmacyApprovalView(generics.GenericAPIView):
    serializer_class = PharmacyApprovalSerializer
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            pharmacy = Pharmacy.objects.get(pk=pk)
        except Pharmacy.DoesNotExist:
            return Response({'error': 'Dorixona topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        approve = serializer.validated_data.get('approve', True)
        if approve:
            pharmacy.is_approved = True
            from django.utils import timezone
            pharmacy.approved_at = timezone.now()
            if pharmacy.user:
                pharmacy.user.is_active = True
                pharmacy.user.save()
            pharmacy.save()
            return Response({'message': 'Dorixona tasdiqlandi', 'pharmacy': PharmacySerializer(pharmacy).data})
        else:
            pharmacy.is_approved = False
            pharmacy.save()
            return Response({'message': 'Dorixona rad etildi', 'pharmacy': PharmacySerializer(pharmacy).data})
