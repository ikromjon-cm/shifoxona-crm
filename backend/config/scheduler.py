from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django_apscheduler.jobstores import DjangoJobStore


def start_scheduler():
    scheduler = BackgroundScheduler(settings.SCHEDULER_CONFIG)
    scheduler.add_jobstore(DjangoJobStore(), 'default')

    try:
        scheduler.add_job(
            check_expiry_job,
            trigger=CronTrigger(hour=8, minute=0),
            id='check_expiry_daily',
            max_instances=1,
            replace_existing=True,
            name='Har kuni 08:00 da muddati o\'tgan mahsulotlarni tekshirish',
        )
        scheduler.add_job(
            check_low_stock_job,
            trigger=CronTrigger(hour=9, minute=0),
            id='check_low_stock_daily',
            max_instances=1,
            replace_existing=True,
            name='Har kuni 09:00 da kam qoldiqli mahsulotlarni tekshirish',
        )
        scheduler.start()
    except Exception as e:
        print(f'Scheduler error: {e}')


def check_expiry_job():
    from django.core.management import call_command
    call_command('check_expiry', days=30, notify=True)


def check_low_stock_job():
    from django.core.management import call_command
    call_command('check_low_stock')
