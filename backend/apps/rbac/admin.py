from django.contrib import admin

from .models import Permission, Role, UserRole


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['model_name', 'action', 'codename']
    list_filter = ['model_name', 'action']
    search_fields = ['codename', 'description']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_system', 'is_active', 'created_at']
    list_filter = ['is_system', 'is_active']
    search_fields = ['name', 'code']
    filter_horizontal = ['permissions']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'company', 'branch', 'is_active', 'assigned_at']
    list_filter = ['is_active', 'role']
    search_fields = ['user__login', 'user__first_name', 'user__last_name', 'role__name']
