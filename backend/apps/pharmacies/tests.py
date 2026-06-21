from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.medicines.models import Medicine, MedicineCategory

User = get_user_model()


class PharmacyAPITest(APITestCase):
    def test_list_pharmacies(self):
        user = User.objects.create_user(
            login='pharm_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
        )
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/v1/pharmacies/pharmacies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PharmacyProductAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='pharm_user2', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.user)
        self.category = MedicineCategory.objects.create(name='Test')
        self.medicine = Medicine.objects.create(
            name='Dori', category=self.category, barcode='11111',
            purchase_price=5000, selling_price=8000, quantity=100, min_quantity=10,
        )

    def test_list_products(self):
        response = self.client.get('/api/v1/pharmacies/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
