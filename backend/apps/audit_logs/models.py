from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE', 'Yaratish'),
        ('UPDATE', 'Tahrirlash'),
        ('DELETE', 'O\'chirish'),
        ('LOGIN', 'Kirish'),
        ('LOGOUT', 'Chiqish'),
        ('EXPORT', 'Eksport'),
        ('IMPORT', 'Import'),
        ('BLOCK', 'Bloklash'),
        ('UNBLOCK', 'Blokdan chiqarish'),
        ('OTHER', 'Boshqa'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Foydalanuvchi')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='Harakat')
    description = models.TextField(verbose_name='Tavsif')
    model_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Model')
    object_id = models.IntegerField(blank=True, null=True, verbose_name='Ob\'ekt ID')
    data_before = models.JSONField(blank=True, null=True, verbose_name='Oldingi ma\'lumot')
    data_after = models.JSONField(blank=True, null=True, verbose_name='Keyingi ma\'lumot')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP manzil')
    user_agent = models.TextField(blank=True, null=True, verbose_name='Qurilma')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Audit yozuvi'
        verbose_name_plural = 'Audit yozuvlari'
        ordering = ['-created_at']

    def __str__(self):
        user_name = f'{self.user.first_name} {self.user.last_name}' if self.user else 'Noma\'lum'
        return f'{user_name} - {self.get_action_display()} ({self.created_at})'
