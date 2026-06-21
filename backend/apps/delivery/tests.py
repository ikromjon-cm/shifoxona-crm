from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class DeliveryAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='delivery_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
            role='driver'
        )
        self.courier = User.objects.create_user(
            login='courier', password='test123',
            first_name='Kuryer', last_name='T', phone='+998901234568',
            role='driver'
        )
        self.client.force_authenticate(user=self.user)

    def test_list_deliveries(self):
        response = self.client.get('/api/v1/delivery/deliveries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_deliveries(self):
        response = self.client.get('/api/v1/delivery/deliveries/my_deliveries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
