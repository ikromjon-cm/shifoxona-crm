# Permission Matrix

## Permission model

Har bir resource uchun amallar:

- `view`
- `create`
- `update`
- `delete`
- `approve`
- `export`

## Roles

- Super Admin
- Admin
- Omborchi
- Driver
- Operator
- Moliya
- Dorixona

## Matrix

| Module | Super Admin | Admin | Omborchi | Driver | Operator | Moliya | Dorixona |
|---|---|---|---|---|---|---|---|
| Companies | V,C,U,D,A,E | V | - | - | - | - | - |
| Branches | V,C,U,D,A,E | V,C,U | - | - | - | - | - |
| Departments | V,C,U,D,A,E | V,C,U | - | - | - | - | - |
| Positions | V,C,U,D,A,E | V,C,U | - | - | - | - | - |
| Users | V,C,U,D,A,E | V,C,U | - | - | - | - | - |
| Roles | V,C,U,D,A,E | V | - | - | - | - | - |
| Medicines | V,C,U,D,A,E | V,C,U,E | V | - | V | V | V |
| Medicine Batches | V,C,U,D,A,E | V,C,U,E | V,C,U | - | V | V | V |
| Suppliers | V,C,U,D,A,E | V,C,U,E | V | - | V | V | - |
| Warehouses | V,C,U,D,A,E | V,C,U,E | V | - | V | - | - |
| Warehouse Bins | V,C,U,D,A,E | V,C,U,E | V,C,U | - | V | - | - |
| Stock | V,C,U,D,A,E | V,C,U,E | V,C,U,E | - | V | V | V |
| Inventory Count | V,C,U,D,A,E | V,C,U,A,E | V,C,U,A,E | - | V | - | - |
| Orders | V,C,U,D,A,E | V,C,U,A,E | V | - | V,C,U,A,E | V | V,C,U |
| Deliveries | V,C,U,D,A,E | V,C,U,A,E | V | V,U | V | V | V |
| Attendance | V,C,U,D,A,E | V,C,U,A,E | V,C,U | V,C,U | V | V | - |
| Leave Requests | V,C,U,D,A,E | V,C,U,A,E | V,C,U | V,C,U | V,C,U | V | - |
| Tasks | V,C,U,D,A,E | V,C,U,A,E | V,C,U | V,C,U | V,C,U | V,C,U | - |
| Chat | V | V,C,U | V,C,U | V,C,U | V,C,U | V,C,U | V |
| Notifications | V,C,U,D,A,E | V,C,U | V,U | V,U | V,U | V,U | V,U |
| Reports | V,C,U,D,A,E | V,C,U,A,E | V,E | V | V,E | V,C,U,A,E | V |
| Audit Logs | V,E | V,E | - | - | - | V | - |
| Finance | V,C,U,D,A,E | V,C,U,A,E | - | - | V | V,C,U,A,E | V |

Legend:
- `V` = View
- `C` = Create
- `U` = Update
- `D` = Delete
- `A` = Approve
- `E` = Export

## Chat restrictions

Chat policy strict bo‘lishi kerak:

- Super Admin ↔ Admin
- Admin ↔ Driver
- Admin ↔ Omborchi
- Admin ↔ Operator
- Admin ↔ Moliya
- boshqa direct chat yo‘q

## Dynamic role builder rules

1. system role'lar lock qilinadi
2. custom role checkbox matrix orqali yaratiladi
3. company-specific role variant mumkin
4. branch scope optional
5. approve/export alohida permission bo‘ladi
