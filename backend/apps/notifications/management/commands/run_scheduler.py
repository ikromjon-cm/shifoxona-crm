from django.core.management.base import BaseCommand

from config.scheduler import start_scheduler


class Command(BaseCommand):
    help = 'Start APScheduler for periodic tasks'

    def handle(self, *args, **options):
        self.stdout.write('Starting scheduler...')
        start_scheduler()
        self.stdout.write(self.style.SUCCESS('Scheduler started! Press Ctrl+C to stop.'))

        try:
            import time
            while True:
                time.sleep(10)
        except KeyboardInterrupt:
            self.stdout.write('Stopping scheduler...')
