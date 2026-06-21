import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return

        self.group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        unread = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'mark_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_read(notification_id)
            unread = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': unread,
            }))

        elif action == 'mark_all_read':
            await self.mark_all_read()
            unread = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': unread,
            }))

        elif action == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': event['id'],
            'title': event['title'],
            'message': event['message'],
            'notification_type': event['notification_type'],
            'link': event.get('link'),
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def get_unread_count(self):
        from .models import Notification
        return Notification.objects.filter(user=self.user, is_read=False).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from .models import Notification
        Notification.objects.filter(id=notification_id, user=self.user).update(is_read=True)

    @database_sync_to_async
    def mark_all_read(self):
        from .models import Notification
        Notification.objects.filter(user=self.user, is_read=False).update(is_read=True)
