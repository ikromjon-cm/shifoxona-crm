from django.db import models
from django.conf import settings
from django.utils import timezone


class IncomeTransaction(models.Model):
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='income_transactions', verbose_name='Mahsulot')
    supplier = models.ForeignKey('medicines.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='income_transactions', verbose_name='Yetkazib beruvchi')
    quantity = models.IntegerField(verbose_name='Miqdori')
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Narxi')
    total_amount = models.DecimalField(max_digits=20, decimal_places=2, verbose_name='Jami summa', editable=False)
    document = models.FileField(upload_to='documents/income/', blank=True, null=True, verbose_name='Hujjat')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='income_transactions', verbose_name='Kim qabul qilgan')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Sana')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Kirim'
        verbose_name_plural = 'Kirimlar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.medicine.name} - {self.quantity} dona ({self.created_at.date()})'

    def save(self, *args, **kwargs):
        self.total_amount = self.price * self.quantity
        super().save(*args, **kwargs)


class ExpenseTransaction(models.Model):
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='expense_transactions', verbose_name='Mahsulot')
    pharmacy = models.ForeignKey('pharmacies.Pharmacy', on_delete=models.SET_NULL, null=True, blank=True, related_name='expense_transactions', verbose_name='Dorixona')
    recipient_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Qabul qiluvchi')
    quantity = models.IntegerField(verbose_name='Miqdori')
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Narxi')
    total_amount = models.DecimalField(max_digits=20, decimal_places=2, verbose_name='Jami summa', editable=False)
    reason = models.TextField(blank=True, null=True, verbose_name='Chiqim sababi')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='expense_transactions', verbose_name='Kim bergan')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Sana')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        verbose_name = 'Chiqim'
        verbose_name_plural = 'Chiqimlar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.medicine.name} - {self.quantity} dona ({self.created_at.date()})'

    def save(self, *args, **kwargs):
        self.total_amount = self.price * self.quantity
        super().save(*args, **kwargs)


class InventoryMovement(models.Model):
    MOVEMENT_TYPES = (
        ('income', 'Kirim'),
        ('expense', 'Chiqim'),
        ('adjustment', 'Tuzatish'),
    )
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='movements', verbose_name='Mahsulot')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, verbose_name='Harakat turi')
    quantity = models.IntegerField(verbose_name='Miqdor')
    quantity_before = models.IntegerField(verbose_name='Oldingi miqdor')
    quantity_after = models.IntegerField(verbose_name='Keyingi miqdor')
    reference_type = models.CharField(max_length=50, blank=True, null=True, verbose_name='Havola turi')
    reference_id = models.IntegerField(blank=True, null=True, verbose_name='Havola ID')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='Kim bajargan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Inventar harakati'
        verbose_name_plural = 'Inventar harakatlari'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_movement_type_display()} - {self.medicine.name} ({self.quantity})'
