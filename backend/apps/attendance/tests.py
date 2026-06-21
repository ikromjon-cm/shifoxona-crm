from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Branch, Company

from .models import LeaveRequest

User = get_user_model()


class AttendanceAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='att_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
            role='admin',
        )
        self.client.force_authenticate(user=self.user)
        self.company = Company.objects.create(name='Test Co')
        self.branch = Branch.objects.create(company=self.company, name='Test Branch', code='BR-001')

    def test_list_shifts(self):
        response = self.client.get('/api/v1/attendance/shifts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_shift(self):
        data = {
            'company': self.company.id,
            'branch': self.branch.id,
            'name': 'Kunduzgi smena',
            'start_time': '08:00:00',
            'end_time': '17:00:00',
        }
        response = self.client.post('/api/v1/attendance/shifts/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Kunduzgi smena')

    def test_list_geofence_zones(self):
        response = self.client.get('/api/v1/attendance/geofence-zones/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_check_in(self):
        response = self.client.post('/api/v1/attendance/records/check_in/', {
            'latitude': 41.3111, 'longitude': 69.2797, 'method': 'manual',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_check_out(self):
        self.client.post('/api/v1/attendance/records/check_in/', {
            'latitude': 41.3111, 'longitude': 69.2797, 'method': 'manual',
        }, format='json')
        response = self.client.post('/api/v1/attendance/records/check_out/', {
            'latitude': 41.3111, 'longitude': 69.2797, 'method': 'manual',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_today_records(self):
        response = self.client.get('/api/v1/attendance/records/today/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_leave_request_create(self):
        data = {
            'leave_type': 'annual',
            'start_date': '2026-07-01',
            'end_date': '2026-07-10',
            'reason': 'Ta\'til',
            'company': self.company.id,
        }
        response = self.client.post('/api/v1/attendance/leave-requests/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_leave_request_approve(self):
        leave = LeaveRequest.objects.create(
            user=self.user, leave_type='sick',
            start_date='2026-07-01', end_date='2026-07-02',
            reason='Kasal', company=self.company,
            status='pending',
        )
        admin = User.objects.create_superuser(
            login='admin_att', password='test123',
            first_name='Admin', last_name='A', phone='+998901234569',
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(f'/api/v1/attendance/leave-requests/{leave.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        leave.refresh_from_db()
        self.assertEqual(leave.status, 'approved')
