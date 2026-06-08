from rest_framework import serializers
from .models import Notification, NotificationSetting


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'user', 'is_read', 'is_global', 'link', 'created_at']


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = ['id', 'user', 'low_stock', 'expiry', 'income', 'expense', 'telegram', 'sms']
