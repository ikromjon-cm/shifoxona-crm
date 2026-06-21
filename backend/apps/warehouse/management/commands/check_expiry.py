from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.medicines.models import MedicineBatch
from apps.notifications.models import Notification
from apps.warehouse.models import Stock


class Command(BaseCommand):
    help = 'Check for expiring/expired batches and create notifications'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Days threshold for expiring soon (default: 30)')
        parser.add_argument('--notify', action='store_true', help='Create notifications for admins')

    def handle(self, *args, **options):
        today = timezone.now().date()
        threshold = today + timedelta(days=options['days'])

        expired = MedicineBatch.objects.filter(expiry_date__lt=today, quantity__gt=0)
        expiring = MedicineBatch.objects.filter(
            expiry_date__gte=today, expiry_date__lte=threshold, quantity__gt=0
        )

        self.stdout.write(f'Expired batches: {expired.count()}')
        for b in expired:
            stocks = Stock.objects.filter(batch=b, quantity__gt=0)
            total = sum(s.quantity for s in stocks)
            self.stdout.write(f'  ! {b.medicine.name} (batch: {b.batch_number or b.series_number}) '
                              f'- expired {b.expiry_date}, {total} dona omborda')

        self.stdout.write(f'Expiring within {options["days"]} days: {expiring.count()}')
        for b in expiring:
            stocks = Stock.objects.filter(batch=b, quantity__gt=0)
            total = sum(s.quantity for s in stocks)
            days_left = (b.expiry_date - today).days
            self.stdout.write(f'  * {b.medicine.name} (batch: {b.batch_number or b.series_number}) '
                              f'- {days_left} kun qoldi, {total} dona omborda')

        if options['notify']:
            User = get_user_model()
            admins = User.objects.filter(is_active=True, is_blocked=False,
                                         role__in=['superadmin', 'admin', 'warehouse'])

            for b in expired:
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        type='expiry',
                        title='Muddati o\'tgan mahsulot',
                        message=f'{b.medicine.name} ({b.batch_number or b.series_number}) - '
                                f'muddati {b.expiry_date} da o\'tgan',
                    )

            for b in expiring:
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        type='expiry',
                        title='Muddati yaqinlashayotgan mahsulot',
                        message=f'{b.medicine.name} ({b.batch_number or b.series_number}) - '
                                f'{(b.expiry_date - today).days} kundan keyin muddati tugaydi',
                    )

            self.stdout.write(self.style.SUCCESS(f'  Created notifications for {len(admins)} admins'))
