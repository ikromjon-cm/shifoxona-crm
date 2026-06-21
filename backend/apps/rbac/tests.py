from django.test import TestCase
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.rbac.models import Permission, Role, UserRole


class RbacApiTests(TestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            login='superadmin',
            password='testpass123',
            role='superadmin',
            first_name='Super',
            last_name='Admin',
        )
        self.admin = User.objects.create_user(
            login='admin',
            password='testpass123',
            role='admin',
            first_name='Regular',
            last_name='Admin',
        )
        self.super_client = APIClient()
        self.super_client.force_authenticate(user=self.superadmin)
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

    def _perms_url(self):
        return reverse('permission-list')

    def _roles_url(self):
        return reverse('role-list')

    def _user_roles_url(self):
        return reverse('userrole-list')

    def test_list_permissions_superadmin(self):
        resp = self.super_client.get(self._perms_url())
        self.assertEqual(resp.status_code, 200)

    def test_list_permissions_admin_forbidden(self):
        resp = self.admin_client.get(self._perms_url())
        self.assertEqual(resp.status_code, 403)

    def test_create_role_superadmin(self):
        resp = self.super_client.post(self._roles_url(), {
            'name': 'Test Role',
            'code': 'test_role',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Role.objects.count(), 1)

    def test_create_role_admin_forbidden(self):
        resp = self.admin_client.post(self._roles_url(), {
            'name': 'Test Role',
            'code': 'test_role',
        }, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_list_user_roles_superadmin(self):
        resp = self.super_client.get(self._user_roles_url())
        self.assertEqual(resp.status_code, 200)

    def test_create_user_role(self):
        role = Role.objects.create(name='Test', code='test')
        resp = self.super_client.post(self._user_roles_url(), {
            'user': self.admin.id,
            'role': role.id,
            'company': None,
            'branch': None,
        }, format='json')
        if resp.status_code != 201:
            print('ERROR:', resp.status_code, resp.data)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(UserRole.objects.count(), 1)
