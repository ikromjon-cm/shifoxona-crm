from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ChatMessage, ChatRoom

User = get_user_model()


class ChatModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            login='user1', password='test123',
            first_name='User', last_name='One', phone='+998901234567',
        )
        self.other = User.objects.create_user(
            login='user2', password='test123',
            first_name='User', last_name='Two', phone='+998901234568',
        )
        self.room = ChatRoom.objects.create(room_type='direct')
        self.room.members.add(self.user, self.other)

    def test_create_chat_room(self):
        self.assertEqual(self.room.room_type, 'direct')
        self.assertTrue(self.room.is_active)
        self.assertIn(self.user, self.room.members.all())

    def test_room_str_without_name(self):
        self.assertIn('#', str(self.room))

    def test_room_str_with_name(self):
        self.room.name = 'Test Room'
        self.assertEqual(str(self.room), 'Test Room')

    def test_create_message(self):
        msg = ChatMessage.objects.create(room=self.room, sender=self.user, text='Salom')
        self.assertEqual(msg.text, 'Salom')
        self.assertFalse(msg.is_read)

    def test_mark_read(self):
        from django.utils import timezone
        msg = ChatMessage.objects.create(room=self.room, sender=self.user, text='Salom')
        self.assertFalse(msg.is_read)
        msg.mark_read()
        self.assertTrue(msg.is_read)
        self.assertIsNotNone(msg.read_at)

    def test_message_str(self):
        msg = ChatMessage.objects.create(room=self.room, sender=self.user, text='Salom dunyo')
        self.assertIn('Salom', str(msg))

    def test_last_message(self):
        msg = ChatMessage.objects.create(room=self.room, sender=self.user, text='Eng oxirgi')
        self.assertEqual(self.room.last_message(), msg)

    def test_unread_count(self):
        ChatMessage.objects.create(room=self.room, sender=self.other, text='Xabar 1')
        ChatMessage.objects.create(room=self.room, sender=self.other, text='Xabar 2')
        unread = self.room.messages.filter(is_read=False).exclude(sender=self.user).count()
        self.assertEqual(unread, 2)


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
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

    def test_room_messages(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        response = self.client.get(f'/api/v1/chat/rooms/{room_id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_read(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        response = self.client.post(f'/api/v1/chat/rooms/{room_id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('marked_read', response.data)

    def test_add_member(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        third = User.objects.create_user(
            login='third', password='test123',
            first_name='Third', last_name='U', phone='+998901234569',
        )
        response = self.client.post(f'/api/v1/chat/rooms/{room_id}/add_member/', {
            'user_id': third.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_add_member_missing_id(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        response = self.client.post(f'/api/v1/chat/rooms/{room_id}/add_member/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_member_not_found(self):
        room_resp = self.client.post('/api/v1/chat/rooms/', {
            'room_type': 'direct', 'members': [self.other.id],
        }, format='json')
        room_id = room_resp.data['id']
        response = self.client.post(f'/api/v1/chat/rooms/{room_id}/add_member/', {
            'user_id': 99999,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
