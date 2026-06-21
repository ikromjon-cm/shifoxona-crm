#!/bin/bash
set -e

mkdir -p staticfiles media logs

python manage.py migrate --noinput || true
python manage.py collectstatic --noinput || true

# Reset superuser: always set shifoxona/shifoxona1
python manage.py shell << 'PYEOF' || true
from django.contrib.auth import get_user_model
User = get_user_model()

user, created = User.objects.update_or_create(
    login='shifoxona',
    defaults={
        'role': 'superadmin',
        'is_active': True,
        'is_blocked': False,
        'is_superuser': True,
        'first_name': 'Super',
        'last_name': 'Admin',
    }
)
user.set_password('shifoxona1')
user.save()
if created:
    print('Superuser created: shifoxona / shifoxona1')
else:
    print('Superuser updated: shifoxona / shifoxona1')
PYEOF

daphne config.asgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --log-level info \
  --access-log -
