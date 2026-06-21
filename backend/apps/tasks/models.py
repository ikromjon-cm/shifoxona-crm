from django.conf import settings
from django.db import models
from django.utils import timezone


class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Past'),
        ('medium', "O'rta"),
        ('high', 'Yuqori'),
        ('urgent', 'Shoshilinch'),
    )
    STATUS_CHOICES = (
        ('pending', 'Kutilmoqda'),
        ('in_progress', 'Bajarilmoqda'),
        ('completed', 'Bajarilgan'),
        ('cancelled', 'Bekor qilingan'),
        ('on_hold', 'To\'xtatilgan'),
    )
    TASK_TYPES = (
        ('pick', 'Komplektatsiya'),
        ('pack', 'Qadoqlash'),
        ('load', 'Yuklash'),
        ('deliver', 'Yetkazish'),
        ('count', 'Inventarizatsiya'),
        ('receiving', 'Qabul qilish'),
        ('maintenance', 'Texnik xizmat'),
        ('other', 'Boshqa'),
    )
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, null=True, blank=True, related_name='tasks', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, null=True, blank=True, related_name='tasks', verbose_name='Filial')
    title = models.CharField(max_length=500, verbose_name='Vazifa sarlavhasi')
    description = models.TextField(blank=True, null=True, verbose_name='Tavsif')
    task_type = models.CharField(max_length=20, choices=TASK_TYPES, default='other', verbose_name='Vazifa turi', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='Prioritet', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Holat')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks', verbose_name='Topshiriq beruvchi')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='my_tasks', verbose_name='Bajaruvchi')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name='Buyurtma')
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name='Ombor')
    due_date = models.DateTimeField(blank=True, null=True, verbose_name='Bajarish muddati')
    started_at = models.DateTimeField(blank=True, null=True, verbose_name='Boshlangan vaqt')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Tugallangan vaqt')
    estimated_minutes = models.IntegerField(default=0, verbose_name='Taxminiy vaqt (daqiqa)')
    actual_minutes = models.IntegerField(default=0, verbose_name='Haqiqiy vaqt (daqiqa)')
    is_private = models.BooleanField(default=False, verbose_name='Shaxsiy')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Vazifa'
        verbose_name_plural = 'Vazifalar'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status', 'assigned_to']),
            models.Index(fields=['company', 'branch', 'status']),
        ]

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'

    def start(self):
        self.status = 'in_progress'
        self.started_at = timezone.now()
        self.save()

    def complete(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.actual_minutes = int(delta.total_seconds() / 60)
        self.save()


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments', verbose_name='Vazifa')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_comments', verbose_name='Foydalanuvchi')
    text = models.TextField(verbose_name='Matn')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vazifa izohi'
        verbose_name_plural = 'Vazifa izohlari'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.text[:50]}'


class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments', verbose_name='Vazifa')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_attachments', verbose_name='Foydalanuvchi')
    file = models.FileField(upload_to='task_attachments/', verbose_name='Fayl')
    filename = models.CharField(max_length=500, verbose_name='Fayl nomi')
    file_size = models.IntegerField(default=0, verbose_name='Fayl hajmi (bayt)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vazifa fayli'
        verbose_name_plural = 'Vazifa fayllari'
        ordering = ['-created_at']

    def __str__(self):
        return self.filename
