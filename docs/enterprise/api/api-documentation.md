# API Documentation

## API style

- REST-first
- JSON request/response
- JWT authentication
- pagination enabled
- filter/search/order via DRF
- OpenAPI schema generated from backend

## Base URL

On-prem Nginx orqali:

- Web/API: `http://<server>/api/v1/`
- Schema: `http://<server>/api/schema/`
- Swagger UI: `http://<server>/api/docs/`
- ReDoc: `http://<server>/api/redoc/`

## Authentication

### Token endpoints

Auth modul odatda quyidagilarni taqdim etadi:

- login
- refresh
- profile / me
- register/admin create user
- password reset flow

Header format:

```http
Authorization: Bearer <access_token>
```

## Primary resource groups

### Identity & access
- `/accounts/`
- `/rbac/permissions/`
- `/rbac/roles/`
- `/rbac/user-roles/`

### Organization
- `/companies/companies/`
- `/companies/branches/`
- `/companies/departments/`
- `/companies/positions/`

### Master data
- `/medicines/`
- `/pharmacies/`

### Warehouse & inventory
- `/warehouse/`
- `/inventory/`

### Orders & delivery
- `/orders/orders/`
- `/delivery/deliveries/`

### Attendance & HR
- `/attendance/geofence-zones/`
- `/attendance/shifts/`
- `/attendance/records/`
- `/attendance/sessions/`
- `/attendance/leave-requests/`

### Collaboration
- `/tasks/tasks/`
- `/chat/rooms/`
- `/chat/messages/`
- `/notifications/`

### Reporting
- `/reports/`
- `/audit-logs/`

## Domain-specific actions

### Orders
- `POST /orders/orders/{id}/update_status/`
- `POST /orders/orders/{id}/receive/`
- `GET /orders/orders/my_orders/`
- `GET /orders/orders/export_excel/`
- `GET /orders/orders/{id}/invoice/`

### Delivery
- `POST /delivery/deliveries/{id}/assign_courier/`
- `POST /delivery/deliveries/{id}/update_status/`
- `POST /delivery/deliveries/{id}/update_location/`
- `GET /delivery/deliveries/{id}/location_history/`
- `GET /delivery/deliveries/my_deliveries/`

### Attendance
- `POST /attendance/records/check_in/`
- `POST /attendance/records/check_out/`
- `GET /attendance/records/today/`
- `POST /attendance/leave-requests/{id}/approve/`
- `POST /attendance/leave-requests/{id}/reject/`

### Tasks
- `POST /tasks/tasks/{id}/start/`
- `POST /tasks/tasks/{id}/complete/`
- `POST /tasks/tasks/{id}/cancel/`
- `POST /tasks/tasks/{id}/add_comment/`
- `POST /tasks/tasks/{id}/upload_attachment/`
- `GET /tasks/tasks/my_tasks/`
- `GET /tasks/tasks/stats/`

### Chat
- `GET /chat/rooms/{id}/messages/`
- `POST /chat/rooms/{id}/send/`
- `POST /chat/rooms/{id}/mark_read/`
- `POST /chat/rooms/{id}/add_member/`
- `GET /chat/rooms/unread_total/`

## Realtime endpoints

### WebSocket
- `/ws/notifications/`
- `/ws/chat/{room_id}/`
- `/ws/delivery/{delivery_id}/`

Use-cases:
- live chat
- in-app notifications
- driver location telemetry
- delivery status fanout

## API design rules

- server-generated document numbers (`order_number`, `pick_number`, `wave_number`)
- status transitions backend tomonidan nazorat qilinadi
- export endpoints permission bilan himoyalanadi
- all list endpoints pagination bilan ishlaydi
- tenant scope server-side enforced bo‘lishi shart

## OpenAPI file

Generated schema:
- `docs/enterprise/api/openapi.yaml`

Bu fayl `backend/manage.py spectacular --file docs/enterprise/api/openapi.yaml` orqali generatsiya qilindi.
