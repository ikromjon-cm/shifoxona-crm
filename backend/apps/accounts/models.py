from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, login, password=None, **extra_fields):
        if not login:
            raise ValueError('Login talab qilinadi')
        user = self.model(login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'superadmin')
        return self.create_user(login, password, **extra_fields)


class User(AbstractUser):
    username = None
    ROLE_CHOICES = (
        ('superadmin', 'Super Admin'),
        ('operator', 'Operator'),
        ('pharmacy', 'Dorixona'),
    )
    login = models.CharField(max_length=150, unique=True, verbose_name='Login')
    first_name = models.CharField(max_length=150, verbose_name='Ism')
    last_name = models.CharField(max_length=150, verbose_name='Familiya')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator', verbose_name='Lavozim')
    position = models.CharField(max_length=255, blank=True, null=True, verbose_name='Lavozim (qo\'shimcha)')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    is_blocked = models.BooleanField(default=False, verbose_name='Bloklangan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    objects = UserManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone']

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.get_role_display()})'

    @property
    def is_super_admin(self):
        return self.role == 'superadmin'

    @property
    def is_operator(self):
        return self.role == 'operator'

    def block(self):
        self.is_blocked = True
        self.is_active = False
        self.save()

    def unblock(self):
        self.is_blocked = False
        self.is_active = True
        self.save()
