from django.db import models


class MedicineCategory(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name='Kategoriya nomi')
    description = models.TextField(blank=True, null=True, verbose_name='Tavsif')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Mahsulot kategoriyasi'
        verbose_name_plural = 'Mahsulot kategoriyalari'
        ordering = ['name']

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=255, verbose_name='Yetkazib beruvchi nomi')
    contact_person = models.CharField(max_length=255, blank=True, null=True, verbose_name='Aloqa shaxsi')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    address = models.TextField(blank=True, null=True, verbose_name='Manzil')
    region = models.CharField(max_length=255, blank=True, null=True, verbose_name='Viloyat')
    district = models.CharField(max_length=255, blank=True, null=True, verbose_name='Tuman')
    latitude = models.FloatField(blank=True, null=True, verbose_name='Kenglik')
    longitude = models.FloatField(blank=True, null=True, verbose_name='Uzunlik')
    is_active = models.BooleanField(default=True, verbose_name='Faol', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Yetkazib beruvchi'
        verbose_name_plural = 'Yetkazib beruvchilar'
        ordering = ['name']

    def __str__(self):
        return self.name


class Medicine(models.Model):
    name = models.CharField(max_length=255, verbose_name='Mahsulot nomi')
    category = models.ForeignKey(MedicineCategory, on_delete=models.SET_NULL, null=True, related_name='medicines', verbose_name='Kategoriya')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='medicines', verbose_name='Yetkazib beruvchi', db_index=True)
    sku = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name='SKU (Stock Keeping Unit)')
    series_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Seriya raqami')
    barcode = models.CharField(max_length=255, unique=True, verbose_name='Barcode', db_index=True)

    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Xarid narxi')
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Sotuv narxi')
    quantity = models.IntegerField(default=0, verbose_name='Ombordagi soni')
    min_quantity = models.IntegerField(default=10, verbose_name='Minimal qoldiq')

    image = models.ImageField(upload_to='medicines/', blank=True, null=True, verbose_name='Surat')
    description = models.TextField(blank=True, null=True, verbose_name='Tavsif')

    is_active = models.BooleanField(default=True, verbose_name='Faol', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Mahsulot'
        verbose_name_plural = 'Mahsulotlar'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} ({self.barcode})'

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity

    @property
    def is_expiring_soon(self):
        from datetime import timedelta

        from django.utils import timezone
        # Check expiry from batch records
        expiring_batches = self.batches.filter(
            expiry_date__lte=timezone.now().date() + timedelta(days=30),
            expiry_date__gte=timezone.now().date(),
            quantity__gt=0
        )
        return expiring_batches.exists()


class MedicineBatch(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='batches', verbose_name='Mahsulot')
    series_number = models.CharField(max_length=255, verbose_name='Seriya raqami')
    batch_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Batch raqami')
    barcode = models.CharField(max_length=255, blank=True, null=True, verbose_name='Barcode', db_index=True)
    qr_code = models.CharField(max_length=500, blank=True, null=True, verbose_name='QR kod')
    quantity = models.IntegerField(verbose_name='Miqdori')
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Xarid narxi')
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Sotuv narxi')
    production_date = models.DateField(blank=True, null=True, verbose_name='Ishlab chiqarilgan sana')
    expiry_date = models.DateField(verbose_name='Yaroqlilik muddati')
    certificate = models.FileField(upload_to='certificates/', blank=True, null=True, verbose_name='Sertifikat')
    storage_conditions = models.CharField(max_length=500, blank=True, null=True, verbose_name='Saqlash shartlari')
    is_recalled = models.BooleanField(default=False, verbose_name='Recall qilingan')
    recalled_at = models.DateTimeField(blank=True, null=True, verbose_name='Recall vaqti')
    recall_reason = models.TextField(blank=True, null=True, verbose_name='Recall sababi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Mahsulot partiyasi'
        verbose_name_plural = 'Mahsulot partiyalari'
        ordering = ['expiry_date', 'batch_number']
        indexes = [
            models.Index(fields=['expiry_date']),
            models.Index(fields=['medicine', 'expiry_date']),
        ]

    def __str__(self):
        return f'{self.medicine.name} - {self.batch_number or self.series_number}'

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()

    @property
    def days_until_expiry(self):
        from django.utils import timezone
        delta = self.expiry_date - timezone.now().date()
        return delta.days


from .signals import *  # noqa: F401, F403
