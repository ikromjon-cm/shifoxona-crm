#!/bin/bash
set -e

export DATABASE_URL="postgresql://neondb_owner:npg_Jlkj36WbpVPr@ep-royal-silence-abmtlvjg.eu-west-2.aws.neon.tech/neondb?sslmode=require"
export DEBUG=False

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

gunicorn config.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --timeout 120 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
