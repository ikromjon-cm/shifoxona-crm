import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class DeliveryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return

        self.delivery_id = self.scope['url_route']['kwargs']['delivery_id']
        self.group_name = f'delivery_{self.delivery_id}'

        can_access = await self.check_access()
        if not can_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        delivery_data = await self.get_delivery_data()
        await self.send(text_data=json.dumps({
            'type': 'delivery_state',
            'delivery': delivery_data,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'update_location' and self.user.role == 'operator':
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            if latitude and longitude:
                await self.save_location(latitude, longitude, data)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'courier_location',
                        'latitude': latitude,
                        'longitude': longitude,
                        'accuracy': data.get('accuracy'),
                        'speed': data.get('speed'),
                        'timestamp': str(__import__('datetime').datetime.now()),
                    }
                )

        elif action == 'update_status':
            status = data.get('status')
            if status:
                await self.update_status(status)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'status_update',
                        'status': status,
                        'updated_at': str(__import__('datetime').datetime.now()),
                    }
                )

    async def courier_location(self, event):
        await self.send(text_data=json.dumps({
            'type': 'courier_location',
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'accuracy': event.get('accuracy'),
            'speed': event.get('speed'),
            'timestamp': event.get('timestamp'),
        }))

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'status': event['status'],
            'updated_at': event.get('updated_at'),
        }))

    @database_sync_to_async
    def check_access(self):
        from .models import Delivery
        try:
            delivery = Delivery.objects.get(id=self.delivery_id)
            if self.user.role == 'pharmacy':
                return hasattr(self.user, 'pharmacy_profile') and delivery.order.pharmacy == self.user.pharmacy_profile
            if self.user.role == 'operator':
                return delivery.courier == self.user
            return self.user.is_super_admin
        except Delivery.DoesNotExist:
            return False

    @database_sync_to_async
    def get_delivery_data(self):
        from .models import Delivery
        from .serializers import DeliverySerializer
        delivery = Delivery.objects.select_related(
            'order__pharmacy', 'courier'
        ).get(id=self.delivery_id)
        return DeliverySerializer(delivery).data

    @database_sync_to_async
    def save_location(self, latitude, longitude, data):
        from django.utils import timezone

        from .models import Delivery, DeliveryLocationLog
        Delivery.objects.filter(id=self.delivery_id).update(
            courier_lat=latitude,
            courier_lng=longitude,
            courier_location_updated_at=timezone.now(),
        )
        DeliveryLocationLog.objects.create(
            delivery_id=self.delivery_id,
            courier=self.user,
            latitude=latitude,
            longitude=longitude,
            accuracy=data.get('accuracy'),
            speed=data.get('speed'),
            bearing=data.get('bearing'),
            battery_level=data.get('battery_level'),
        )

    @database_sync_to_async
    def update_status(self, status):
        from django.utils import timezone

        from .models import Delivery
        delivery = Delivery.objects.get(id=self.delivery_id)
        delivery.status = status
        if status == 'picked':
            delivery.picked_at = timezone.now()
        elif status == 'delivered':
            delivery.delivered_at = timezone.now()
        delivery.save()
