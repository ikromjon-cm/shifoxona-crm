import json

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

AUDIT_MODELS = [
    'Medicine', 'MedicineBatch', 'MedicineCategory', 'Supplier',
    'Order', 'OrderItem',
    'Delivery', 'DeliveryLocationLog',
    'IncomeTransaction', 'ExpenseTransaction', 'InventoryMovement',
    'Warehouse', 'WarehouseZone', 'WarehouseRack', 'WarehouseShelf', 'WarehouseBin', 'Stock',
    'PickWave', 'PickOrder', 'PickOrderItem',
    'Pharmacy', 'PharmacyProduct',
    'AttendanceRecord', 'AttendanceSession', 'LeaveRequest',
    'Task', 'TaskComment', 'TaskAttachment',
    'ChatRoom', 'ChatMessage',
    'GeofenceZone', 'Shift',
    'Report',
    'Notification',
]

EXCLUDED_FIELDS = ['password', 'last_login', 'updated_at']


def get_model_fields(instance):
    """Serialize model instance fields to a dict, excluding sensitive fields."""
    data = {}
    for field in instance._meta.fields:
        if field.name in EXCLUDED_FIELDS:
            continue
        value = getattr(instance, field.name)
        if hasattr(value, 'pk'):
            value = value.pk
        elif hasattr(value, 'isoformat'):
            value = value.isoformat()
        try:
            json.dumps(value)
            data[field.name] = value
        except (TypeError, OverflowError):
            data[field.name] = str(value)
    return data


@receiver(post_save)
def audit_log_post_save(sender, instance, created, **kwargs):
    model_name = sender.__name__
    if model_name not in AUDIT_MODELS:
        return

    from .models import AuditLog

    action = 'CREATE' if created else 'UPDATE'
    user = None
    ip_address = None
    user_agent = None

    request = getattr(instance, '_audit_request', None)
    if request:
        user = request.user if request.user.is_authenticated else None
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

    if not user:
        user = getattr(instance, 'created_by', None) or getattr(instance, 'user', None)

    data_after = get_model_fields(instance)

    if created:
        AuditLog.objects.create(
            user=user,
            action=action,
            description=f'{model_name} yaratildi (ID: {instance.pk})',
            model_name=model_name,
            object_id=instance.pk,
            data_after=data_after,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    else:
        old_instance = sender.objects.get(pk=instance.pk)
        data_before = get_model_fields(old_instance)
        if data_before != data_after:
            changed_fields = []
            for key in data_after:
                if key in data_before and data_before[key] != data_after[key]:
                    changed_fields.append(key)
            if changed_fields:
                AuditLog.objects.create(
                    user=user,
                    action=action,
                    description=f'{model_name} tahrirlandi (ID: {instance.pk}). O\'zgarish: {", ".join(changed_fields)}',
                    model_name=model_name,
                    object_id=instance.pk,
                    data_before={k: data_before[k] for k in changed_fields if k in data_before},
                    data_after={k: data_after[k] for k in changed_fields if k in data_after},
                    ip_address=ip_address,
                    user_agent=user_agent,
                )


@receiver(post_delete)
def audit_log_post_delete(sender, instance, **kwargs):
    model_name = sender.__name__
    if model_name not in AUDIT_MODELS:
        return

    from .models import AuditLog

    user = None
    request = getattr(instance, '_audit_request', None)
    if request:
        user = request.user if request.user.is_authenticated else None

    AuditLog.objects.create(
        user=user,
        action='DELETE',
        description=f'{model_name} o\'chirildi (ID: {instance.pk})',
        model_name=model_name,
        object_id=instance.pk,
        data_before=get_model_fields(instance),
    )
