import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Demo ma\'lumotlar yaratish (medicines, suppliers, categories, warehouse)'

    def handle(self, *args, **options):
        from apps.companies.models import Branch, Company
        from apps.medicines.models import Medicine, MedicineBatch, MedicineCategory, Supplier
        from apps.warehouse.models import Warehouse, WarehouseBin, WarehouseRack, WarehouseShelf, WarehouseZone

        company, _ = Company.objects.get_or_create(
            name='Shifoxona Demo MChJ',
            defaults={
                'phone': '+998901234567',
                'email': 'info@shifoxona.uz',
                'is_active': True,
            }
        )
        branch, _ = Branch.objects.get_or_create(
            company=company,
            name='Asosiy filial',
            defaults={
                'address': 'Toshkent sh., Chilonzor tumani',
                'phone': '+998901234567',
                'is_active': True,
            }
        )
        self.stdout.write(f'Company: {company.name}, Branch: {branch.name}')

        categories = []
        cat_names = ['Antibiotiklar', 'Vitaminlar', 'Og\'riq qoldiruvchilar', 'Yurak dorilari', 'Shamollashga qarshi']
        for name in cat_names:
            cat, _ = MedicineCategory.objects.get_or_create(name=name)
            categories.append(cat)
        self.stdout.write(f'{len(categories)} kategoriya yaratildi')

        supplier_data = [
            ('Pharma Import UZ', '+998901111111', 'info@pharmaimport.uz', 'Toshkent'),
            ('Medikor Plus', '+998902222222', 'info@medikor.uz', 'Samarqand'),
            ('Global Med Supply', '+998903333333', 'info@globalmed.uz', 'Buxoro'),
            ('Dorixona Ta\'minot', '+998904444444', 'info@dorixona.uz', 'Toshkent'),
        ]
        suppliers = []
        for name, phone, email, address in supplier_data:
            sup, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'is_active': True,
                }
            )
            suppliers.append(sup)
        self.stdout.write(f'{len(suppliers)} ta yetkazib beruvchi yaratildi')

        if Medicine.objects.count() > 10:
            self.stdout.write('Dorilar allaqachon mavjud, o\'tkazib yuborildi')
            return

        medicines_data = [
            ('Amoksitsillin 500mg', 'AMOX500', '4870102000018', 5000, 12000, 10, categories[0], suppliers[0]),
            ('Sefaleksin 250mg', 'CEF250', '4870102000025', 8000, 18000, 5, categories[0], suppliers[0]),
            ('Vitamin C 1000mg', 'VITC1000', '4870102000032', 2000, 5000, 20, categories[1], suppliers[1]),
            ('Vitamin D3 2000IU', 'VITD3', '4870102000049', 3000, 8000, 15, categories[1], suppliers[1]),
            ('Paratsetamol 500mg', 'PARA500', '4870102000056', 1000, 3000, 50, categories[2], suppliers[2]),
            ('Ibuprofen 400mg', 'IBU400', '4870102000063', 3000, 7000, 30, categories[2], suppliers[2]),
            ('Aspirin 100mg', 'ASP100', '4870102000070', 1500, 4000, 40, categories[2], suppliers[3]),
            ('Kaptopril 25mg', 'CAPT25', '4870102000087', 4000, 10000, 8, categories[3], suppliers[0]),
            ('Metoprolol 50mg', 'METO50', '4870102000094', 5000, 12000, 12, categories[3], suppliers[1]),
            ('Loratadin 10mg', 'LORA10', '4870102000100', 2500, 6000, 25, categories[4], suppliers[2]),
            ('Amboksol 30mg', 'AMBR30', '4870102000117', 2000, 5000, 20, categories[4], suppliers[3]),
            ('Drotaverin 40mg', 'DROT40', '4870102000124', 3000, 7000, 18, categories[2], suppliers[0]),
        ]

        medicines = []
        for name, sku, barcode, purchase_price, selling_price, min_quantity, category, supplier in medicines_data:
            med, created = Medicine.objects.get_or_create(
                barcode=barcode,
                defaults={
                    'name': name,
                    'sku': sku,
                    'category': category,
                    'supplier': supplier,
                    'purchase_price': purchase_price,
                    'selling_price': selling_price,
                    'quantity': random.randint(50, 500),
                    'min_quantity': min_quantity,
                    'is_active': True,
                }
            )
            medicines.append(med)
        self.stdout.write(f'{len(medicines)} ta dori yaratildi')

        warehouse, _ = Warehouse.objects.get_or_create(
            company=company,
            code='WH-MAIN',
            defaults={
                'name': 'Asosiy ombor',
                'branch': branch,
                'address': 'Toshkent sh., Chilonzor 9-kvartal',
                'is_active': True,
            }
        )

        zones = []
        for z_name, z_code in [('A zona', 'Z-A'), ('B zona', 'Z-B'), ('C zona', 'Z-C')]:
            zone, _ = WarehouseZone.objects.get_or_create(
                warehouse=warehouse, code=z_code,
                defaults={'name': z_name, 'is_active': True}
            )
            zones.append(zone)

        racks = []
        for zone in zones:
            for r_name in ['Rack-01', 'Rack-02']:
                rack, _ = WarehouseRack.objects.get_or_create(
                    zone=zone, code=f'{zone.code}-{r_name}',
                    defaults={'name': r_name, 'is_active': True}
                )
                racks.append(rack)

        shelves = []
        for rack in racks:
            for s_name in ['Shelf-A', 'Shelf-B']:
                shelf, _ = WarehouseShelf.objects.get_or_create(
                    rack=rack, code=f'{rack.code}-{s_name}',
                    defaults={'name': s_name, 'is_active': True}
                )
                shelves.append(shelf)

        bins_created = 0
        for shelf in shelves[:6]:
            for b_name in ['Bin-1', 'Bin-2']:
                bin_obj, created = WarehouseBin.objects.get_or_create(
                    shelf=shelf, code=f'{shelf.code}-{b_name}',
                    defaults={'name': b_name, 'is_active': True}
                )
                if created:
                    bins_created += 1
        self.stdout.write(f'Ombor yaratildi: {warehouse.name}, {len(zones)} zona, {len(racks)} rack, {len(shelves)} shelf, {bins_created} bin')

        batch_count = 0
        for med in medicines:
            for _ in range(random.randint(1, 3)):
                batch, created = MedicineBatch.objects.get_or_create(
                    medicine=med,
                    series_number=f'SER{med.id}-{random.randint(100, 999)}',
                    defaults={
                        'batch_number': f'BATCH-{random.randint(1000, 9999)}',
                        'barcode': med.barcode,
                        'quantity': random.randint(10, 100),
                        'purchase_price': med.purchase_price,
                        'selling_price': med.selling_price,
                        'production_date': timezone.now().date() - timedelta(days=random.randint(30, 365)),
                        'expiry_date': timezone.now().date() + timedelta(days=random.randint(30, 730)),
                    }
                )
                if created:
                    batch_count += 1
        self.stdout.write(f'{batch_count} ta batch yaratildi')
        self.stdout.write(self.style.SUCCESS('Demo ma\'lumotlar muvaffaqiyatli yaratildi!'))
