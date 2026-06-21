from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

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
                link='/warehouse/delivery',
            )


@receiver(post_save, sender='orders.Order')
def auto_create_pick_order(sender, instance, **kwargs):
    from apps.warehouse.models import PickOrder, PickOrderItem, Warehouse

    if instance.status != 'confirmed':
        return

    if PickOrder.objects.filter(order=instance).exists():
        return

    pharmacy = instance.pharmacy
    warehouse = Warehouse.objects.filter(
        company__branches__pharmacies=pharmacy
    ).first()

    if not warehouse:
        warehouse = Warehouse.objects.filter(
            company=pharmacy.company
        ).first()

    if not warehouse:
        return

    with transaction.atomic():
        pick_order = PickOrder.objects.create(
            order=instance,
            warehouse=warehouse,
            strategy=warehouse.picking_strategy,
            pick_number=f'PO-{instance.order_number}',
            created_by=instance.created_by,
            note=f'Avtomatik yaratilgan: {instance.order_number}',
        )

        items_data = []
        for item in instance.items.all():
            try:
                batches = pick_order.warehouse.stocks.fefo(
                    item.medicine, pick_order.warehouse, item.quantity
                )
                for batch_info in batches:
                    PickOrderItem.objects.create(
                        pick_order=pick_order,
                        stock=batch_info['stock'],
                        medicine=item.medicine,
                        batch=batch_info['batch'],
                        warehouse_bin=batch_info['bin'],
                        requested_quantity=batch_info['quantity'],
                    )
                    batch_info['stock'].reserve(batch_info['quantity'])
            except ValueError:
                pass


@receiver(post_save, sender='orders.Order')
def auto_create_delivery(sender, instance, **kwargs):
    from apps.delivery.models import Delivery

    if instance.status != 'preparing':
        return

    if hasattr(instance, 'delivery'):
        return

    Delivery.objects.get_or_create(
        order=instance,
        defaults={'status': 'pending'},
    )
