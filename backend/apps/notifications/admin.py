from django.contrib import admin
from .models import Notification, NotificationSetting


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'user', 'is_read', 'is_global', 'created_at']
    list_filter = ['type', 'is_read', 'is_global']


@admin.register(NotificationSetting)
class NotificationSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'low_stock', 'expiry', 'income', 'expense']
