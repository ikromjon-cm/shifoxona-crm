from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


def invalidate_dashboard_cache(**kwargs):
    cache.clear()


@receiver(post_save, sender='medicines.Medicine')
@receiver(post_delete, sender='medicines.Medicine')
@receiver(post_save, sender='warehouse.IncomeTransaction')
@receiver(post_delete, sender='warehouse.IncomeTransaction')
@receiver(post_save, sender='warehouse.ExpenseTransaction')
@receiver(post_delete, sender='warehouse.ExpenseTransaction')
@receiver(post_save, sender='medicines.MedicineBatch')
@receiver(post_delete, sender='medicines.MedicineBatch')
@receiver(post_save, sender='orders.Order')
@receiver(post_delete, sender='orders.Order')
@receiver(post_save, sender='delivery.Delivery')
@receiver(post_delete, sender='delivery.Delivery')
@receiver(post_save, sender='attendance.AttendanceSession')
@receiver(post_delete, sender='attendance.AttendanceSession')
def invalidate_on_model_change(sender, **kwargs):
    invalidate_dashboard_cache()
