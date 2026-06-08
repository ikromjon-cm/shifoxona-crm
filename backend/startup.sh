#!/bin/bash
set -e

mkdir -p staticfiles media logs

python manage.py migrate --noinput || true
python manage.py collectstatic --noinput || true

gunicorn config.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --timeout 120 \
  --log-level debug \
  --access-logfile - \
  --error-logfile -
