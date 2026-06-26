from django.contrib import admin

from .models import Delivery, DeliveryLocationLog


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['order', 'courier', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number']


@admin.register(DeliveryLocationLog)
class DeliveryLocationLogAdmin(admin.ModelAdmin):
    list_display = ['delivery', 'courier', 'latitude', 'longitude', 'accuracy', 'created_at']
    date_hierarchy = 'created_at'
