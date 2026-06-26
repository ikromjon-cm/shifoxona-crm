from django.contrib.auth import get_user_model
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Delivery

User = get_user_model()


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class DeliveryAPITest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            login='superadmin', password='test123',
            first_name='Super', last_name='Admin', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.admin)
        self.courier = User.objects.create_user(
            login='courier', password='test123',
            first_name='Kuryer', last_name='T', phone='+998901234568',
            role='driver',
        )

    def _create_delivery(self, status='pending'):
        from apps.pharmacies.models import Pharmacy
        from apps.orders.models import Order

        pharmacy = Pharmacy.objects.create(
            name='Test Dorixona',
            address='Toshkent, Chilonzor 5',
            phone='+998901234567',
            responsible_person='Test',
            is_approved=True,
        )
        order = Order.objects.create(
            pharmacy=pharmacy,
            created_by=self.admin,
            total_amount=100000,
        )
        return Delivery.objects.create(order=order, courier=self.courier, status=status)

    def test_list_deliveries(self):
        response = self.client.get('/api/v1/delivery/deliveries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_deliveries(self):
        response = self.client.get('/api/v1/delivery/deliveries/my_deliveries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_export_excel(self):
        self._create_delivery()
        response = self.client.get('/api/v1/delivery/deliveries/export_excel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        self.assertIn('yetkazib_berish.xlsx', response['Content-Disposition'])
        self.assertGreater(len(response.content), 0)

    def test_export_excel_empty(self):
        response = self.client.get('/api/v1/delivery/deliveries/export_excel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.content), 0)

    def test_export_excel_multiple_deliveries(self):
        self._create_delivery('pending')
        self._create_delivery('delivered')
        response = self.client.get('/api/v1/delivery/deliveries/export_excel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.content), 0)

    def test_detail_delivery(self):
        delivery = self._create_delivery()
        response = self.client.get(f'/api/v1/delivery/deliveries/{delivery.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order_number', response.data)

    def test_update_status(self):
        delivery = self._create_delivery()
        response = self.client.post(
            f'/api/v1/delivery/deliveries/{delivery.id}/update_status/',
            {'status': 'assigned'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'assigned')

    def test_update_status_invalid(self):
        delivery = self._create_delivery()
        response = self.client.post(
            f'/api/v1/delivery/deliveries/{delivery.id}/update_status/',
            {'status': 'invalid_status'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
