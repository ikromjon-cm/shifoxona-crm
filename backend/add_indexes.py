"""
Migration to add performance indexes across all apps.
Run: python manage.py migrate
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('accounts', '0005_add_db_indexes'),
        ('medicines', '0006_add_db_indexes'),
        ('orders', '0003_add_db_indexes'),
        ('delivery', '0005_add_db_indexes'),
        ('warehouse', '0005_expensetransaction_warehouse_e_medicin_38f227_idx_and_more'),
        ('audit_logs', '0002_add_db_indexes'),
        ('notifications', '0003_add_db_indexes'),
        ('attendance', '0002_add_db_indexes'),
        ('chat', '0003_add_db_indexes'),
        ('tasks', '0002_add_db_indexes'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read', 'created_at'], name='notif_user_read_created_idx'),
        ),
        migrations.AddIndex(
            model_name='incometransaction',
            index=models.Index(fields=['created_by', 'created_at'], name='income_created_by_date_idx'),
        ),
        migrations.AddIndex(
            model_name='expensetransaction',
            index=models.Index(fields=['created_by', 'created_at'], name='expense_created_by_date_idx'),
        ),
        migrations.AddIndex(
            model_name='inventorymovement',
            index=models.Index(fields=['reference_type', 'reference_id'], name='movement_ref_idx'),
        ),
        migrations.AddIndex(
            model_name='pickorder',
            index=models.Index(fields=['status', 'warehouse'], name='pickorder_status_wh_idx'),
        ),
        migrations.AddIndex(
            model_name='chatroom',
            index=models.Index(fields=['room_type', 'is_active'], name='chatroom_type_active_idx'),
        ),
        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['user', 'status'], name='leaverequest_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='attendancesession',
            index=models.Index(fields=['user', 'date'], name='attendsession_user_date_idx'),
        ),
    ]
