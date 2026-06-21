#!/bin/sh
set -e

echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
./wait-for-it.sh "$DB_HOST:$DB_PORT" -t 30

echo "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."
./wait-for-it.sh "$REDIS_HOST:$REDIS_PORT" -t 30

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting Daphne (ASGI)..."
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
