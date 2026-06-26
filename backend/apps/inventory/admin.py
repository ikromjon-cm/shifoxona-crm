from django.contrib import admin

from .models import Inventory, InventoryCount


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'quantity', 'min_quantity', 'max_quantity', 'is_low', 'is_overstock', 'updated_at']
    list_filter = ['min_quantity']
    search_fields = ['medicine__name', 'medicine__sku']
    readonly_fields = ['is_low', 'is_overstock']


@admin.register(InventoryCount)
class InventoryCountAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'system_quantity', 'actual_quantity', 'difference', 'counted_by', 'created_at']
    search_fields = ['medicine__name']
    date_hierarchy = 'created_at'
