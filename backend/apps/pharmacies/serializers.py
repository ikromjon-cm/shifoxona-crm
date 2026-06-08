from rest_framework import serializers
from .models import Pharmacy, PharmacyProduct


class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['id', 'name', 'address', 'phone', 'responsible_person', 'responsible_phone', 'is_active', 'created_at', 'updated_at']


class PharmacyProductSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    barcode = serializers.CharField(source='medicine.barcode', read_only=True)

    class Meta:
        model = PharmacyProduct
        fields = ['id', 'pharmacy', 'pharmacy_name', 'medicine', 'medicine_name', 'barcode', 'quantity', 'created_at', 'updated_at']


class PharmacyDetailSerializer(serializers.ModelSerializer):
    products = PharmacyProductSerializer(many=True, read_only=True, source='products.all')

    class Meta:
        model = Pharmacy
        fields = ['id', 'name', 'address', 'phone', 'responsible_person', 'responsible_phone', 'is_active', 'products', 'created_at', 'updated_at']
