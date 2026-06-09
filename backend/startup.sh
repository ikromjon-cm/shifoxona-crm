#!/bin/bash
set -e

# Force SQLite - ignore Render's DATABASE_URL env var
unset DATABASE_URL

mkdir -p staticfiles media logs

python manage.py migrate --noinput || true
python manage.py collectstatic --noinput || true

# Create default superuser if not exists
python manage.py shell << 'PYEOF' || true
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        login='admin',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print('Default superuser created')
else:
    print('Superuser already exists')
PYEOF

gunicorn config.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --timeout 120 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
