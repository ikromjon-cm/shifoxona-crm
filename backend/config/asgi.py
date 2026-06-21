import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import re_path

from apps.accounts.websocket_auth import TokenAuthMiddlewareStack
from apps.chat.consumers import ChatConsumer
from apps.delivery.consumers import DeliveryConsumer
from apps.notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_id>\d+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/delivery/(?P<delivery_id>\d+)/$', DeliveryConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        TokenAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
