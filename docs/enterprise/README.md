# Shifoxona Enterprise Blueprint

Farmatsevtika distribyutorlari uchun enterprise darajadagi yagona platforma blueprint'i.

Bu paket quyidagi deliverable'larni jamlaydi:

- Complete Database Schema
- ERD Diagram
- Backend Architecture
- Frontend Architecture
- Flutter Architecture
- API Documentation
- OpenAPI / Swagger Spec
- UI/UX Design System
- Figma Structure
- Component Library
- Dashboard Layouts
- Mobile Layouts
- Permission Matrix
- Docker Infrastructure
- CI/CD Pipeline
- Production Ready Code Structure

## Repository reality

Ushbu repo allaqachon monorepo sifatida tashkil qilingan:

- `backend/` — Django + DRF + Channels backend
- `frontend/` — React + TypeScript/Vite web app
- `mobile/` — Flutter mobile app
- `nginx/` — reverse proxy
- `.github/workflows/` — CI/CD workflow'lar
- `docker-compose.yml` — local/on-prem stack

## Hujjatlar indeksi

### Arxitektura
- `architecture/database-schema.md`
- `architecture/erd.md`
- `architecture/backend-architecture.md`
- `architecture/frontend-architecture.md`
- `architecture/flutter-architecture.md`

### API
- `api/api-documentation.md`
- `api/openapi.yaml`

### Design
- `design/ui-ux-design-system.md`
- `design/figma-structure.md`
- `design/component-library.md`
- `design/dashboard-layouts.md`
- `design/mobile-layouts.md`

### Operations
- `operations/permission-matrix.md`
- `operations/docker-infrastructure.md`
- `operations/ci-cd-pipeline.md`
- `operations/production-code-structure.md`

## MVP scope

Amaldagi MVP uchun asosiy modullar:

- Auth
- RBAC
- Company / Branch / Department / Position
- Warehouse / Zone / Rack / Shelf / Bin
- Medicines / Batch / Inventory / Stock
- Orders / Delivery
- Attendance
- Tasks
- Chat
- Notifications
- Reports / Audit Logs

## Enterprise principles

- Multi-company, tenant isolation
- Multi-branch operational hierarchy
- FEFO-first warehouse strategy
- QR / Barcode ready inventory flow
- Offline-first mobile warehouse & driver operations
- Real-time notifications / delivery / chat via WebSocket
- Auditability by user, device, IP, old/new data
- Dark mode primary, Uzbek primary locale
- On-prem deployment with Docker Compose + Nginx

## Recommended implementation phases

1. **Foundation** — auth, RBAC, companies, branches, warehouses, medicines, inventory
2. **Operations** — order, picking, delivery, attendance, tasks
3. **Communication** — chat, notifications, pharmacy portal
4. **Finance & Analytics** — reports, finance ledger, KPI dashboards
5. **Enterprise hardening** — SSO/2FA, monitoring, backup, HA, DR, security review
