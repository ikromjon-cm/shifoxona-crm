from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Employee, PasswordResetCode, User


class UserAdmin(BaseUserAdmin):
    list_display = ['login', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'is_blocked', 'created_at']
    list_filter = ['role', 'is_active', 'is_blocked']
    search_fields = ['login', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('login', 'password')}),
        ('Shaxsiy ma\'lumotlar', {'fields': ('first_name', 'last_name', 'phone', 'position')}),
        ('Ruxsatlar', {'fields': ('role', 'is_active', 'is_blocked', 'is_staff', 'is_superuser')}),
        ('Vaqt', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('login', 'first_name', 'last_name', 'phone', 'role', 'password1', 'password2'),
        }),
    )


admin.site.register(User, UserAdmin)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'branch', 'department', 'position', 'employee_id', 'is_active']
    list_filter = ['is_active', 'company', 'branch', 'department']
    search_fields = ['user__login', 'user__first_name', 'user__last_name', 'employee_id']


@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'created_at', 'is_used']
    list_filter = ['is_used']
    search_fields = ['user__login', 'code']
