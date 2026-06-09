from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender='orders.Order')
def notify_order_created(sender, instance, created, **kwargs):
    from apps.notifications.models import Notification

    if created:
        for user in User.objects.filter(is_active=True, is_blocked=False, role__in=['superadmin', 'operator']):
            Notification.objects.create(
                user=user,
                type='system',
                title='Yangi buyurtma',
                message=f'{instance.pharmacy.name} dan {instance.order_number} raqamli buyurtma keldi',
                link=f'/warehouse/delivery',
            )
