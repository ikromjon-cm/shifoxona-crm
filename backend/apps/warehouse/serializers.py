from rest_framework import serializers
from .models import IncomeTransaction, ExpenseTransaction, InventoryMovement
from apps.medicines.models import Supplier
from apps.pharmacies.models import Pharmacy


class IncomeTransactionListSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = IncomeTransaction
        fields = ['id', 'medicine', 'medicine_name', 'supplier', 'supplier_name', 'quantity', 'price',
                  'total_amount', 'document', 'note', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class IncomeTransactionCreateSerializer(serializers.ModelSerializer):
    supplier = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = IncomeTransaction
        fields = ['id', 'medicine', 'supplier', 'quantity', 'price', 'document', 'note', 'created_at']
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

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None
