from django.contrib import admin

from .models import Branch, Company, Department, Position


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_name', 'inn', 'phone', 'email', 'is_active', 'license_expiry']
    list_filter = ['is_active']
    search_fields = ['name', 'short_name', 'inn', 'phone']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'phone', 'address', 'is_active']
    list_filter = ['is_active', 'company']
    search_fields = ['name', 'code', 'company__name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'branch', 'is_active']
    list_filter = ['is_active', 'branch__company']
    search_fields = ['name', 'code', 'branch__name']


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
