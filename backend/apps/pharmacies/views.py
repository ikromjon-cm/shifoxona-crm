
from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, parsers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsSuperAdmin, IsSuperAdminOrReadOnly
from apps.accounts.serializers import get_tokens_for_user

from .models import Pharmacy, PharmacyProduct
from .serializers import (
    PharmacyApprovalSerializer,
    PharmacyDetailSerializer,
    PharmacyLoginSerializer,
    PharmacyProductSerializer,
    PharmacyRegisterSerializer,
    PharmacySerializer,
)

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


class PharmacyProfileView(generics.GenericAPIView):
    serializer_class = PharmacySerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return Response({'error': 'Dorixona topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PharmacySerializer(pharmacy).data)

    def patch(self, request):
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return Response({'error': 'Dorixona topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(pharmacy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema(exclude=True)
class PharmacyDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(120, key_prefix='pharmacy_dashboard'))
    def get(self, request):
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return Response({'error': 'Dorixona topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        from apps.delivery.models import Delivery

        today = timezone.now().date()
        orders_qs = pharmacy.orders.all()

        total_orders = orders_qs.count()
        pending_orders = orders_qs.filter(status='pending').count()
        in_transit = orders_qs.filter(status='shipped').count()
        delivered_today = orders_qs.filter(status='delivered', created_at__date=today).count()
        received_today = orders_qs.filter(status='received', created_at__date=today).count()
        total_items = pharmacy.products.aggregate(total=Sum('quantity'))['total'] or 0
        low_stock_count = pharmacy.products.filter(quantity__lte=5).count()

        active_deliveries = Delivery.objects.filter(
            order__pharmacy=pharmacy,
            status__in=['assigned', 'picked', 'in_transit'],
        ).select_related('courier').order_by('-created_at')

        delivery_data = []
        for d in active_deliveries:
            delivery_data.append({
                'id': d.id,
                'order_number': d.order.order_number,
                'status': d.status,
                'courier_name': d.courier.get_full_name() if d.courier else None,
                'courier_phone': d.courier.phone if d.courier else None,
                'courier_lat': d.courier_lat,
                'courier_lng': d.courier_lng,
                'estimated_arrival': None,
            })

        return Response({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'in_transit_orders': in_transit,
            'delivered_today': delivered_today,
            'received_today': received_today,
            'total_products': pharmacy.products.count(),
            'total_items_in_stock': total_items,
            'low_stock_count': low_stock_count,
            'active_deliveries': delivery_data,
        })
