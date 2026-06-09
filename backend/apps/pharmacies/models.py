from django.db import models


class Pharmacy(models.Model):
    name = models.CharField(max_length=255, verbose_name='Dorixona nomi')
    address = models.TextField(verbose_name='Manzil')
    latitude = models.FloatField(blank=True, null=True, verbose_name='Kenglik')
    longitude = models.FloatField(blank=True, null=True, verbose_name='Uzunlik')
    phone = models.CharField(max_length=20, verbose_name='Telefon raqami')
    responsible_person = models.CharField(max_length=255, verbose_name='Mas\'ul shaxs')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Dorixona'
        verbose_name_plural = 'Dorixonalar'
        ordering = ['name']

    def __str__(self):
        return self.name


class PharmacyProduct(models.Model):
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='products', verbose_name='Dorixona')
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='pharmacy_products', verbose_name='Mahsulot')
    quantity = models.IntegerField(default=0, verbose_name='Dorixonadagi soni')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Dorixonadagi mahsulot'
        verbose_name_plural = 'Dorixonadagi mahsulotlar'
        unique_together = ['pharmacy', 'medicine']
        ordering = ['pharmacy', 'medicine']

    def __str__(self):
        return f'{self.pharmacy.name} - {self.medicine.name} ({self.quantity})'
