from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Permission, Role, UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'


class RoleSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    @extend_schema_field(serializers.IntegerField())
    def get_permission_count(self, obj):
        return obj.permissions.count()

    @extend_schema_field(serializers.IntegerField())
    def get_user_count(self, obj):
        return obj.user_roles.filter(is_active=True).count()


class RoleDetailSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Role
        fields = '__all__'

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if permission_ids is not None:
            instance.permissions.set(permission_ids)
        instance.save()
        return instance


class UserRoleSerializer(serializers.ModelSerializer):
    user_login = serializers.CharField(source='user.login', read_only=True)
    user_name = serializers.SerializerMethodField()
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_code = serializers.CharField(source='role.code', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)

    class Meta:
        model = UserRole
        fields = '__all__'
        extra_kwargs = {
            'company': {'required': False, 'allow_null': True},
            'branch': {'required': False, 'allow_null': True},
        }

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip()
