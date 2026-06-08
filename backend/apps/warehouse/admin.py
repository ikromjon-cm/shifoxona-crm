from django.contrib import admin
from .models import IncomeTransaction, ExpenseTransaction, InventoryMovement


@admin.register(IncomeTransaction)
class IncomeTransactionAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'quantity', 'price', 'total_amount', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['medicine__name', 'supplier__name']


@admin.register(ExpenseTransaction)
class ExpenseTransactionAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'pharmacy', 'quantity', 'price', 'total_amount', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['medicine__name', 'pharmacy__name']


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'movement_type', 'quantity', 'quantity_before', 'quantity_after', 'created_at']
    list_filter = ['movement_type', 'created_at']
