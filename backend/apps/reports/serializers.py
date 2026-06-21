from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'title', 'report_type', 'file_format', 'file', 'filters', 'created_by', 'created_by_name', 'is_ready', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class ReportGenerateSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPES)
    file_format = serializers.ChoiceField(choices=Report.FORMAT_CHOICES, default='xlsx')
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    pharmacy_id = serializers.IntegerField(required=False)
    medicine_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
