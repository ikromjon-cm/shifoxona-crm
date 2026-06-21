from django.contrib import admin

from .models import Medicine, MedicineBatch, MedicineCategory, Supplier


@admin.register(MedicineCategory)
class MedicineCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active']
    search_fields = ['name', 'phone', 'email']


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'barcode', 'quantity', 'min_quantity', 'purchase_price', 'selling_price', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'barcode', 'series_number']


@admin.register(MedicineBatch)
class MedicineBatchAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'series_number', 'quantity', 'expiry_date']
    list_filter = ['expiry_date']
    search_fields = ['series_number']
