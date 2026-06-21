from django.contrib import admin

from .models import Pharmacy, PharmacyProduct


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'responsible_person', 'is_active', 'created_at']
    search_fields = ['name', 'phone', 'responsible_person']


@admin.register(PharmacyProduct)
class PharmacyProductAdmin(admin.ModelAdmin):
    list_display = ['pharmacy', 'medicine', 'quantity']
    list_filter = ['pharmacy']
