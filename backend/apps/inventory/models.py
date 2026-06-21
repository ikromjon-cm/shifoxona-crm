from django.conf import settings
from django.db import models


class Inventory(models.Model):
    medicine = models.OneToOneField('medicines.Medicine', on_delete=models.CASCADE, related_name='inventory', verbose_name='Mahsulot')
    quantity = models.IntegerField(default=0, verbose_name='Ombordagi miqdor')
    min_quantity = models.IntegerField(default=10, verbose_name='Minimal miqdor')
    max_quantity = models.IntegerField(blank=True, null=True, verbose_name='Maksimal miqdor')
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name='Joylashuv')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Inventar'
        verbose_name_plural = 'Inventarlar'
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.medicine.name} - {self.quantity} dona'

    @property
    def is_low(self):
        return self.quantity <= self.min_quantity

    @property
    def is_overstock(self):
        if self.max_quantity:
            return self.quantity >= self.max_quantity
        return False


class InventoryCount(models.Model):
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='inventory_counts', verbose_name='Mahsulot')
    actual_quantity = models.IntegerField(verbose_name='Haqiqiy miqdor')
    system_quantity = models.IntegerField(verbose_name='Tizimdagi miqdor')
    difference = models.IntegerField(verbose_name='Farq', editable=False)
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    counted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='Kim sanagan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Inventar sanog\'i'
        verbose_name_plural = 'Inventar sanoqlari'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.difference = self.actual_quantity - self.system_quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.medicine.name} - Haqiqiy: {self.actual_quantity}, Tizim: {self.system_quantity}'
