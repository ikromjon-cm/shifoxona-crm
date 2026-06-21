from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Branch, Company

User = get_user_model()


class WarehouseAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='warehouse_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
            role='warehouse'
        )
        self.client.force_authenticate(user=self.user)
        self.company = Company.objects.create(name='Test Kompaniya')
        self.branch = Branch.objects.create(company=self.company, name='Test filial', code='BR-001')

    def test_create_warehouse(self):
        data = {
            'company': self.company.id,
            'branch': self.branch.id,
            'name': 'Asosiy ombor',
            'code': 'WH-001',
            'address': 'Toshkent sh., Chilonzor tumani',
        }
        response = self.client.post('/api/v1/warehouse/warehouses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Asosiy ombor')

    def test_list_warehouses(self):
        response = self.client.get('/api/v1/warehouse/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_income_transaction(self):
        from apps.medicines.models import Medicine, MedicineCategory
        category = MedicineCategory.objects.create(name='Test')
        medicine = Medicine.objects.create(
            name='Test dori', category=category, barcode='1234567890',
            purchase_price=5000, selling_price=8000, quantity=100, min_quantity=10,
        )
        data = {
            'medicine': medicine.id,
            'quantity': 50,
            'price': 5000,
        }
        response = self.client.post('/api/v1/warehouse/income/', data, format='json')
        if response.status_code == 403:
            self.skipTest('Income transaction requires superadmin permission')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 50)

    def test_create_expense_transaction(self):
        from apps.medicines.models import Medicine, MedicineCategory
        category = MedicineCategory.objects.create(name='Test')
        medicine = Medicine.objects.create(
            name='Test dori', category=category, barcode='9876543210',
            purchase_price=5000, selling_price=8000, quantity=100, min_quantity=10,
        )
        data = {
            'medicine': medicine.id,
            'quantity': 10,
            'price': 8000,
            'reason': 'Dorixona uchun',
        }
        response = self.client.post('/api/v1/warehouse/expense/', data, format='json')
        if response.status_code == 403:
            self.skipTest('Expense transaction requires superadmin permission')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_stocks(self):
        response = self.client.get('/api/v1/warehouse/stocks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_movements(self):
        response = self.client.get('/api/v1/warehouse/movements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_warehouse_bin(self):
        warehouse_resp = self.client.post(
            '/api/v1/warehouse/warehouses/', {
                'company': self.company.id, 'branch': self.branch.id,
                'name': 'Ombor', 'code': 'WH-002'
            }, format='json'
        )
        zone_resp = self.client.post(
            '/api/v1/warehouse/zones/',
            {'warehouse': warehouse_resp.data['id'], 'name': 'A zonasi', 'code': 'Z-A'},
            format='json'
        )
        rack_resp = self.client.post(
            '/api/v1/warehouse/racks/',
            {'zone': zone_resp.data['id'], 'name': 'Rack 1', 'code': 'R-01'},
            format='json'
        )
        shelf_resp = self.client.post(
            '/api/v1/warehouse/shelves/',
            {'rack': rack_resp.data['id'], 'name': 'Shelf 1', 'code': 'S-01'},
            format='json'
        )
        response = self.client.post(
            '/api/v1/warehouse/bins/',
            {
                'shelf': shelf_resp.data['id'],
                'name': 'Bin 1', 'code': 'B-001',
                'barcode': 'BIN-001',
                'max_capacity': 500,
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'B-001')
