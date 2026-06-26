from django.contrib import admin

from .models import DeviceToken, Notification, NotificationSetting


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'user', 'is_read', 'is_global', 'created_at']
    list_filter = ['type', 'is_read', 'is_global']


@admin.register(NotificationSetting)
class NotificationSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'low_stock', 'expiry', 'income', 'expense']


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'platform', 'is_active', 'created_at']
    list_filter = ['platform', 'is_active']
