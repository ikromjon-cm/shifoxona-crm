from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('low_stock', 'Mahsulot kamaygan'),
        ('expiry', 'Muddati tugayotgan'),
        ('income', 'Yangi kirim'),
        ('expense', 'Yangi chiqim'),
        ('system', 'Tizim'),
        ('medicine', 'Mahsulot'),
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name='Tur')
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    message = models.TextField(verbose_name='Xabar')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications', verbose_name='Foydalanuvchi')
    is_read = models.BooleanField(default=False, verbose_name='O\'qilgan')
    is_global = models.BooleanField(default=False, verbose_name='Umumiy')
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


class NotificationSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings', verbose_name='Foydalanuvchi')
    low_stock = models.BooleanField(default=True, verbose_name='Mahsulot kamayganda')
    expiry = models.BooleanField(default=True, verbose_name='Muddati tugayotganda')
    income = models.BooleanField(default=True, verbose_name='Yangi kirim')
    expense = models.BooleanField(default=True, verbose_name='Yangi chiqim')
    telegram = models.BooleanField(default=False, verbose_name='Telegram')
    sms = models.BooleanField(default=False, verbose_name='SMS')

    class Meta:
        verbose_name = 'Bildirishnoma sozlamasi'
        verbose_name_plural = 'Bildirishnoma sozlamalari'

    def __str__(self):
        return f'{self.user} sozlamalari'
