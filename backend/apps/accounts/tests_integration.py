"""Integration tests: role-based permission classes against real API endpoints."""
from django.test import TestCase
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User


class PermissionIntegrationTests(TestCase):
    """Verify each role can/cannot access each endpoint as intended."""

    @classmethod
    def setUpTestData(cls):
        cls.users = {}
        for role in ('superadmin', 'admin', 'warehouse', 'operator', 'driver', 'finance', 'pharmacy'):
            cls.users[role] = User.objects.create_user(
                login=f'user_{role}',
                password='test123',
                role=role,
                first_name=role.capitalize(),
                last_name='User',
            )

    def _client(self, role):
        c = APIClient()
        c.force_authenticate(user=self.users[role])
        return c

    def _check(self, role, url, expected, method='get', data=None):
        c = self._client(role)
        fn = {'get': c.get, 'post': c.post, 'put': c.put, 'patch': c.patch, 'delete': c.delete}[method]
        resp = fn(url, data or {}, format='json')
        detail = ''
        if resp.data and isinstance(resp.data, dict):
            detail = str(list(resp.data.values())[0])[:60] if resp.data else ''
        self.assertEqual(
            resp.status_code, expected,
            f'{role} {method.upper()} {url}: expected {expected}, got {resp.status_code} | {detail}'
        )

    def _ok(self, role, url, method='get'):
        self._check(role, url, status.HTTP_200_OK, method)

    def _forbidden(self, role, url, method='get'):
        self._check(role, url, status.HTTP_403_FORBIDDEN, method)

    def _unauthorized(self, url, method='get'):
        resp = getattr(APIClient(), method)(url, format='json')
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # ── tests ────────────────────────────────────────────────
    def test_unauthenticated(self):
        self._unauthorized(reverse('company-list'))

    # ── Permission: IsAdmin (companies) ─────────────────
    def test_companies_admin_only(self):
        url = reverse('company-list')
        for role in ('superadmin', 'admin'):
            self._ok(role, url)
        for role in ('warehouse', 'operator', 'driver', 'finance', 'pharmacy'):
            self._forbidden(role, url)

    # ── Permission: IsAdminOrWarehouse (warehouse zones) ─
    def test_warehouse_admin_or_warehouse(self):
        url = reverse('warehousezone-list')
        for role in ('superadmin', 'admin', 'warehouse'):
            self._ok(role, url)
        for role in ('operator', 'driver', 'finance', 'pharmacy'):
            self._forbidden(role, url)

    # ── Permission: CanManageMedicines ───────────────────
    def test_medicines_manage(self):
        url = reverse('medicine-list')
        for role in ('superadmin', 'admin', 'operator', 'warehouse', 'finance', 'pharmacy'):
            self._ok(role, url)
        self._forbidden('driver', url)

    # ── Permission: CanViewDeliveries ────────────────────
    def test_deliveries_view(self):
        url = reverse('delivery-list')
        for role in ('superadmin', 'admin', 'operator', 'driver', 'pharmacy'):
            self._ok(role, url)
        for role in ('warehouse', 'finance'):
            self._forbidden(role, url)

    # ── Permission: IsAdminOrOperatorOrPharmacy (orders) ─
    def test_orders(self):
        url = reverse('order-list')
        for role in ('superadmin', 'admin', 'operator', 'pharmacy'):
            self._ok(role, url)
        for role in ('warehouse', 'driver', 'finance'):
            self._forbidden(role, url)

    # ── Permission: IsFinance (reports) ────────────────
    def test_reports_finance(self):
        url = reverse('report-list')
        for role in ('superadmin', 'admin', 'finance'):
            self._ok(role, url)
        for role in ('warehouse', 'operator', 'driver', 'pharmacy'):
            self._forbidden(role, url)

    # ── Permission: IsSuperAdmin (rbac roles) ──────────
    def test_rbac_superadmin(self):
        url = reverse('role-list')
        self._ok('superadmin', url)
        for role in ('admin', 'warehouse', 'operator', 'driver', 'finance', 'pharmacy'):
            self._forbidden(role, url)

    # ── Attendance geofence: IsAdmin ────────────────────
    def test_attendance_admin_geofence(self):
        url = reverse('geofencezone-list')
        for role in ('superadmin', 'admin'):
            self._ok(role, url)
        for role in ('warehouse', 'operator', 'driver', 'finance', 'pharmacy'):
            self._forbidden(role, url)
