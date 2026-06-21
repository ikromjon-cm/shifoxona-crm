from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import models

from apps.medicines.models import Medicine
from apps.notifications.models import Notification
from apps.warehouse.models import Stock


class Command(BaseCommand):
    help = 'Check for low stock medicines and create notifications'

    def handle(self, *args, **options):
        low_stock = Medicine.objects.filter(quantity__lte=models.F('min_quantity'))
        count = low_stock.count()

        self.stdout.write(f'Low stock medicines: {count}')
        for m in low_stock:
            stocks = Stock.objects.filter(medicine=m, quantity__gt=0)
            total = sum(s.quantity for s in stocks)
            self.stdout.write(f'  * {m.name} - {total} dona (min: {m.min_quantity})')

        if count > 0:
            User = get_user_model()
            admins = User.objects.filter(
                is_active=True, is_blocked=False,
                role__in=['superadmin', 'admin', 'warehouse'],
            )

            for m in low_stock:
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        type='low_stock',
                        title='Mahsulot qoldig\'i kam',
                        message=f'{m.name} - qoldiq: {m.quantity} dona (min: {m.min_quantity})',
                    )

            self.stdout.write(self.style.SUCCESS(f'Created notifications for {len(admins)} admins'))
