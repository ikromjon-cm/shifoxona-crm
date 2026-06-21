from django.conf import settings
from django.db import models
from django.utils import timezone


class Delivery(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Kutilmoqda'),
        ('assigned', 'Kuryer biriktirildi'),
        ('picked', 'Olindi'),
        ('in_transit', "Yo'lda"),
        ('delivered', 'Yetkazildi'),
        ('cancelled', 'Bekor qilindi'),
    )
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='delivery', verbose_name='Buyurtma')
    courier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries', verbose_name='Kuryer', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Holati', db_index=True)
    assigned_at = models.DateTimeField(blank=True, null=True, verbose_name='Biriktirilgan vaqt')
    picked_at = models.DateTimeField(blank=True, null=True, verbose_name='Olingan vaqt')
    delivered_at = models.DateTimeField(blank=True, null=True, verbose_name='Yetkazilgan vaqt')
    courier_lat = models.FloatField(blank=True, null=True, verbose_name='Kuryer kenglik')
    courier_lng = models.FloatField(blank=True, null=True, verbose_name='Kuryer uzunlik')
    courier_location_updated_at = models.DateTimeField(blank=True, null=True, verbose_name='Joylashuv yangilangan vaqt')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Yetkazib berish'
        verbose_name_plural = 'Yetkazib berishlar'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['courier', 'status']),
        ]

    def __str__(self):
        return f'Delivery for {self.order.order_number}'


class DeliveryLocationLog(models.Model):
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='location_logs', verbose_name='Yetkazib berish')
    courier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='location_logs', verbose_name='Kuryer')
    latitude = models.FloatField(verbose_name='Kenglik')
    longitude = models.FloatField(verbose_name='Uzunlik')
    accuracy = models.FloatField(blank=True, null=True, verbose_name='Aniqlik')
    speed = models.FloatField(blank=True, null=True, verbose_name='Tezlik (km/h)')
    bearing = models.FloatField(blank=True, null=True, verbose_name='Yo\'nalish')
    battery_level = models.IntegerField(blank=True, null=True, verbose_name='Batareya (%)')
    recorded_at = models.DateTimeField(default=timezone.now, verbose_name='Qayd etilgan vaqt')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Joylashuv tarixi'
        verbose_name_plural = 'Joylashuv tarixi'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['delivery', 'recorded_at']),
        ]

    def __str__(self):
        return f'{self.delivery.order.order_number} @ {self.recorded_at}'
