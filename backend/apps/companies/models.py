from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=255, verbose_name='Kompaniya nomi')
    short_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='Qisqa nom')
    inn = models.CharField(max_length=50, unique=True, verbose_name='INN/STIR')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    address = models.TextField(verbose_name='Manzil')
    logo = models.ImageField(upload_to='companies/logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    license_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Litsenziya raqami')
    license_expiry = models.DateField(blank=True, null=True, verbose_name='Litsenziya amal qilish muddati')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Kompaniya'
        verbose_name_plural = 'Kompaniyalar'
        ordering = ['name']

    def __str__(self):
        return self.name


class Branch(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='branches', verbose_name='Kompaniya')
    name = models.CharField(max_length=255, verbose_name='Filial nomi')
    code = models.CharField(max_length=50, unique=True, verbose_name='Filial kodi')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Telefon')
    address = models.TextField(verbose_name='Manzil')
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Filial'
        verbose_name_plural = 'Filiallar'
        ordering = ['company', 'name']
        unique_together = ['company', 'code']

    def __str__(self):
        return f'{self.company.name} - {self.name}'


class Department(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='departments', verbose_name='Filial')
    name = models.CharField(max_length=255, verbose_name="Bo'lim nomi")
    code = models.CharField(max_length=50, verbose_name="Bo'lim kodi")
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = "Bo'lim"
        verbose_name_plural = "Bo'limlar"
        ordering = ['branch', 'name']
        unique_together = ['branch', 'code']

    def __str__(self):
        return f'{self.branch.name} - {self.name}'


class Position(models.Model):
    name = models.CharField(max_length=255, verbose_name='Lavozim')
    code = models.CharField(max_length=50, unique=True, verbose_name='Lavozim kodi')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='positions')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Lavozim'
        verbose_name_plural = 'Lavozimlar'
        ordering = ['name']

    def __str__(self):
        return self.name
