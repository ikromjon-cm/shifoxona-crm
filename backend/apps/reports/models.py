from django.db import models
from django.conf import settings
from django.utils import timezone


class Report(models.Model):
    REPORT_TYPES = (
        ('income', 'Kirim hisoboti'),
        ('expense', 'Chiqim hisoboti'),
        ('inventory', 'Inventar hisoboti'),
        ('expiry', 'Muddati tugayotgan mahsulotlar'),
        ('pharmacy', 'Dorixona hisoboti'),
        ('general', 'Umumiy hisobot'),
    )
    FORMAT_CHOICES = (
        ('xlsx', 'Excel'),
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
    )
    title = models.CharField(max_length=255, verbose_name='Hisobot nomi')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, verbose_name='Hisobot turi')
    file_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='xlsx', verbose_name='Format')
    file = models.FileField(upload_to='reports/', blank=True, null=True, verbose_name='Fayl')
    filters = models.JSONField(blank=True, null=True, verbose_name='Filtrlar', default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='Kim yaratgan')
    is_ready = models.BooleanField(default=False, verbose_name='Tayyor')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        verbose_name = 'Hisobot'
        verbose_name_plural = 'Hisobotlar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_report_type_display()} - {self.created_at.date()}'
