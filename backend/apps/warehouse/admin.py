from django.contrib import admin

from .models import (ExpenseTransaction, IncomeTransaction, InventoryMovement,
                     PickOrder, PickOrderItem, PickWave, Stock, Warehouse,
                     WarehouseBin, WarehouseRack, WarehouseShelf, WarehouseZone)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'branch', 'picking_strategy', 'is_active']
    list_filter = ['is_active', 'picking_strategy', 'company']
    search_fields = ['name', 'code', 'company__name']


@admin.register(WarehouseZone)
class WarehouseZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'warehouse', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code', 'warehouse__name']


@admin.register(WarehouseRack)
class WarehouseRackAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'zone', 'max_weight', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code', 'zone__name']


@admin.register(WarehouseShelf)
class WarehouseShelfAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'rack', 'level', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(WarehouseBin)
class WarehouseBinAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'barcode', 'shelf', 'max_capacity', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code', 'barcode']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'warehouse_bin', 'batch', 'quantity', 'reserved_quantity', 'available_quantity']
    search_fields = ['medicine__name', 'warehouse_bin__code']
    readonly_fields = ['available_quantity']


@admin.register(PickWave)
class PickWaveAdmin(admin.ModelAdmin):
    list_display = ['wave_number', 'warehouse', 'status', 'assigned_to', 'created_by', 'created_at']
    list_filter = ['status']
    search_fields = ['wave_number', 'warehouse__name']


@admin.register(PickOrder)
class PickOrderAdmin(admin.ModelAdmin):
    list_display = ['pick_number', 'order', 'warehouse', 'status', 'strategy', 'assigned_to', 'created_by', 'created_at']
    list_filter = ['status', 'strategy']
    search_fields = ['pick_number', 'warehouse__name']


@admin.register(PickOrderItem)
class PickOrderItemAdmin(admin.ModelAdmin):
    list_display = ['pick_order', 'medicine', 'batch', 'warehouse_bin', 'requested_quantity', 'picked_quantity', 'is_picked']
    list_filter = ['is_picked']
    search_fields = ['pick_order__pick_number', 'medicine__name']


@admin.register(IncomeTransaction)
class IncomeTransactionAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'supplier', 'quantity', 'price', 'total_amount', 'created_by', 'created_at']
    list_filter = ['supplier']
    search_fields = ['medicine__name', 'supplier__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['total_amount']


@admin.register(ExpenseTransaction)
class ExpenseTransactionAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'pharmacy', 'quantity', 'price', 'total_amount', 'created_by', 'created_at']
    list_filter = ['pharmacy']
    search_fields = ['medicine__name', 'pharmacy__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['total_amount']


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'movement_type', 'quantity', 'quantity_before', 'quantity_after', 'created_by', 'created_at']
    list_filter = ['movement_type']
    search_fields = ['medicine__name']
    date_hierarchy = 'created_at'
