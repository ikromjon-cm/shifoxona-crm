from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PasswordResetCode

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            login='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            phone='+998901234567'
        )
        self.assertEqual(user.login, 'testuser')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, 'operator')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_blocked)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            login='admin',
            password='admin123',
            first_name='Admin',
            last_name='Super',
            phone='+998901234567'
        )
        self.assertTrue(admin.is_super_admin)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_block_unblock(self):
        user = User.objects.create_user(login='test', password='test123', first_name='T', last_name='U', phone='+998901234567')
        self.assertTrue(user.is_active)
        user.block()
        self.assertTrue(user.is_blocked)
        self.assertFalse(user.is_active)
        user.unblock()
        self.assertFalse(user.is_blocked)
        self.assertTrue(user.is_active)


class AuthAPITest(APITestCase):
    def test_register(self):
        admin = User.objects.create_superuser(login='admin', password='admin123', first_name='A', last_name='A', phone='+998901234567')
        self.client.force_authenticate(user=admin)
        data = {
            'login': 'newuser',
            'password': 'strongpass123',
            'first_name': 'Yangi',
            'last_name': 'Foydalanuvchi',
            'phone': '+998901234567'
        }
        response = self.client.post('/api/v1/accounts/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)

    def test_register_anonymous_blocked(self):
        data = {
            'login': 'anonuser',
            'password': 'strongpass123',
            'first_name': 'Anon',
            'last_name': 'User',
            'phone': '+998901234567'
        }
        response = self.client.post('/api/v1/accounts/register/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login(self):
        User.objects.create_user(login='testuser', password='testpass123', first_name='T', last_name='U', phone='+998901234567')
        response = self.client.post('/api/v1/accounts/login/', {'login': 'testuser', 'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_forgot_password(self):
        User.objects.create_user(login='testuser', password='testpass123', first_name='T', last_name='U', phone='+998901234567')
        response = self.client.post('/api/v1/accounts/forgot-password/', {'login': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('code', response.data)
        self.assertIn('message', response.data)

    def test_forgot_password_invalid_user(self):
        response = self.client.post('/api/v1/accounts/forgot-password/', {'login': 'nonexistent'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password(self):
        from datetime import timedelta
        from django.utils import timezone

        user = User.objects.create_user(login='testuser', password='testpass123', first_name='T', last_name='U', phone='+998901234567')
        code = PasswordResetCode.objects.create(
            user=user,
            code='123456',
            expires_at=timezone.now() + timedelta(hours=1),
        )
        response = self.client.post('/api/v1/accounts/reset-password/', {
            'login': 'testuser',
            'code': '123456',
            'new_password': 'newpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpass123'))
        code.refresh_from_db()
        self.assertTrue(code.is_used)

    def test_reset_password_invalid_code(self):
        User.objects.create_user(login='testuser', password='testpass123', first_name='T', last_name='U', phone='+998901234567')
        response = self.client.post('/api/v1/accounts/reset-password/', {
            'login': 'testuser',
            'code': '000000',
            'new_password': 'newpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
