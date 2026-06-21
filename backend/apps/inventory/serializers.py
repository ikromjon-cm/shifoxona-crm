from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Inventory, InventoryCount


class InventorySerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    barcode = serializers.CharField(source='medicine.barcode', read_only=True)
    is_low = serializers.BooleanField(read_only=True)
    is_overstock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'medicine', 'medicine_name', 'barcode', 'quantity', 'min_quantity', 'max_quantity',
                  'location', 'is_low', 'is_overstock', 'updated_at']


class InventoryCountSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    counted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryCount
        fields = ['id', 'medicine', 'medicine_name', 'actual_quantity', 'system_quantity', 'difference',
                  'note', 'counted_by', 'counted_by_name', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_counted_by_name(self, obj):
        if obj.counted_by:
            return f'{obj.counted_by.first_name} {obj.counted_by.last_name}'
        return None
