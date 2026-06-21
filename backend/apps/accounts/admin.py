from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


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
