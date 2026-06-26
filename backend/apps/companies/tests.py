from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Branch, Company, Department, Position

User = get_user_model()


class CompanyModelTest(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            name='Shifoxona MChJ',
            short_name='SHIF',
            inn='123456789',
            phone='+998901234567',
            address='Toshkent sh.',
        )

    def test_create_company(self):
        self.assertEqual(self.company.name, 'Shifoxona MChJ')
        self.assertEqual(self.company.short_name, 'SHIF')
        self.assertTrue(self.company.is_active)
        self.assertEqual(str(self.company), 'Shifoxona MChJ')

    def test_create_branch(self):
        branch = Branch.objects.create(
            company=self.company,
            name='Asosiy filial',
            code='BR-001',
            phone='+998901234567',
            address='Toshkent, Chilonzor',
        )
        self.assertEqual(branch.company, self.company)
        self.assertEqual(str(branch), 'Shifoxona MChJ - Asosiy filial')

    def test_create_department(self):
        branch = Branch.objects.create(
            company=self.company, name='Filial', code='BR-001',
            phone='+998901234567', address='Toshkent',
        )
        dept = Department.objects.create(branch=branch, name='Kardiologiya', code='DEPT-001')
        self.assertEqual(dept.branch, branch)
        self.assertEqual(str(dept), 'Filial - Kardiologiya')

    def test_create_position(self):
        dept = Department.objects.create(
            branch=Branch.objects.create(
                company=self.company, name='Filial', code='BR-001',
                phone='+998901234567', address='Toshkent',
            ),
            name='Kardiologiya', code='DEPT-001',
        )
        pos = Position.objects.create(name='Shifokor', code='DOC', department=dept)
        self.assertEqual(pos.department, dept)
        self.assertEqual(str(pos), 'Shifokor')

    def test_company_unique_inn(self):
        with self.assertRaises(Exception):
            Company.objects.create(
                name='Boshqa', inn='123456789', phone='+998901234567', address='Toshkent',
            )

    def test_branch_unique_code(self):
        Branch.objects.create(
            company=self.company, name='Filial 1', code='BR-001',
            phone='+998901234567', address='Toshkent',
        )
        with self.assertRaises(Exception):
            Branch.objects.create(
                company=self.company, name='Filial 2', code='BR-001',
                phone='+998901234567', address='Toshkent',
            )


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class CompanyAPITest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            login='admin', password='admin123',
            first_name='Admin', last_name='Super', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.admin)

    def test_list_companies(self):
        Company.objects.create(name='Test', inn='111', phone='+998901234567', address='Toshkent')
        response = self.client.get('/api/v1/companies/companies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_company(self):
        data = {
            'name': 'Yangi Kompaniya',
            'inn': '999888777',
            'phone': '+998901234567',
            'address': 'Samarqand sh.',
        }
        response = self.client.post('/api/v1/companies/companies/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Yangi Kompaniya')

    def test_retrieve_company_detail(self):
        company = Company.objects.create(
            name='Detail test', inn='222', phone='+998901234567', address='Toshkent',
        )
        response = self.client.get(f'/api/v1/companies/companies/{company.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('branches_count', response.data)

    def test_update_company(self):
        company = Company.objects.create(
            name='Old', inn='333', phone='+998901234567', address='Toshkent',
        )
        response = self.client.patch(f'/api/v1/companies/companies/{company.id}/', {'name': 'Yangilangan'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Yangilangan')

    def test_delete_company(self):
        company = Company.objects.create(
            name='Delete me', inn='444', phone='+998901234567', address='Toshkent',
        )
        response = self.client.delete(f'/api/v1/companies/companies/{company.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthorized_access_blocked(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/companies/companies/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_branches(self):
        company = Company.objects.create(name='C', inn='555', phone='+998901234567', address='T')
        Branch.objects.create(company=company, name='Filial', code='BR-002', phone='+998901234567', address='T')
        response = self.client.get('/api/v1/companies/branches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_departments(self):
        company = Company.objects.create(name='C', inn='666', phone='+998901234567', address='T')
        branch = Branch.objects.create(company=company, name='F', code='BR-003', phone='+998901234567', address='T')
        Department.objects.create(branch=branch, name='DEPT', code='D-001')
        response = self.client.get('/api/v1/companies/departments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_positions(self):
        response = self.client.get('/api/v1/companies/positions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
