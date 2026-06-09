from rest_framework import serializers
from .models import Delivery


class DeliverySerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    pharmacy_name = serializers.CharField(source='order.pharmacy.name', read_only=True)
    pharmacy_phone = serializers.CharField(source='order.pharmacy.phone', read_only=True)
    pharmacy_address = serializers.CharField(source='order.pharmacy.address', read_only=True)
    pharmacy_latitude = serializers.FloatField(source='order.pharmacy.latitude', read_only=True)
    pharmacy_longitude = serializers.FloatField(source='order.pharmacy.longitude', read_only=True)
    courier_name = serializers.CharField(source='courier.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Delivery
        fields = ['id', 'order', 'order_number', 'pharmacy_name', 'pharmacy_phone',
                  'pharmacy_address', 'pharmacy_latitude', 'pharmacy_longitude',
                  'courier', 'courier_name', 'status', 'status_display',
                  'assigned_at', 'picked_at', 'delivered_at',
                  'courier_lat', 'courier_lng', 'courier_location_updated_at',
                  'note', 'created_at', 'updated_at']


class DeliveryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['order', 'courier', 'note']


class CourierLocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
