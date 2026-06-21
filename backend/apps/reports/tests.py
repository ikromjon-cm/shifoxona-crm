from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ReportAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='report_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
            role='admin',
        )
        self.client.force_authenticate(user=self.user)

    def test_dashboard(self):
        response = self.client.get('/api/v1/reports/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_dashboard(self):
        admin = User.objects.create_superuser(
            login='admin_report', password='test123',
            first_name='Admin', last_name='R', phone='+998901234568',
        )
        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/v1/reports/admin-dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_generate_report(self):
        data = {'report_type': 'inventory', 'file_format': 'xlsx'}
        response = self.client.post('/api/v1/reports/reports/generate/', data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
