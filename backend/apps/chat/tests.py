from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ChatAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='chat_user', password='test123',
            first_name='T', last_name='U', phone='+998901234567',
        )
        self.client.force_authenticate(user=self.user)
        self.other = User.objects.create_user(
            login='chat_other', password='test123',
            first_name='Other', last_name='U', phone='+998901234568',
        )

    def test_create_room(self):
        data = {'room_type': 'direct', 'members': [self.other.id]}
        response = self.client.post('/api/v1/chat/rooms/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_rooms(self):
        response = self.client.get('/api/v1/chat/rooms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unread_total(self):
        response = self.client.get('/api/v1/chat/rooms/unread_total/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_message(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        send_resp = self.client.post(f'/api/v1/chat/rooms/{room_id}/send/', {
            'text': 'Salom',
        }, format='json')
        self.assertEqual(send_resp.status_code, status.HTTP_201_CREATED)
