from django.contrib import admin

from .models import AttendanceRecord, AttendanceSession, GeofenceZone, LeaveRequest, Shift


@admin.register(GeofenceZone)
class GeofenceZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'zone_type', 'company', 'branch', 'latitude', 'longitude', 'radius', 'is_active']
    list_filter = ['zone_type', 'is_active', 'company']
    search_fields = ['name', 'address']


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'branch', 'start_time', 'end_time', 'grace_period', 'is_active']
    list_filter = ['is_active', 'company']
    search_fields = ['name']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'attendance_type', 'timestamp', 'status', 'method', 'geofence_zone', 'shift']
    list_filter = ['attendance_type', 'status', 'method', 'geofence_zone']
    search_fields = ['user__login', 'user__first_name', 'user__last_name']
    date_hierarchy = 'timestamp'


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'shift', 'status', 'check_in', 'check_out', 'total_hours', 'overtime_hours']
    list_filter = ['status']
    search_fields = ['user__login', 'user__first_name', 'user__last_name']
    date_hierarchy = 'date'


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'leave_type', 'start_date', 'end_date', 'status', 'approved_by', 'created_at']
    list_filter = ['leave_type', 'status']
    search_fields = ['user__login', 'user__first_name', 'user__last_name', 'reason']
    date_hierarchy = 'start_date'
