from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification

User = get_user_model()


class NotificationAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='notif_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.user)
        Notification.objects.create(
            title='Kam qoldiq', message='Analgin qoldigi 5 ta', type='low_stock',
            user=self.user,
        )
        Notification.objects.create(
            title='Muddati yaqin', message='Aspirin muddati 10 kun', type='expiry',
            user=self.user, is_read=True,
        )

    def test_list_notifications(self):
        response = self.client.get('/api/v1/notifications/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_unread_count(self):
        response = self.client.get('/api/v1/notifications/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_mark_as_read(self):
        notif = Notification.objects.filter(user=self.user, is_read=False).first()
        response = self.client.post(f'/api/v1/notifications/notifications/{notif.id}/mark-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        response = self.client.post('/api/v1/notifications/notifications/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_count = Notification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread_count, 0)

    def test_get_settings(self):
        response = self.client.get('/api/v1/notifications/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_register_device_token(self):
        response = self.client.post('/api/v1/notifications/device-token/', {
            'token': 'fcm-test-token-123',
            'platform': 'android',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)

    def test_register_device_token_duplicate(self):
        self.client.post('/api/v1/notifications/device-token/', {
            'token': 'fcm-test-token-123',
            'platform': 'android',
        })
        response = self.client.post('/api/v1/notifications/device-token/', {
            'token': 'fcm-test-token-123',
            'platform': 'ios',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_device_token_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/v1/notifications/device-token/', {
            'token': 'fcm-test-token',
            'platform': 'android',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
