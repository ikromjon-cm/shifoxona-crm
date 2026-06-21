from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Pharmacy, PharmacyProduct

User = get_user_model()


class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['id', 'user', 'name', 'stir_or_license', 'address', 'region', 'district',
                  'latitude', 'longitude', 'phone', 'responsible_person', 'image',
                  'is_active', 'is_approved', 'approved_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_approved', 'approved_at', 'created_at', 'updated_at']


class PharmacyProductSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    barcode = serializers.CharField(source='medicine.barcode', read_only=True)

    class Meta:
        model = PharmacyProduct
        fields = ['id', 'pharmacy', 'pharmacy_name', 'medicine', 'medicine_name', 'barcode', 'quantity', 'created_at', 'updated_at']


class PharmacyDetailSerializer(serializers.ModelSerializer):
    products = PharmacyProductSerializer(many=True, read_only=True, source='products.all')
    orders_count = serializers.SerializerMethodField()

    class Meta:
        model = Pharmacy
        fields = ['id', 'user', 'name', 'stir_or_license', 'address', 'region', 'district',
                  'latitude', 'longitude', 'phone', 'responsible_person', 'image',
                  'is_active', 'is_approved', 'approved_at', 'orders_count',
                  'products', 'created_at', 'updated_at']

    @extend_schema_field(serializers.IntegerField())
    def get_orders_count(self, obj):
        return obj.orders.count()


class PharmacyRegisterSerializer(serializers.ModelSerializer):
    login = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Pharmacy
        fields = ['name', 'stir_or_license', 'address', 'region', 'district',
                  'latitude', 'longitude', 'phone', 'responsible_person', 'image',
                  'login', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError('Parollar mos kelmadi')
        if User.objects.filter(login=data['login']).exists():
            raise serializers.ValidationError('Bu login band')
        return data

    def create(self, validated_data):
        login = validated_data.pop('login')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        image = validated_data.pop('image', None)

        user = User.objects.create_user(
            login=login,
            password=password,
            first_name=validated_data.get('responsible_person', ''),
            last_name='',
            phone=validated_data.get('phone', ''),
            role='pharmacy',
            is_active=False,
        )
        pharmacy = Pharmacy.objects.create(user=user, **validated_data)
        if image:
            pharmacy.image = image
            pharmacy.save()
        return pharmacy


class PharmacyLoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data.get('login')
        password = data.get('password')
        user = authenticate(request=self.context.get('request'), login=login, password=password)
        if not user:
            raise serializers.ValidationError('Login yoki parol noto\'g\'ri')
        if user.role != 'pharmacy':
            raise serializers.ValidationError('Bu dorixona hisobi emas')
        if not hasattr(user, 'pharmacy_profile') or not user.pharmacy_profile.is_approved:
            raise serializers.ValidationError('Dorixona hali tasdiqlanmagan')
        data['user'] = user
        return data


class PharmacyApprovalSerializer(serializers.Serializer):
    approve = serializers.BooleanField(default=True)
