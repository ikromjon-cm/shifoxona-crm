from drf_spectacular.utils import extend_schema_field
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.medicines.models import Medicine, Supplier
from apps.orders.models import Order
from apps.pharmacies.models import Pharmacy
from apps.tasks.models import Task

from .models import (
    ExpenseTransaction,
    IncomeTransaction,
    InventoryMovement,
    PickOrder,
    PickOrderItem,
    PickWave,
    Stock,
    Warehouse,
    WarehouseBin,
    WarehouseRack,
    WarehouseShelf,
    WarehouseZone,
)

User = get_user_model()


class WarehouseSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class WarehouseZoneSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = WarehouseZone
        fields = '__all__'


class WarehouseRackSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = WarehouseRack
        fields = '__all__'


class WarehouseShelfSerializer(serializers.ModelSerializer):
    rack_name = serializers.CharField(source='rack.name', read_only=True)

    class Meta:
        model = WarehouseShelf
        fields = '__all__'


class WarehouseBinSerializer(serializers.ModelSerializer):
    shelf_name = serializers.CharField(source='shelf.name', read_only=True)
    shelf_code = serializers.CharField(source='shelf.code', read_only=True)

    class Meta:
        model = WarehouseBin
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    bin_code = serializers.CharField(source='warehouse_bin.code', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True, allow_null=True)
    expiry_date = serializers.DateField(source='batch.expiry_date', read_only=True, allow_null=True)

    class Meta:
        model = Stock
        fields = '__all__'
        read_only_fields = ['available_quantity', 'created_at', 'updated_at']


class IncomeTransactionListSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = IncomeTransaction
        fields = ['id', 'medicine', 'medicine_name', 'supplier', 'supplier_name', 'quantity', 'price',
                  'total_amount', 'document', 'note', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class IncomeTransactionCreateSerializer(serializers.ModelSerializer):
    supplier = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), allow_null=True, required=False
    )
    warehouse_bin = serializers.PrimaryKeyRelatedField(
        queryset=WarehouseBin.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = IncomeTransaction
        fields = ['id', 'medicine', 'supplier', 'warehouse_bin', 'quantity', 'price', 'document', 'note', 'created_at']
        read_only_fields = ['created_at']

    def validate_supplier(self, value):
        if value == '' or value is None:
            return None
        return value


class ExpenseTransactionListSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseTransaction
        fields = ['id', 'medicine', 'medicine_name', 'pharmacy', 'pharmacy_name', 'quantity', 'price',
                  'total_amount', 'reason', 'note', 'recipient_name',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class ExpenseTransactionCreateSerializer(serializers.ModelSerializer):
    pharmacy = serializers.PrimaryKeyRelatedField(
        queryset=Pharmacy.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = ExpenseTransaction
        fields = ['id', 'medicine', 'pharmacy', 'quantity', 'price', 'reason', 'note', 'recipient_name', 'created_at']
        read_only_fields = ['created_at']

    def validate_pharmacy(self, value):
        if value == '' or value is None:
            return None
        return value


class InventoryMovementSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryMovement
        fields = ['id', 'medicine', 'medicine_name', 'movement_type', 'quantity', 'quantity_before',
                  'quantity_after', 'reference_type', 'reference_id', 'note', 'created_by', 'created_by_name', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class PickWaveSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PickWave
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_item_count(self, obj):
        return PickOrderItem.objects.filter(pick_order__wave=obj).count()


class PickWaveCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickWave
        fields = ['warehouse', 'assigned_to', 'note']


class PickOrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    bin_code = serializers.CharField(source='warehouse_bin.code', read_only=True, allow_null=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True, allow_null=True)
    picked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PickOrderItem
        fields = '__all__'
        read_only_fields = ['created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_picked_by_name(self, obj):
        if obj.picked_by:
            return obj.picked_by.get_full_name()
        return None


class PickOrderItemCreateSerializer(serializers.Serializer):
    medicine = serializers.PrimaryKeyRelatedField(queryset=Medicine.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class PickOrderListSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    strategy_display = serializers.CharField(source='get_strategy_display', read_only=True)

    class Meta:
        model = PickOrder
        fields = ['id', 'pick_number', 'wave', 'order', 'task', 'warehouse', 'warehouse_name',
                  'status', 'status_display', 'strategy', 'strategy_display',
                  'assigned_to', 'assigned_to_name', 'created_by', 'created_by_name',
                  'item_count', 'started_at', 'completed_at', 'note',
                  'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_item_count(self, obj):
        return obj.items.count()


class PickOrderDetailSerializer(serializers.ModelSerializer):
    items = PickOrderItemSerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PickOrder
        fields = '__all__'

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class PickOrderCreateSerializer(serializers.Serializer):
    wave = serializers.PrimaryKeyRelatedField(queryset=PickWave.objects.all(), required=False, allow_null=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), required=False, allow_null=True)
    task = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all(), required=False, allow_null=True)
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    strategy = serializers.ChoiceField(choices=Warehouse.PICKING_STRATEGIES, default='fefo')
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    items = PickOrderItemCreateSerializer(many=True)
    note = serializers.CharField(required=False, allow_blank=True)
