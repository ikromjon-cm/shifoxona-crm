from django.conf import settings
from django.db import models

PERMISSION_ACTIONS = [
    ('view', 'Ko\'rish'),
    ('create', 'Yaratish'),
    ('update', 'Tahrirlash'),
    ('delete', 'O\'chirish'),
    ('approve', 'Tasdiqlash'),
    ('export', 'Eksport'),
]

MODELS_REGISTRY = [
    ('company', 'Kompaniya'),
    ('branch', 'Filial'),
    ('department', "Bo'lim"),
    ('position', 'Lavozim'),
    ('user', 'Foydalanuvchi'),
    ('role', 'Rol'),
    ('medicine', 'Mahsulot'),
    ('category', 'Kategoriya'),
    ('supplier', "Yetkazib beruvchi"),
    ('warehouse_zone', 'Ombor zonasi'),
    ('warehouse_rack', 'Rack'),
    ('warehouse_shelf', 'Shelf'),
    ('warehouse_bin', 'Bin'),
    ('batch', 'Batch'),
    ('inventory', 'Inventar'),
    ('order', 'Buyurtma'),
    ('delivery', 'Yetkazish'),
    ('pharmacy', 'Dorixona'),
    ('income', 'Kirim'),
    ('expense', 'Chiqim'),
    ('report', 'Hisobot'),
    ('notification', 'Bildirishnoma'),
    ('attendance', 'Davomat'),
    ('finance', 'Moliya'),
    ('employee', 'Xodim'),
    ('driver', 'Haydovchi'),
    ('geofencezone', 'Geofence zona'),
    ('shift', 'Smena'),
    ('attendancerecord', 'Davomat yozuvi'),
    ('attendancesession', 'Davomat sessiyasi'),
    ('leaverequest', "Ta'til so'rovi"),
    ('task', 'Vazifa'),
    ('taskcomment', 'Vazifa izohi'),
    ('taskattachment', 'Vazifa fayli'),
    ('chatroom', 'Chat xonasi'),
    ('chatmessage', 'Xabar'),
    ('pickwave', 'Komplektatsiya to\'lqini'),
    ('pickorder', 'Komplektatsiya buyrug\'i'),
    ('pickorderitem', 'Komplektatsiya mahsuloti'),
    ('deliverylocationlog', 'Joylashuv tarixi'),
]


class Permission(models.Model):
    model_name = models.CharField(max_length=100, choices=MODELS_REGISTRY, verbose_name='Model')
    action = models.CharField(max_length=50, choices=PERMISSION_ACTIONS, verbose_name='Amal')
    codename = models.CharField(max_length=200, verbose_name='Kod nomi')
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name='Tavsif')

    class Meta:
        verbose_name = 'Ruxsat'
        verbose_name_plural = 'Ruxsatlar'
        ordering = ['model_name', 'action']
        unique_together = ['model_name', 'action']

    def __str__(self):
        return f'{self.get_model_name_display()} - {self.get_action_display()}'

    def save(self, *args, **kwargs):
        self.codename = f'{self.action}_{self.model_name}'
        super().save(*args, **kwargs)


class Role(models.Model):
    name = models.CharField(max_length=255, verbose_name='Rol nomi')
    code = models.CharField(max_length=100, unique=True, verbose_name='Rol kodi')
    description = models.TextField(blank=True, null=True, verbose_name='Tavsif')
    permissions = models.ManyToManyField(Permission, blank=True, verbose_name='Ruxsatlar')
    is_system = models.BooleanField(default=False, verbose_name='Tizim roli')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Rollar'
        ordering = ['name']

    def __str__(self):
        return self.name


class UserRole(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_roles', verbose_name='Foydalanuvchi')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles', verbose_name='Rol')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, null=True, blank=True, related_name='user_roles', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, null=True, blank=True, related_name='user_roles', verbose_name='Filial')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Foydalanuvchi roli'
        verbose_name_plural = 'Foydalanuvchi rollari'
        unique_together = ['user', 'role', 'company', 'branch']

    def __str__(self):
        return f'{self.user.login} - {self.role.name}'
