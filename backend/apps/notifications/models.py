from django.conf import settings
from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('low_stock', 'Mahsulot kamaygan'),
        ('expiry', 'Muddati tugayotgan'),
        ('income', 'Yangi kirim'),
        ('expense', 'Yangi chiqim'),
        ('system', 'Tizim'),
        ('medicine', 'Mahsulot'),
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name='Tur', db_index=True)
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    message = models.TextField(verbose_name='Xabar')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications', verbose_name='Foydalanuvchi', db_index=True)
    is_read = models.BooleanField(default=False, verbose_name='O\'qilgan', db_index=True)
    is_global = models.BooleanField(default=False, verbose_name='Umumiy', db_index=True)
    link = models.CharField(max_length=500, blank=True, null=True, verbose_name='Havola')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Bildirishnoma'
        verbose_name_plural = 'Bildirishnomalar'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def mark_as_read(self):
        self.is_read = True
        self.save()

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and self.user_id:
            try:
                from .utils import send_realtime_notification
                send_realtime_notification(self.user_id, {
                    'id': self.id,
                    'title': self.title,
                    'message': self.message,
                    'type': self.type,
                    'link': self.link or '',
                    'created_at': str(self.created_at),
                })
            except Exception:
                pass


class NotificationSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings', verbose_name='Foydalanuvchi')
    low_stock = models.BooleanField(default=True, verbose_name='Mahsulot kamayganda')
    expiry = models.BooleanField(default=True, verbose_name='Muddati tugayotganda')
    income = models.BooleanField(default=True, verbose_name='Yangi kirim')
    expense = models.BooleanField(default=True, verbose_name='Yangi chiqim')
    push = models.BooleanField(default=True, verbose_name='Push bildirishnoma')
    telegram = models.BooleanField(default=False, verbose_name='Telegram')
    sms = models.BooleanField(default=False, verbose_name='SMS')

    class Meta:
        verbose_name = 'Bildirishnoma sozlamasi'
        verbose_name_plural = 'Bildirishnoma sozlamalari'

    def __str__(self):
        return f'{self.user} sozlamalari'


class DeviceToken(models.Model):
    PLATFORM_CHOICES = (
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens', verbose_name='Foydalanuvchi')
    token = models.CharField(max_length=500, verbose_name='FCM token')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='android', verbose_name='Platforma')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Qurilma tokeni'
        verbose_name_plural = 'Qurilma tokenlari'
        unique_together = ['user', 'token']

    def __str__(self):
        return f'{self.user.login} - {self.platform}'
