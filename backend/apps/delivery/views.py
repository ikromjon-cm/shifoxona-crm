from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Delivery
from .serializers import DeliverySerializer, DeliveryCreateSerializer, CourierLocationSerializer
from apps.notifications.models import Notification

User = get_user_model()


class DeliveryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return DeliveryCreateSerializer
        return DeliverySerializer

    def get_queryset(self):
        qs = Delivery.objects.select_related('order__pharmacy', 'courier')
        user = self.request.user
        if user.role == 'pharmacy':
            if hasattr(user, 'pharmacy_profile'):
                qs = qs.filter(order__pharmacy=user.pharmacy_profile)
            else:
                qs = qs.none()
        return qs

    @action(detail=True, methods=['post'])
    def update_location(self, request, pk=None):
        serializer = CourierLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delivery = self.get_object()
        delivery.courier_lat = serializer.validated_data['latitude']
        delivery.courier_lng = serializer.validated_data['longitude']
        delivery.courier_location_updated_at = timezone.now()
        delivery.save(update_fields=['courier_lat', 'courier_lng', 'courier_location_updated_at'])
        return Response({'message': 'Joylashuv yangilandi'})

    @action(detail=True, methods=['post'])
    def assign_courier(self, request, pk=None):
        courier_id = request.data.get('courier_id')
        if not courier_id:
            return Response({'error': 'Kuryer ID si talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        delivery = self.get_object()
        try:
            courier = User.objects.get(id=courier_id, role='operator')
        except User.DoesNotExist:
            return Response({'error': 'Kuryer topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        delivery.courier = courier
        delivery.status = 'assigned'
        delivery.assigned_at = timezone.now()
        delivery.save()

        pharmacy_user = delivery.order.pharmacy.user if delivery.order.pharmacy and delivery.order.pharmacy.user else None
        if pharmacy_user and pharmacy_user.is_active:
            Notification.objects.create(
                user=pharmacy_user,
                type='system',
                title='Yetkazib berishga kuryer biriktirildi',
                message=f'{delivery.order.order_number} - kuryer: {courier.get_full_name() or courier.login}',
                link=f'/pharmacy/orders/{delivery.order.id}',
            )

        return Response(DeliverySerializer(delivery, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        new_status = request.data.get('status')
        if new_status not in dict(Delivery.STATUS_CHOICES):
            return Response({'error': 'Noto\'g\'ri holat'}, status=status.HTTP_400_BAD_REQUEST)
        delivery = self.get_object()
        delivery.status = new_status
        if new_status == 'picked':
            delivery.picked_at = timezone.now()
        elif new_status == 'delivered':
            delivery.delivered_at = timezone.now()
        delivery.save()

        status_labels = dict(Delivery.STATUS_CHOICES)
        pharmacy_user = delivery.order.pharmacy.user if delivery.order.pharmacy and delivery.order.pharmacy.user else None
        if pharmacy_user and pharmacy_user.is_active:
            Notification.objects.create(
                user=pharmacy_user,
                type='system',
                title='Yetkazib berish holati yangilandi',
                message=f'{delivery.order.order_number} - "{status_labels.get(new_status)}"',
                link=f'/pharmacy/orders/{delivery.order.id}',
            )

        return Response(DeliverySerializer(delivery, context={'request': request}).data)
