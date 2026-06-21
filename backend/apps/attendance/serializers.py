from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import AttendanceRecord, AttendanceSession, GeofenceZone, LeaveRequest, Shift


class GeofenceZoneSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = GeofenceZone
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ShiftSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Shift
        fields = '__all__'


class AttendanceRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    shift_name = serializers.CharField(source='shift.name', read_only=True, allow_null=True)
    geofence_zone_name = serializers.CharField(source='geofence_zone.name', read_only=True, allow_null=True)

    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['created_at']

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class AttendanceRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ['attendance_type', 'latitude', 'longitude', 'method', 'shift',
                  'geofence_zone', 'photo', 'device_info', 'note', 'timestamp']
        read_only_fields = ['timestamp']
        extra_kwargs = {
            'attendance_type': {'required': False},
        }

    def validate(self, attrs):
        lat = attrs.get('latitude')
        lng = attrs.get('longitude')
        geofence_zone = attrs.get('geofence_zone')

        if geofence_zone and lat is not None and lng is not None:
            if not geofence_zone.contains_location(lat, lng):
                raise serializers.ValidationError({
                    'location': f'Siz geofence zonasidan tashqaridasiz. Zona: {geofence_zone.name}'
                })
        return attrs


class AttendanceSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    shift_name = serializers.CharField(source='shift.name', read_only=True, allow_null=True)
    check_in_time = serializers.DateTimeField(source='check_in.timestamp', read_only=True, allow_null=True)
    check_out_time = serializers.DateTimeField(source='check_out.timestamp', read_only=True, allow_null=True)

    class Meta:
        model = AttendanceSession
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class LeaveRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'approved_at']

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return obj.user.get_full_name()

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None

    def validate(self, attrs):
        if attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'Tugash sanasi boshlanish sanasidan oldin bo\'lishi mumkin emas'
                })
        return attrs


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason', 'document']

    def validate(self, attrs):
        if attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'Tugash sanasi boshlanish sanasidan oldin bo\'lishi mumkin emas'
                })
        return attrs


class LeaveRequestActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)
