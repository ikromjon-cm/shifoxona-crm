
from django.conf import settings
from django.db import models
from django.utils import timezone


class Warehouse(models.Model):
    PICKING_STRATEGIES = (
        ('fefo', 'FEFO — First Expiry, First Out'),
        ('fifo', 'FIFO — First In, First Out'),
        ('lifo', 'LIFO — Last In, First Out'),
    )
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='warehouses', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='warehouses', verbose_name='Filial')
    name = models.CharField(max_length=255, verbose_name='Ombor nomi')
    code = models.CharField(max_length=50, verbose_name='Ombor kodi')
    address = models.TextField(blank=True, null=True, verbose_name='Manzil')
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    picking_strategy = models.CharField(max_length=10, choices=PICKING_STRATEGIES, default='fefo', verbose_name='Komplektatsiya strategiyasi')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ombor'
        verbose_name_plural = 'Omborlar'
        ordering = ['company', 'branch', 'name']
        unique_together = ['company', 'code']

    def __str__(self):
        return f'{self.company.name} - {self.name}'


class WarehouseZone(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zones', verbose_name='Ombor')
    name = models.CharField(max_length=255, verbose_name='Zona nomi')
    code = models.CharField(max_length=50, verbose_name='Zona kodi')
    description = models.TextField(blank=True, null=True, verbose_name='Tavsif')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Ombor zonasi'
        verbose_name_plural = 'Ombor zonalari'
        ordering = ['warehouse', 'name']
        unique_together = ['warehouse', 'code']

    def __str__(self):
        return f'{self.warehouse.name} - {self.name}'


class WarehouseRack(models.Model):
    zone = models.ForeignKey(WarehouseZone, on_delete=models.CASCADE, related_name='racks', verbose_name='Zona')
    name = models.CharField(max_length=255, verbose_name='Rack nomi')
    code = models.CharField(max_length=50, verbose_name='Rack kodi')
    max_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Maksimal og\'irlik (kg)')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Rack'
        verbose_name_plural = 'Racklar'
        ordering = ['zone', 'name']
        unique_together = ['zone', 'code']

    def __str__(self):
        return f'{self.zone.name} - {self.name}'


class WarehouseShelf(models.Model):
    rack = models.ForeignKey(WarehouseRack, on_delete=models.CASCADE, related_name='shelves', verbose_name='Rack')
    name = models.CharField(max_length=255, verbose_name='Shelf nomi')
    code = models.CharField(max_length=50, verbose_name='Shelf kodi')
    level = models.IntegerField(default=1, verbose_name='Sath')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Shelf'
        verbose_name_plural = 'Shelf-lar'
        ordering = ['rack', 'level', 'name']
        unique_together = ['rack', 'code']

    def __str__(self):
        return f'{self.rack.name} - {self.name} (Sath {self.level})'


class WarehouseBin(models.Model):
    shelf = models.ForeignKey(WarehouseShelf, on_delete=models.CASCADE, related_name='bins', verbose_name='Shelf')
    name = models.CharField(max_length=255, verbose_name='Bin nomi')
    code = models.CharField(max_length=50, verbose_name='Bin kodi')
    barcode = models.CharField(max_length=100, blank=True, null=True, verbose_name='Barcode')
    max_capacity = models.IntegerField(default=0, verbose_name='Maksimal sig\'im')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Bin'
        verbose_name_plural = 'Bin-lar'
        ordering = ['shelf', 'name']
        unique_together = ['shelf', 'code']

    def __str__(self):
        return f'{self.shelf.name} - {self.name}'


class IncomeTransaction(models.Model):
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='income_transactions', verbose_name='Mahsulot')
    supplier = models.ForeignKey('medicines.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='income_transactions', verbose_name='Yetkazib beruvchi')
    warehouse_bin = models.ForeignKey(WarehouseBin, on_delete=models.SET_NULL, null=True, blank=True, related_name='income_transactions', verbose_name='Bin')
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
        indexes = [
            models.Index(fields=['medicine', 'created_at']),
            models.Index(fields=['supplier']),
        ]

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
        indexes = [
            models.Index(fields=['medicine', 'created_at']),
            models.Index(fields=['pharmacy']),
        ]

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
        ('reserve', 'Zahiralash'),
        ('unreserve', 'Zahiradan chiqarish'),
        ('transfer', 'Ko\'chirish'),
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
        indexes = [
            models.Index(fields=['medicine', 'movement_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.get_movement_type_display()} - {self.medicine.name} ({self.quantity})'


class Stock(models.Model):
    warehouse_bin = models.ForeignKey(WarehouseBin, on_delete=models.CASCADE, related_name='stocks', verbose_name='Bin')
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='stocks', verbose_name='Mahsulot')
    batch = models.ForeignKey('medicines.MedicineBatch', on_delete=models.CASCADE, related_name='stocks', verbose_name='Batch', null=True, blank=True)
    quantity = models.IntegerField(default=0, verbose_name='Miqdor')
    reserved_quantity = models.IntegerField(default=0, verbose_name='Zahiralangan miqdor')
    available_quantity = models.IntegerField(default=0, verbose_name='Mavjud miqdor', editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Stok'
        verbose_name_plural = 'Stoklar'
        ordering = ['warehouse_bin', 'medicine']
        unique_together = ['warehouse_bin', 'medicine', 'batch']
        indexes = [
            models.Index(fields=['medicine', 'warehouse_bin']),
            models.Index(fields=['batch']),
        ]

    def __str__(self):
        return f'{self.medicine.name} - {self.warehouse_bin.code} ({self.quantity})'

    def save(self, *args, **kwargs):
        self.available_quantity = self.quantity - self.reserved_quantity
        super().save(*args, **kwargs)

    def reserve(self, qty):
        if qty > self.available_quantity:
            raise ValueError(f'Yetarli stok yo\'q. Mavjud: {self.available_quantity}, talab: {qty}')
        self.reserved_quantity = models.F('reserved_quantity') + qty
        self.save(update_fields=['reserved_quantity'])
        self.refresh_from_db()

    def unreserve(self, qty):
        if qty > self.reserved_quantity:
            self.reserved_quantity = 0
        else:
            self.reserved_quantity = models.F('reserved_quantity') - qty
        self.save(update_fields=['reserved_quantity'])
        self.refresh_from_db()

    def pick(self, qty):
        if qty > self.available_quantity:
            raise ValueError(f'Yetarli stok yo\'q. Mavjud: {self.available_quantity}, talab: {qty}')
        self.quantity = models.F('quantity') - qty
        self.reserved_quantity = models.F('reserved_quantity') - qty
        self.save(update_fields=['quantity', 'reserved_quantity'])
        self.refresh_from_db()


class StockManager(models.Manager):
    def find_picking_batches(self, medicine, warehouse, quantity, strategy='fefo'):
        """Find best stock locations for picking using specified strategy."""
        bins = WarehouseBin.objects.filter(
            shelf__rack__zone__warehouse=warehouse,
            is_active=True,
        )
        stocks = self.filter(
            medicine=medicine,
            warehouse_bin__in=bins,
            available_quantity__gt=0,
        ).select_related('batch', 'warehouse_bin__shelf__rack__zone')

        if strategy == 'fefo':
            stocks = stocks.filter(batch__isnull=False).order_by(
                'batch__expiry_date', 'batch__batch_number', 'warehouse_bin__code'
            )
        elif strategy == 'fifo':
            stocks = stocks.order_by('created_at', 'warehouse_bin__code')
        elif strategy == 'lifo':
            stocks = stocks.order_by('-created_at', 'warehouse_bin__code')

        result = []
        remaining = quantity
        for stock in stocks:
            if remaining <= 0:
                break
            take = min(stock.available_quantity, remaining)
            result.append({
                'stock': stock,
                'bin': stock.warehouse_bin,
                'batch': stock.batch,
                'quantity': take,
                'available': stock.available_quantity,
            })
            remaining -= take

        if remaining > 0:
            raise ValueError(
                f'Omborda yetarli mahsulot yo\'q. "{medicine.name}" dan {quantity} dona kerak, '
                f'faqat {quantity - remaining} dona topildi.'
            )

        return result

    def fefo(self, medicine, warehouse, quantity):
        return self.find_picking_batches(medicine, warehouse, quantity, 'fefo')

    def fifo(self, medicine, warehouse, quantity):
        return self.find_picking_batches(medicine, warehouse, quantity, 'fifo')

    def lifo(self, medicine, warehouse, quantity):
        return self.find_picking_batches(medicine, warehouse, quantity, 'lifo')


Stock.add_to_class('objects', StockManager())


class PickWave(models.Model):
    """A group of pick orders that are picked together in a single wave."""
    WAVE_STATUS = (
        ('pending', 'Kutilmoqda'),
        ('in_progress', 'Komplektatsiya'),
        ('completed', 'Tugallangan'),
        ('cancelled', 'Bekor qilingan'),
    )
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='pick_waves', verbose_name='Kompaniya')
    branch = models.ForeignKey('companies.Branch', on_delete=models.CASCADE, related_name='pick_waves', verbose_name='Filial')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='pick_waves', verbose_name='Ombor')
    wave_number = models.CharField(max_length=50, unique=True, verbose_name='To\'lqin raqami')
    status = models.CharField(max_length=20, choices=WAVE_STATUS, default='pending', verbose_name='Holat')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_waves', verbose_name='Komplektator')
    started_at = models.DateTimeField(blank=True, null=True, verbose_name='Boshlangan vaqt')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Tugallangan vaqt')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_pick_waves', verbose_name='Kim yaratgan')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Komplektatsiya to\'lqini'
        verbose_name_plural = 'Komplektatsiya to\'lqinlari'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.wave_number} - {self.get_status_display()}'


class PickOrder(models.Model):
    """A pick order for a specific order or task."""
    PICK_STATUS = (
        ('pending', 'Kutilmoqda'),
        ('in_progress', 'Komplektatsiya'),
        ('picked', 'Komplektatsiya qilingan'),
        ('cancelled', 'Bekor qilingan'),
    )
    wave = models.ForeignKey(PickWave, on_delete=models.CASCADE, related_name='pick_orders', verbose_name='To\'lqin', null=True, blank=True)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_orders', verbose_name='Buyurtma')
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_orders', verbose_name='Vazifa')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='pick_orders', verbose_name='Ombor')
    pick_number = models.CharField(max_length=50, unique=True, verbose_name='Komplektatsiya raqami')
    status = models.CharField(max_length=20, choices=PICK_STATUS, default='pending', verbose_name='Holat')
    strategy = models.CharField(max_length=10, choices=Warehouse.PICKING_STRATEGIES, default='fefo', verbose_name='Strategiya')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_orders', verbose_name='Komplektator')
    started_at = models.DateTimeField(blank=True, null=True, verbose_name='Boshlangan vaqt')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Tugallangan vaqt')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_pick_orders', verbose_name='Kim yaratgan')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Komplektatsiya buyrug\'i'
        verbose_name_plural = 'Komplektatsiya buyruqlari'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.pick_number} - {self.get_status_display()}'

    def start(self):
        self.status = 'in_progress'
        self.started_at = timezone.now()
        self.save()

    def complete(self):
        from apps.delivery.models import Delivery
        self.status = 'picked'
        self.completed_at = timezone.now()
        self.save()
        if self.order and not hasattr(self.order, 'delivery'):
            Delivery.objects.create(order=self.order, status='pending')


class PickOrderItem(models.Model):
    """Individual item to pick - each line represents stock from one bin+batch."""
    pick_order = models.ForeignKey(PickOrder, on_delete=models.CASCADE, related_name='items', verbose_name='Komplektatsiya buyrug\'i')
    stock = models.ForeignKey(Stock, on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_items', verbose_name='Stok')
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.CASCADE, related_name='pick_items', verbose_name='Mahsulot')
    batch = models.ForeignKey('medicines.MedicineBatch', on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_items', verbose_name='Batch')
    warehouse_bin = models.ForeignKey(WarehouseBin, on_delete=models.SET_NULL, null=True, blank=True, related_name='pick_items', verbose_name='Bin')
    requested_quantity = models.IntegerField(verbose_name='Talab qilingan miqdor')
    picked_quantity = models.IntegerField(default=0, verbose_name='Komplektatsiya qilingan')
    is_picked = models.BooleanField(default=False, verbose_name='Komplektatsiya qilingan')
    picked_at = models.DateTimeField(blank=True, null=True, verbose_name='Komplektatsiya vaqti')
    picked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='picked_items', verbose_name='Kim komplektatsiya qilgan')
    note = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Komplektatsiya mahsuloti'
        verbose_name_plural = 'Komplektatsiya mahsulotlari'
        ordering = ['pick_order', 'id']

    def __str__(self):
        return f'{self.medicine.name} x {self.picked_quantity}/{self.requested_quantity}'

    def pick(self, user, qty=None):
        from django.db import transaction
        qty = qty or self.requested_quantity
        with transaction.atomic():
            if self.stock:
                self.stock.pick(qty)
            self.picked_quantity = qty
            self.is_picked = True
            self.picked_at = timezone.now()
            self.picked_by = user
            self.save()

            InventoryMovement.objects.create(
                medicine=self.medicine,
                movement_type='expense',
                quantity=qty,
                quantity_before=self.stock.quantity + qty if self.stock else 0,
                quantity_after=self.stock.quantity if self.stock else 0,
                reference_type='PickOrderItem',
                reference_id=self.id,
                note=f'Pick: {self.pick_order.pick_number}',
                created_by=user,
            )
