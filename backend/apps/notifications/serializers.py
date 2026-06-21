from rest_framework import serializers

from .models import DeviceToken, Notification, NotificationSetting


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'user', 'is_read', 'is_global', 'link', 'created_at']


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = ['id', 'user', 'low_stock', 'expiry', 'income', 'expense', 'push', 'telegram', 'sms']


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['id', 'token', 'platform', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        token, created = DeviceToken.objects.update_or_create(
            user=user,
            token=validated_data['token'],
            defaults={'platform': validated_data.get('platform', 'android'), 'is_active': True},
        )
        return token
