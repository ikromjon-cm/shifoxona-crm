from django.contrib import admin

from .models import Delivery


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['order', 'courier', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number']
