# Production Ready Code Structure

## Monorepo layout

```text
shifoxona/
  backend/
    apps/
      accounts/
      attendance/
      audit_logs/
      chat/
      companies/
      common/
      delivery/
      inventory/
      medicines/
      notifications/
      orders/
      pharmacies/
      rbac/
      reports/
      tasks/
      warehouse/
    config/
    manage.py
    requirements.txt
    Dockerfile
  frontend/
    src/
      components/
      context/
      hooks/
      i18n/
      lib/
      pages/
    package.json
    vite.config.js
    Dockerfile
  mobile/
    lib/
      app/
      core/
      data/
      features/
    pubspec.yaml
  nginx/
    nginx.conf
    nginx-ssl.conf
    Dockerfile
  .github/workflows/
  docs/enterprise/
  docker-compose.yml
```

## Backend conventions

### App per domain
Har bir domain uchun:
- `models.py`
- `serializers.py`
- `views.py`
- `urls.py`
- `permissions.py`
- `admin.py`
- `tests.py`
- `migrations/`

### Service extraction rule
Agar business logic quyidagilardan birini bajarsa, service layer'ga ajratiladi:
- 2+ modelga tegsa
- transaction kerak bo‘lsa
- side effect bo‘lsa
- notification/audit yuborsa

Recommended location:
- `apps/<domain>/services/`
- `apps/<domain>/selectors/`

## Frontend conventions

### Feature-first structure
Recommended:
- feature routes
- feature api hooks
- feature forms
- feature widgets
- shared `ui/`

### Web shell layering
- app shell
- route protection
- tenant selector
- feature pages
- shared UI kit

## Mobile conventions

### Layer split
- `core/` — cross-cutting utilities
- `data/` — api, repositories, cache
- `features/` — role/feature screens
- `app/` — shell, bootstrap

### Offline support
Recommended folders:
- `core/connectivity/`
- `core/cache/`
- `data/sync/`
- `data/conflicts/`

## Environment strategy

- root `.env` for compose runtime
- backend env variables for DB/Redis/secret
- frontend `VITE_*` variables
- mobile `--dart-define` for environments

## Production readiness checklist

### Backend
- [x] modular domain apps
- [x] JWT auth
- [x] WebSocket ASGI wiring
- [x] OpenAPI generation
- [ ] tenant middleware hardening
- [ ] celery worker/beat runtime
- [ ] metrics endpoint

### Frontend
- [x] routing
- [x] dark mode support
- [x] i18n foundations
- [x] shared UI components
- [ ] server-state cache standardization
- [ ] permission-driven menu registry

### Mobile
- [x] role-aware navigation base
- [x] connectivity/offline queue foundations
- [x] map support
- [x] secure storage
- [ ] encrypted offline cache
- [ ] background sync supervisor

### Ops
- [x] docker compose
- [x] nginx reverse proxy
- [x] CI workflows
- [ ] monitoring stack
- [ ] automated backups
- [ ] rollback automation
