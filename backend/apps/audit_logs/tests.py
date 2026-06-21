from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuditLogAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(
            login='admin', password='test123',
            first_name='Admin', last_name='Super', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.user)

    def test_list_logs(self):
        response = self.client.get('/api/v1/audit-logs/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
