from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.pharmacies.serializers import PharmacySerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_barcode = serializers.CharField(source='medicine.barcode', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'medicine', 'medicine_name', 'medicine_barcode', 'quantity', 'price', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['medicine', 'quantity', 'price']


class OrderListSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    pharmacy_phone = serializers.CharField(source='pharmacy.phone', read_only=True)
    pharmacy_latitude = serializers.FloatField(source='pharmacy.latitude', read_only=True)
    pharmacy_longitude = serializers.FloatField(source='pharmacy.longitude', read_only=True)
    item_count = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'pharmacy', 'pharmacy_name', 'pharmacy_phone',
                  'pharmacy_latitude', 'pharmacy_longitude', 'status', 'total_amount',
                  'item_count', 'total_items', 'created_at', 'updated_at']

    @extend_schema_field(serializers.IntegerField())
    def get_item_count(self, obj):
        return obj.items.count()

    @extend_schema_field(serializers.IntegerField())
    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    pharmacy = PharmacySerializer(read_only=True)
    delivery_status = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'pharmacy', 'status', 'status_display', 'total_amount',
                  'items', 'note', 'delivery_status', 'received_at', 'received_by',
                  'receive_note', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_delivery_status(self, obj):
        if hasattr(obj, 'delivery'):
            return obj.delivery.get_status_display()
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = ['pharmacy', 'note', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        order.total_amount = sum(item.price * item.quantity for item in order.items.all())
        order.save(update_fields=['total_amount'])
        return order

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Kamida bitta mahsulot bo\'lishi kerak')
        return value


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True)


class OrderReceiveSerializer(serializers.Serializer):
    received_by = serializers.CharField(required=True)
    receive_note = serializers.CharField(required=False, allow_blank=True)
    issues = serializers.CharField(required=False, allow_blank=True)
