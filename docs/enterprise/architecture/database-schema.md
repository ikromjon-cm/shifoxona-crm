# Complete Database Schema

## 1. Domain boundaries

Tizim quyidagi bounded context'lar asosida quriladi:

1. **Identity & Access** — users, roles, permissions, device binding
2. **Organization** — company, branch, department, position, employee
3. **Master Data** — medicines, categories, suppliers, pharmacies
4. **Warehouse** — warehouse, zone, rack, shelf, bin, stock, inventory movement
5. **Sales & Order Management** — orders, order items, invoices, pharmacy orders
6. **Delivery** — delivery assignment, status, GPS log
7. **Attendance & HR** — geofence, shift, attendance, leave
8. **Collaboration** — tasks, chat, notifications
9. **Reporting & Audit** — report jobs, audit logs

## 2. Tenant isolation strategy

### Logical isolation

Har bir business table quyidagi tenant context'lardan kamida bittasiga ulanadi:

- `company_id`
- `branch_id`
- `warehouse_id` (operational scope)

### Isolation rules

- `superadmin` barcha tenantlarni ko‘radi
- `admin` faqat o‘z `company` doirasida ishlaydi
- branch-level user faqat `branch` scope’da ishlaydi
- mobile warehouse / driver flow `assigned` operational entities bilan cheklanadi
- export, report, analytics ham tenant filter bilan bajariladi

## 3. Core tables

### 3.1 Identity & access

#### `accounts_user`
- `id`
- `login` (unique)
- `first_name`
- `last_name`
- `phone`
- `email`
- `role` (`superadmin`, `admin`, `operator`, `warehouse`, `driver`, `finance`, `pharmacy`)
- `company_id` nullable
- `branch_id` nullable
- `department_id` nullable
- `position_ref_id` nullable
- `is_active`
- `is_blocked`
- `is_staff`
- `is_superuser`
- `last_login`
- `created_at`
- `updated_at`

#### `accounts_employee`
- `id`
- `user_id` (1:1)
- `employee_id` (unique)
- `company_id`
- `branch_id`
- `department_id`
- `position_id`
- `hire_date`
- `salary`
- `passport_number`
- `address`
- `emergency_contact`
- `emergency_phone`
- `photo`
- `is_active`
- `created_at`
- `updated_at`

#### `accounts_passwordresetcode`
- `id`
- `user_id`
- `code`
- `created_at`
- `expires_at`
- `is_used`

#### `rbac_permission`
- `id`
- `model_name`
- `action` (`view`, `create`, `update`, `delete`, `approve`, `export`)
- `codename` (unique by model/action)
- `description`

#### `rbac_role`
- `id`
- `name`
- `code`
- `description`
- `is_system`
- `is_active`
- `created_at`
- `updated_at`

#### `rbac_userrole`
- `id`
- `user_id`
- `role_id`
- `company_id` nullable
- `branch_id` nullable
- `assigned_at`
- `is_active`

---

### 3.2 Organization

#### `companies_company`
- `id`
- `name`
- `short_name`
- `inn`
- `phone`
- `email`
- `address`
- `logo`
- `license_number`
- `license_expiry`
- `is_active`
- `created_at`
- `updated_at`

#### `companies_branch`
- `id`
- `company_id`
- `name`
- `code`
- `phone`
- `address`
- `latitude`
- `longitude`
- `is_active`
- `created_at`
- `updated_at`

#### `companies_department`
- `id`
- `branch_id`
- `name`
- `code`
- `is_active`

#### `companies_position`
- `id`
- `department_id` nullable
- `name`
- `code`
- `is_active`

---

### 3.3 Master data

#### `medicines_medicinecategory`
- `id`
- `name`
- `description`
- `created_at`
- `updated_at`

#### `medicines_supplier`
- `id`
- `name`
- `contact_person`
- `phone`
- `email`
- `address`
- `region`
- `district`
- `latitude`
- `longitude`
- `is_active`
- `created_at`
- `updated_at`

#### `medicines_medicine`
- `id`
- `name`
- `category_id`
- `supplier_id`
- `sku`
- `series_number`
- `barcode`
- `purchase_price`
- `selling_price`
- `quantity`
- `min_quantity`
- `image`
- `description`
- `is_active`
- `created_at`
- `updated_at`

#### `medicines_medicinebatch`
- `id`
- `medicine_id`
- `series_number`
- `batch_number`
- `barcode`
- `qr_code`
- `quantity`
- `purchase_price`
- `selling_price`
- `production_date`
- `expiry_date`
- `certificate`
- `storage_conditions`
- `is_recalled`
- `recalled_at`
- `recall_reason`
- `created_at`

#### `pharmacies_pharmacy`
- `id`
- `user_id` nullable
- `name`
- `stir_or_license`
- `address`
- `region`
- `district`
- `latitude`
- `longitude`
- `phone`
- `responsible_person`
- `image`
- `is_active`
- `is_approved`
- `approved_at`
- `created_at`
- `updated_at`

#### `pharmacies_pharmacyproduct`
- `id`
- `pharmacy_id`
- `medicine_id`
- `quantity`
- `created_at`
- `updated_at`

---

### 3.4 Warehouse & inventory

#### `warehouse_warehouse`
- `id`
- `company_id`
- `branch_id`
- `name`
- `code`
- `address`
- `latitude`
- `longitude`
- `picking_strategy` (`fefo`, `fifo`, `lifo`)
- `is_active`
- `created_at`
- `updated_at`

#### `warehouse_warehousezone`
- `id`
- `warehouse_id`
- `name`
- `code`
- `description`
- `is_active`

#### `warehouse_warehouserack`
- `id`
- `zone_id`
- `name`
- `code`
- `max_weight`
- `is_active`

#### `warehouse_warehouseshelf`
- `id`
- `rack_id`
- `name`
- `code`
- `level`
- `is_active`

#### `warehouse_warehousebin`
- `id`
- `shelf_id`
- `name`
- `code`
- `barcode`
- `max_capacity`
- `is_active`

#### `warehouse_stock`
- `id`
- `warehouse_bin_id`
- `medicine_id`
- `batch_id` nullable
- `quantity`
- `reserved_quantity`
- `available_quantity`
- `created_at`
- `updated_at`

#### `warehouse_inventorymovement`
- `id`
- `medicine_id`
- `movement_type` (`income`, `expense`, `adjustment`, `reserve`, `unreserve`, `transfer`)
- `quantity`
- `quantity_before`
- `quantity_after`
- `reference_type`
- `reference_id`
- `note`
- `created_by`
- `created_at`

#### `inventory_inventory`
- `id`
- `medicine_id` (1:1)
- `quantity`
- `min_quantity`
- `max_quantity`
- `location`
- `updated_at`

#### `inventory_inventorycount`
- `id`
- `medicine_id`
- `actual_quantity`
- `system_quantity`
- `difference`
- `note`
- `counted_by`
- `created_at`

#### `warehouse_pickwave`
- `id`
- `company_id`
- `branch_id`
- `warehouse_id`
- `wave_number`
- `status`
- `assigned_to`
- `started_at`
- `completed_at`
- `note`
- `created_by`
- `created_at`
- `updated_at`

#### `warehouse_pickorder`
- `id`
- `wave_id` nullable
- `order_id` nullable
- `task_id` nullable
- `warehouse_id`
- `pick_number`
- `status`
- `strategy`
- `assigned_to`
- `started_at`
- `completed_at`
- `note`
- `created_by`
- `created_at`
- `updated_at`

#### `warehouse_pickorderitem`
- `id`
- `pick_order_id`
- `stock_id` nullable
- `medicine_id`
- `batch_id` nullable
- `warehouse_bin_id` nullable
- `requested_quantity`
- `picked_quantity`
- `is_picked`
- `picked_at`
- `picked_by`
- `note`
- `created_at`

---

### 3.5 Orders & delivery

#### `orders_order`
- `id`
- `order_number`
- `pharmacy_id`
- `created_by_id`
- `status`
- `total_amount`
- `note`
- `received_at`
- `received_by`
- `receive_note`
- `created_at`
- `updated_at`

#### `orders_orderitem`
- `id`
- `order_id`
- `medicine_id`
- `quantity`
- `price`
- `created_at`

#### `delivery_delivery`
- `id`
- `order_id` (1:1)
- `courier_id` nullable
- `status`
- `assigned_at`
- `picked_at`
- `delivered_at`
- `courier_lat`
- `courier_lng`
- `courier_location_updated_at`
- `note`
- `created_at`
- `updated_at`

#### `delivery_deliverylocationlog`
- `id`
- `delivery_id`
- `courier_id`
- `latitude`
- `longitude`
- `accuracy`
- `speed`
- `bearing`
- `battery_level`
- `recorded_at`
- `created_at`

---

### 3.6 Attendance & HR

#### `attendance_geofencezone`
- `id`
- `company_id`
- `branch_id`
- `name`
- `zone_type`
- `latitude`
- `longitude`
- `radius`
- `address`
- `is_active`
- `created_at`
- `updated_at`

#### `attendance_shift`
- `id`
- `company_id`
- `branch_id`
- `name`
- `start_time`
- `end_time`
- `grace_period`
- `is_active`

#### `attendance_attendancerecord`
- `id`
- `user_id`
- `attendance_type` (`check_in`, `check_out`)
- `timestamp`
- `status`
- `method`
- `latitude`
- `longitude`
- `geofence_zone_id`
- `is_within_geofence`
- `shift_id`
- `photo`
- `device_info`
- `ip_address`
- `note`
- `created_at`

#### `attendance_attendancesession`
- `id`
- `user_id`
- `date`
- `shift_id`
- `check_in_id`
- `check_out_id`
- `geofence_zone_id`
- `status`
- `total_hours`
- `overtime_hours`
- `note`
- `created_at`
- `updated_at`

#### `attendance_leaverequest`
- `id`
- `user_id`
- `company_id`
- `leave_type`
- `start_date`
- `end_date`
- `reason`
- `status`
- `approved_by_id`
- `approved_at`
- `rejection_reason`
- `document`
- `created_at`
- `updated_at`

---

### 3.7 Collaboration

#### `tasks_task`
- `id`
- `company_id`
- `branch_id`
- `title`
- `description`
- `task_type`
- `priority`
- `status`
- `assigned_by_id`
- `assigned_to_id`
- `order_id`
- `warehouse_id`
- `due_date`
- `started_at`
- `completed_at`
- `estimated_minutes`
- `actual_minutes`
- `is_private`
- `is_active`
- `created_at`
- `updated_at`

#### `tasks_taskcomment`
- `id`
- `task_id`
- `user_id`
- `text`
- `created_at`

#### `tasks_taskattachment`
- `id`
- `task_id`
- `user_id`
- `file`
- `filename`
- `file_size`
- `created_at`

#### `chat_chatroom`
- `id`
- `company_id`
- `branch_id`
- `name`
- `room_type`
- `task_id`
- `order_id`
- `is_active`
- `created_at`
- `updated_at`

#### `chat_chatmessage`
- `id`
- `room_id`
- `sender_id`
- `text`
- `file`
- `is_read`
- `read_at`
- `created_at`

#### `notifications_notification`
- `id`
- `type`
- `title`
- `message`
- `user_id` nullable
- `is_read`
- `is_global`
- `link`
- `created_at`

#### `notifications_notificationsetting`
- `id`
- `user_id` (1:1)
- `low_stock`
- `expiry`
- `income`
- `expense`
- `push`
- `telegram`
- `sms`

#### `notifications_devicetoken`
- `id`
- `user_id`
- `token`
- `platform`
- `is_active`
- `created_at`
- `updated_at`

---

### 3.8 Reporting & audit

#### `reports_report`
- `id`
- `title`
- `report_type`
- `file_format`
- `file`
- `filters` JSON
- `created_by_id`
- `is_ready`
- `created_at`

#### `audit_logs_auditlog`
- `id`
- `user_id`
- `action`
- `description`
- `model_name`
- `object_id`
- `data_before` JSON
- `data_after` JSON
- `ip_address`
- `user_agent`
- `created_at`

## 4. High-value indexes

### Required indexes
- `accounts_user(login, role, company_id, branch_id)`
- `medicines_medicine(barcode, sku, category_id)`
- `medicines_medicinebatch(expiry_date, medicine_id, batch_number)`
- `warehouse_stock(medicine_id, warehouse_bin_id, batch_id)`
- `warehouse_inventorymovement(medicine_id, movement_type, created_at)`
- `orders_order(order_number, status, pharmacy_id, created_at)`
- `delivery_delivery(status, courier_id)`
- `delivery_deliverylocationlog(delivery_id, recorded_at)`
- `attendance_attendancerecord(user_id, timestamp, attendance_type)`
- `tasks_task(status, assigned_to_id, company_id, branch_id)`
- `notifications_notification(user_id, is_read, created_at)`
- `audit_logs_auditlog(action, model_name, created_at, user_id)`

## 5. Enterprise extensions recommended for next iteration

Quyidagi obyektlar hujjatda rejalashtirilgan, lekin alohida modul sifatida keyingi iteratsiyada kengaytiriladi:

- Finance ledger (`cash_account`, `bank_account`, `journal_entry`, `payment`, `debtor`, `creditor`)
- Procurement (`purchase_request`, `purchase_approval`, `purchase_order`, `goods_receipt`, `purchase_invoice`)
- Recall traceability (`recall_case`, `recall_line`, `recall_destination`)
- Device binding (`trusted_device`, `device_session`)
- KPI / analytics aggregates (`fact_order_daily`, `fact_inventory_daily`, `fact_delivery_daily`)
- Offline sync (`sync_queue`, `sync_checkpoint`, `conflict_log`)

## 6. FEFO rule

Primary picking strategy: **FEFO**.

Priority order:

1. earliest `expiry_date`
2. then `batch_number`
3. then physical `warehouse_bin.code`

Bu qoida `warehouse.StockManager.find_picking_batches(...)` orqali ifodalanadi.
