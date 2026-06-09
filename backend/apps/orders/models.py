from django.db import models
from django.conf import settings


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Kutilmoqda'),
        ('confirmed', 'Tasdiqlandi'),
        ('preparing', 'Tayyorlanmoqda'),
        ('shipped', "Yo'lga chiqdi"),
        ('delivered', 'Yetkazildi'),
        ('received', 'Dorixona qabul qildi'),
        ('cancelled', 'Bekor qilindi'),
    )
    order_number = models.CharField(max_length=20, unique=True, verbose_name='Buyurtma raqami')
    pharmacy = models.ForeignKey('pharmacies.Pharmacy', on_delete=models.CASCADE, related_name='orders', verbose_name='Dorixona')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders', verbose_name='Buyurtmachi')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Holati')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='Jami summa')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    received_at = models.DateTimeField(blank=True, null=True, verbose_name='Qabul qilingan vaqt')
    received_by = models.CharField(max_length=255, blank=True, null=True, verbose_name='Qabul qilgan shaxs')
    receive_note = models.TextField(blank=True, null=True, verbose_name='Qabul qilish izohi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Buyurtma'
        verbose_name_plural = 'Buyurtmalar'
        ordering = ['-created_at']

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            last = Order.objects.select_for_update().order_by('id').last()
            num = (last.id + 1) if last else 1
            self.order_number = f'ORDER-{num:06d}'
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='Buyurtma')
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='order_items', verbose_name='Mahsulot')
    quantity = models.IntegerField(verbose_name='Miqdori')
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Narxi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Buyurtma mahsuloti'
        verbose_name_plural = 'Buyurtma mahsulotlari'

    def __str__(self):
        return f'{self.order.order_number} - {self.medicine.name}'
