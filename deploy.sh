#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Shifoxona Deployment Script
# Usage: ./deploy.sh [production|staging]
# ============================================================

ENV="${1:-staging}"
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="shifoxona"

echo "🚀 Deploying Shifoxona ($ENV)..."

# Load environment
if [ -f ".env" ]; then
    export $(grep -v '^\s*#' .env | xargs)
fi

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Build and start services
echo "🐳 Building Docker images..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build

# Run migrations
echo "🗄️  Running database migrations..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T backend python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T backend python manage.py collectstatic --noinput --clear

# Create superuser if not exists
echo "👤 Ensuring superuser exists..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(login='admin').exists():
    User.objects.create_superuser(login='admin', password='${ADMIN_PASSWORD:-admin123}', first_name='Admin', last_name='Admin', phone='+998901234567')
    print('Superuser created')
else:
    print('Superuser already exists')
"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Services:"
echo "   Backend API:  http://localhost:8000/api/v1/"
echo "   Frontend:     http://localhost:80/"
echo "   Admin panel:  http://localhost:80/admin/"
echo "   API docs:     http://localhost:8000/api/v1/docs/"
echo ""
echo "📊 Health checks:"
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
