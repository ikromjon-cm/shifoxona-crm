import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return

        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        is_member = await self.check_membership()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        messages = await self.get_recent_messages()
        await self.send(text_data=json.dumps({
            'type': 'recent_messages',
            'messages': messages,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'send':
            message_text = data.get('message', '').strip()
            if not message_text:
                return

            msg = await self.save_message(message_text)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': msg['id'],
                    'user_id': self.user.id,
                    'user_name': self.user.get_full_name(),
                    'message': msg['text'],
                    'created_at': msg['created_at'],
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'id': event['id'],
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'message': event['message'],
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def check_membership(self):
        from .models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return room.members.filter(id=self.user.id).exists()
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def get_recent_messages(self):
        from .models import ChatMessage
        messages = ChatMessage.objects.filter(
            room_id=self.room_id
        ).select_related('user').order_by('-created_at')[:50]

        result = []
        for m in reversed(messages):
            result.append({
                'id': m.id,
                'user_id': m.user_id,
                'user_name': m.user.get_full_name(),
                'message': m.text,
                'created_at': m.created_at.isoformat(),
            })
        return result

    @database_sync_to_async
    def save_message(self, text):
        from .models import ChatMessage, ChatRoom
        room = ChatRoom.objects.get(id=self.room_id)
        msg = ChatMessage.objects.create(
            room=room,
            user=self.user,
            text=text,
        )
        room.save(update_fields=['updated_at'])
        return {
            'id': msg.id,
            'text': msg.text,
            'created_at': msg.created_at.isoformat(),
        }
