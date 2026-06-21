from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'description', 'model_name', 'object_id',
                  'data_before', 'data_after', 'ip_address', 'user_agent', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_user_name(self, obj):
        if obj.user:
            return f'{obj.user.first_name} {obj.user.last_name}'
        return 'Noma\'lum'
