from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import MedicineCategory, Medicine

User = get_user_model()


class MedicineModelTest(TestCase):
    def setUp(self):
        self.category = MedicineCategory.objects.create(name='Antibiotiklar')

    def test_create_medicine(self):
        medicine = Medicine.objects.create(
            name='Amoksilin',
            category=self.category,
            barcode='123456789',
            purchase_price=5000,
            selling_price=8000,
            quantity=100,
            min_quantity=10
        )
        self.assertEqual(medicine.name, 'Amoksilin')
        self.assertFalse(medicine.is_low_stock)
        self.assertEqual(medicine.quantity, 100)


class MedicineAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(login='test', password='test123', first_name='T', last_name='U', phone='+998901234567')
        self.client.force_authenticate(user=self.user)

    def test_list_medicines(self):
        response = self.client.get('/api/v1/medicines/medicines/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
