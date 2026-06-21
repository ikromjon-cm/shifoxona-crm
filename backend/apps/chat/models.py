from django.conf import settings
from django.db import models
from django.utils import timezone


class ChatRoom(models.Model):
    ROOM_TYPES = (
        ('direct', 'Shaxsiy'),
        ('group', 'Guruh'),
        ('task', 'Vazifa'),
        ('order', 'Buyurtma'),
        ('warehouse', 'Ombor'),
    )
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='chat_rooms', verbose_name='Kompaniya', null=True)
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='chat_rooms', verbose_name='Filial', null=True, blank=True)
    name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Xona nomi')
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='direct', verbose_name='Xona turi')
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_rooms', verbose_name='Vazifa')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_rooms', verbose_name='Buyurtma')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms', verbose_name='A\'zolar')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Chat xonasi'
        verbose_name_plural = 'Chat xonalari'
        ordering = ['-updated_at']

    def __str__(self):
        return self.name or f'{self.get_room_type_display()} #{self.id}'

    def last_message(self):
        return self.messages.order_by('-created_at').first()


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', verbose_name='Xona')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages', verbose_name='Yuboruvchi')
    text = models.TextField(blank=True, null=True, verbose_name='Matn')
    file = models.FileField(upload_to='chat_files/', blank=True, null=True, verbose_name='Fayl')
    is_read = models.BooleanField(default=False, verbose_name='O\'qilgan', db_index=True)
    read_at = models.DateTimeField(blank=True, null=True, verbose_name='O\'qilgan vaqt')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Xabar'
        verbose_name_plural = 'Xabarlar'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room', 'created_at']),
        ]

    def __str__(self):
        return f'{self.sender.get_full_name()}: {self.text[:50] or "[Fayl]"}'

    def mark_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
