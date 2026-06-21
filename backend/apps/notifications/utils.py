import os

from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model


def send_realtime_notification(user_id, notification_data):
    """Send a real-time notification to a specific user via WebSocket."""
    channel_layer = get_channel_layer()
    if channel_layer:
        group_name = f'notifications_{user_id}'
        channel_layer.group_send(
            group_name,
            {
                'type': 'send_notification',
                'id': notification_data['id'],
                'title': notification_data['title'],
                'message': notification_data['message'],
                'notification_type': notification_data.get('type', 'system'),
                'link': notification_data.get('link', ''),
                'created_at': str(notification_data.get('created_at', '')),
            }
        )


def send_push_notification(user_id, title, body, data=None):
    """Send a push notification via Firebase Cloud Messaging."""
    firebase_cred_path = os.getenv('FIREBASE_CREDENTIALS', '')
    if not firebase_cred_path:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
    except ImportError:
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)

    from .models import DeviceToken

    tokens = DeviceToken.objects.filter(user_id=user_id, is_active=True).values_list('token', flat=True)
    if not tokens:
        return

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        tokens=list(tokens),
    )
    try:
        messaging.send_each_for_multicast(message)
    except Exception:
        pass


def notify_users(notification_data, user_ids=None, roles=None):
    """Send notification to multiple users by IDs or roles."""
    User = get_user_model()
    users = User.objects.none()

    if user_ids:
        users = User.objects.filter(id__in=user_ids, is_active=True, is_blocked=False)
    elif roles:
        users = User.objects.filter(role__in=roles, is_active=True, is_blocked=False)

    for user in users:
        send_realtime_notification(user.id, notification_data)
        send_push_notification(
            user.id,
            notification_data.get('title', 'Shifoxona CRM'),
            notification_data.get('message', ''),
            {'route': notification_data.get('link', ''), 'type': notification_data.get('type', 'system')},
        )
