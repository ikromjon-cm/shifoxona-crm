from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.medicines.models import Medicine, MedicineCategory

User = get_user_model()


class InventoryAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='inv_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.user)
        self.category = MedicineCategory.objects.create(name='Test')
        self.medicine = Medicine.objects.create(
            name='Analgin', category=self.category, barcode='998877',
            purchase_price=3000, selling_price=5000, quantity=5, min_quantity=10,
        )

    def test_list_inventory(self):
        response = self.client.get('/api/v1/inventory/inventory/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_low_stock(self):
        response = self.client.get('/api/v1/inventory/inventory/low_stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if len(response.data) > 0:
            self.assertTrue(any(item['quantity'] <= item['min_quantity'] for item in response.data))

    def test_expiring_soon(self):
        response = self.client.get('/api/v1/inventory/inventory/expiring_soon/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
