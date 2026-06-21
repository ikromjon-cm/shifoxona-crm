import math

from django.conf import settings
from django.db import models
from django.utils import timezone


class GeofenceZone(models.Model):
    ZONE_TYPES = (
        ('warehouse', 'Ombor'),
        ('pharmacy', 'Dorixona'),
        ('office', 'Ofis'),
        ('other', 'Boshqa'),
    )
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='geofence_zones', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='geofence_zones', verbose_name='Filial')
    name = models.CharField(max_length=255, verbose_name='Zona nomi')
    zone_type = models.CharField(max_length=20, choices=ZONE_TYPES, default='warehouse', verbose_name='Zona turi')
    latitude = models.FloatField(verbose_name='Kenglik')
    longitude = models.FloatField(verbose_name='Uzunlik')
    radius = models.IntegerField(default=100, verbose_name='Radius (metr)')
    address = models.TextField(blank=True, null=True, verbose_name='Manzil')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Geofence zona'
        verbose_name_plural = 'Geofence zonalar'
        ordering = ['company', 'branch', 'name']

    def __str__(self):
        return f'{self.name} ({self.latitude}, {self.longitude})'

    def contains_location(self, lat, lng):
        """Check if a point is within the geofence radius using Haversine formula."""
        R = 6371000
        dlat = math.radians(lat - self.latitude)
        dlng = math.radians(lng - self.longitude)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(self.latitude)) * math.cos(math.radians(lat)) * math.sin(dlng / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance <= self.radius


class Shift(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='shifts', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='shifts', verbose_name='Filial')
    name = models.CharField(max_length=255, verbose_name='Smena nomi')
    start_time = models.TimeField(verbose_name='Boshlanish vaqti')
    end_time = models.TimeField(verbose_name='Tugash vaqti')
    grace_period = models.IntegerField(default=15, verbose_name='Kechikish muddati (daqiqa)')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Smena'
        verbose_name_plural = 'Smenalar'
        ordering = ['company', 'branch', 'start_time']
        unique_together = ['company', 'branch', 'name']

    def __str__(self):
        return f'{self.name} ({self.start_time}-{self.end_time})'


class AttendanceRecord(models.Model):
    ATTENDANCE_TYPES = (
        ('check_in', "Kelish"),
        ('check_out', 'Ketish'),
    )
    ATTENDANCE_METHODS = (
        ('manual', "Qo'lda"),
        ('qr', 'QR kod'),
        ('face', "Yuz tanib olish"),
        ('auto', 'Avtomatik'),
    )
    STATUS_CHOICES = (
        ('on_time', 'O\'z vaqtida'),
        ('late', 'Kechikkan'),
        ('early_leave', 'Erta ketgan'),
        ('overtime', 'Qo\'shimcha ish'),
        ('missed', 'Tushirib qoldirilgan'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records', verbose_name='Foydalanuvchi')
    attendance_type = models.CharField(max_length=20, choices=ATTENDANCE_TYPES, verbose_name='Tur', db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, verbose_name='Vaqt')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='on_time', verbose_name='Holat', db_index=True)
    method = models.CharField(max_length=20, choices=ATTENDANCE_METHODS, default='manual', verbose_name='Usul')
    latitude = models.FloatField(blank=True, null=True, verbose_name='Kenglik')
    longitude = models.FloatField(blank=True, null=True, verbose_name='Uzunlik')
    geofence_zone = models.ForeignKey(GeofenceZone, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Geofence zona')
    is_within_geofence = models.BooleanField(default=False, verbose_name='Geofence ichida')
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Smena')
    photo = models.ImageField(upload_to='attendance/', blank=True, null=True, verbose_name='Rasm')
    device_info = models.CharField(max_length=500, blank=True, null=True, verbose_name='Qurilma ma\'lumoti')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP manzil')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Davomat yozuvi'
        verbose_name_plural = 'Davomat yozuvlari'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['user', 'attendance_type', 'timestamp']),
        ]

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.get_attendance_type_display()} ({self.timestamp})'


class AttendanceSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_sessions', verbose_name='Foydalanuvchi')
    date = models.DateField(verbose_name='Sana')
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Smena')
    check_in = models.ForeignKey(AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='session_check_in', verbose_name='Kelish')
    check_out = models.ForeignKey(AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='session_check_out', verbose_name='Ketish')
    geofence_zone = models.ForeignKey(GeofenceZone, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Geofence zona')
    status = models.CharField(max_length=20, choices=AttendanceRecord.STATUS_CHOICES, default='on_time', verbose_name='Holat', db_index=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Jami soat')
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Qo\'shimcha soat')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Davomat sessiyasi'
        verbose_name_plural = 'Davomat sessiyalari'
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.date}'

    def calculate_hours(self):
        if self.check_in and self.check_out:
            delta = self.check_out.timestamp - self.check_in.timestamp
            hours = delta.total_seconds() / 3600
            self.total_hours = round(hours, 2)
            if self.shift:
                shift_hours = (
                    (self.shift.end_time.hour * 60 + self.shift.end_time.minute) -
                    (self.shift.start_time.hour * 60 + self.shift.start_time.minute)
                ) / 60
                if hours > shift_hours:
                    self.overtime_hours = round(hours - shift_hours, 2)


class LeaveRequest(models.Model):
    LEAVE_TYPES = (
        ('annual', 'Yillik ta\'til'),
        ('sick', 'Kasal'),
        ('personal', 'Shaxsiy'),
        ('family', 'Oilaviy'),
        ('other', 'Boshqa'),
    )
    LEAVE_STATUS = (
        ('pending', 'Kutilmoqda'),
        ('approved', 'Tasdiqlangan'),
        ('rejected', 'Bekor qilingan'),
        ('cancelled', 'Bekor qilingan'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests', verbose_name='Foydalanuvchi')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, verbose_name='Ta\'til turi')
    start_date = models.DateField(verbose_name='Boshlanish sanasi')
    end_date = models.DateField(verbose_name='Tugash sanasi')
    reason = models.TextField(verbose_name='Sabab')
    status = models.CharField(max_length=20, choices=LEAVE_STATUS, default='pending', verbose_name='Holat', db_index=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leave_requests', verbose_name='Tasdiqlagan')
    approved_at = models.DateTimeField(blank=True, null=True, verbose_name='Tasdiqlangan vaqt')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Bekor qilish sababi')
    document = models.FileField(upload_to='leave_documents/', blank=True, null=True, verbose_name='Hujjat')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='leave_requests', verbose_name='Kompaniya', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ta\'til so\'rovi'
        verbose_name_plural = 'Ta\'til so\'rovlari'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.get_leave_type_display()} ({self.start_date}-{self.end_date})'

    def approve(self, approver):
        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.save()

    def reject(self, approver, reason):
        self.status = 'rejected'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()
