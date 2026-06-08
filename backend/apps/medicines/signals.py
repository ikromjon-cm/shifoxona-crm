import random
import string
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Medicine


def generate_barcode():
    return ''.join(random.choices(string.digits, k=13))


@receiver(pre_save, sender=Medicine)
def auto_generate_barcode(sender, instance, **kwargs):
    if not instance.barcode:
        instance.barcode = generate_barcode()
