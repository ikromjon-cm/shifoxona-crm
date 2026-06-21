from rest_framework import serializers

from .models import Medicine, MedicineBatch, MedicineCategory, Supplier


class MedicineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineCategory
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address', 'region', 'district', 'latitude', 'longitude', 'is_active', 'created_at', 'updated_at']


class MedicineBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineBatch
        fields = ['id', 'medicine', 'series_number', 'quantity', 'purchase_price', 'selling_price', 'production_date', 'expiry_date', 'created_at']


class MedicineListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medicine
        fields = ['id', 'name', 'category', 'category_name', 'supplier', 'supplier_name', 'series_number', 'barcode',
                  'purchase_price', 'selling_price', 'quantity', 'min_quantity', 'is_low_stock',
                  'image', 'description', 'is_active', 'created_at', 'updated_at']


class MedicineDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    batches = MedicineBatchSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = ['id', 'name', 'category', 'category_name', 'supplier', 'supplier_name', 'series_number', 'barcode',
                  'purchase_price', 'selling_price', 'quantity', 'min_quantity', 'is_low_stock',
                  'image', 'description', 'is_active', 'batches', 'created_at', 'updated_at']


class MedicineCreateSerializer(serializers.ModelSerializer):
    barcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Medicine
        fields = ['id', 'name', 'category', 'supplier', 'series_number', 'barcode',
                  'purchase_price', 'selling_price', 'quantity', 'min_quantity',
                  'image', 'description', 'is_active']

    def validate_barcode(self, value):
        if not value:
            import uuid
            return uuid.uuid4().hex[:12].upper()
        return value
