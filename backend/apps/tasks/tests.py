from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class TaskAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='task_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
            role='admin'
        )
        self.worker = User.objects.create_user(
            login='worker', password='test123',
            first_name='Ishchi', last_name='T', phone='+998901234568',
            role='operator'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_task(self):
        data = {
            'title': 'Omborni tekshirish',
            'description': 'Kunlik inventarizatsiya',
            'task_type': 'count',
            'priority': 'high',
            'assigned_to': self.worker.id,
        }
        response = self.client.post('/api/v1/tasks/tasks/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Omborni tekshirish')

    def test_list_tasks(self):
        response = self.client.get('/api/v1/tasks/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_tasks(self):
        response = self.client.get('/api/v1/tasks/tasks/my_tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_task_stats(self):
        response = self.client.get('/api/v1/tasks/tasks/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_start_and_complete_task(self):
        task_resp = self.client.post(
            '/api/v1/tasks/tasks/',
            {
                'title': 'Yuklash',
                'description': 'Mashinaga yuklash',
                'task_type': 'load',
                'priority': 'medium',
                'assigned_to': self.worker.id,
            },
            format='json'
        )
        task_id = task_resp.data['id']

        start_resp = self.client.post(f'/api/v1/tasks/tasks/{task_id}/start/')
        self.assertEqual(start_resp.status_code, status.HTTP_200_OK)

        complete_resp = self.client.post(f'/api/v1/tasks/tasks/{task_id}/complete/')
        self.assertEqual(complete_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_resp.data['status'], 'completed')

    def test_cancel_task(self):
        task_resp = self.client.post(
            '/api/v1/tasks/tasks/',
            {'title': 'Bekor qilish test', 'task_type': 'other', 'priority': 'low'},
            format='json'
        )
        task_id = task_resp.data['id']
        response = self.client.post(f'/api/v1/tasks/tasks/{task_id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_add_comment(self):
        task_resp = self.client.post(
            '/api/v1/tasks/tasks/',
            {'title': 'Izoh test', 'task_type': 'other', 'priority': 'low'},
            format='json'
        )
        task_id = task_resp.data['id']
        response = self.client.post(
            f'/api/v1/tasks/tasks/{task_id}/add_comment/',
            {'text': 'Bu yerda ish olib borildi'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
