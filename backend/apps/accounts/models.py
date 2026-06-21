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
        ('admin', 'Admin'),
        ('operator', 'Operator'),
        ('warehouse', 'Omborchi'),
        ('driver', 'Haydovchi'),
        ('finance', 'Moliya'),
        ('pharmacy', 'Dorixona'),
    )
    login = models.CharField(max_length=150, unique=True, verbose_name='Login')
    first_name = models.CharField(max_length=150, verbose_name='Ism')
    last_name = models.CharField(max_length=150, verbose_name='Familiya')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator', verbose_name='Lavozim', db_index=True)
    position = models.CharField(max_length=255, blank=True, null=True, verbose_name='Lavozim (qo\'shimcha)')
    is_active = models.BooleanField(default=True, verbose_name='Faol', db_index=True)
    is_blocked = models.BooleanField(default=False, verbose_name='Bloklangan', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    # Enterprise fields
    company = models.ForeignKey('companies.Company', on_delete=models.SET_NULL, null=True, blank=True, related_name='users', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='users', verbose_name='Filial')
    department = models.ForeignKey('companies.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='users', verbose_name="Bo'lim")
    position_ref = models.ForeignKey('companies.Position', on_delete=models.SET_NULL, null=True, blank=True, related_name='users', verbose_name='Lavozim')

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
        return self.role in ['operator', 'admin']

    def block(self):
        self.is_blocked = True
        self.is_active = False
        self.save()

    def unblock(self):
        self.is_blocked = False
        self.is_active = True
        self.save()


class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', verbose_name='Foydalanuvchi')
    employee_id = models.CharField(max_length=50, unique=True, verbose_name='Xodim ID')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='employees', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='employees', verbose_name='Filial')
    department = models.ForeignKey('companies.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name="Bo'lim")
    position = models.ForeignKey('companies.Position', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name='Lavozim')
    hire_date = models.DateField(verbose_name='Ishga qabul sanasi')
    salary = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='Maosh')
    passport_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Pasport raqami')
    address = models.TextField(blank=True, null=True, verbose_name='Yashash manzili')
    emergency_contact = models.CharField(max_length=100, blank=True, null=True, verbose_name='Favqulodda kontakt')
    emergency_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Favqulodda telefon')
    photo = models.ImageField(upload_to='employees/', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Faol', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Xodim'
        verbose_name_plural = 'Xodimlar'
        ordering = ['company', 'branch', 'employee_id']

    def __str__(self):
        return f'{self.employee_id} - {self.user.get_full_name()}'


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Parolni tiklash kodi'
        verbose_name_plural = 'Parolni tiklash kodlari'

    def __str__(self):
        return f'{self.user.login} - {self.code}'
