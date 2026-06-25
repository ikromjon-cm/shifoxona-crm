# ERD Diagram

```mermaid
erDiagram
    COMPANY ||--o{ BRANCH : has
    BRANCH ||--o{ DEPARTMENT : has
    DEPARTMENT ||--o{ POSITION : has
    COMPANY ||--o{ USER : scopes
    BRANCH ||--o{ USER : scopes
    DEPARTMENT ||--o{ USER : scopes
    POSITION ||--o{ USER : scopes
    USER ||--|| EMPLOYEE : profile

    ROLE ||--o{ USER_ROLE : assigned
    PERMISSION }o--o{ ROLE : grants
    USER ||--o{ USER_ROLE : owns
    COMPANY ||--o{ USER_ROLE : scoped
    BRANCH ||--o{ USER_ROLE : scoped

    COMPANY ||--o{ WAREHOUSE : owns
    BRANCH ||--o{ WAREHOUSE : owns
    WAREHOUSE ||--o{ WAREHOUSE_ZONE : contains
    WAREHOUSE_ZONE ||--o{ WAREHOUSE_RACK : contains
    WAREHOUSE_RACK ||--o{ WAREHOUSE_SHELF : contains
    WAREHOUSE_SHELF ||--o{ WAREHOUSE_BIN : contains

    MEDICINE_CATEGORY ||--o{ MEDICINE : classifies
    SUPPLIER ||--o{ MEDICINE : supplies
    MEDICINE ||--o{ MEDICINE_BATCH : batches
    WAREHOUSE_BIN ||--o{ STOCK : stores
    MEDICINE ||--o{ STOCK : stored_as
    MEDICINE_BATCH ||--o{ STOCK : lot
    MEDICINE ||--|| INVENTORY : summary
    MEDICINE ||--o{ INVENTORY_COUNT : counted
    MEDICINE ||--o{ INVENTORY_MOVEMENT : moves

    USER ||--o{ PHARMACY : optional_owner
    PHARMACY ||--o{ PHARMACY_PRODUCT : keeps
    MEDICINE ||--o{ PHARMACY_PRODUCT : stocked

    PHARMACY ||--o{ ORDER : places
    USER ||--o{ ORDER : created
    ORDER ||--o{ ORDER_ITEM : lines
    MEDICINE ||--o{ ORDER_ITEM : ordered
    ORDER ||--|| DELIVERY : fulfills
    USER ||--o{ DELIVERY : assigned
    DELIVERY ||--o{ DELIVERY_LOCATION_LOG : tracks

    COMPANY ||--o{ GEOFENCE_ZONE : defines
    BRANCH ||--o{ GEOFENCE_ZONE : defines
    COMPANY ||--o{ SHIFT : defines
    BRANCH ||--o{ SHIFT : defines
    USER ||--o{ ATTENDANCE_RECORD : checks
    SHIFT ||--o{ ATTENDANCE_RECORD : uses
    GEOFENCE_ZONE ||--o{ ATTENDANCE_RECORD : validates
    USER ||--o{ ATTENDANCE_SESSION : daily
    ATTENDANCE_RECORD ||--o| ATTENDANCE_SESSION : check_in
    ATTENDANCE_RECORD ||--o| ATTENDANCE_SESSION : check_out
    USER ||--o{ LEAVE_REQUEST : requests

    USER ||--o{ TASK : assigns
    USER ||--o{ TASK : performs
    ORDER ||--o{ TASK : linked
    WAREHOUSE ||--o{ TASK : linked
    TASK ||--o{ TASK_COMMENT : has
    TASK ||--o{ TASK_ATTACHMENT : has

    COMPANY ||--o{ CHAT_ROOM : scope
    BRANCH ||--o{ CHAT_ROOM : scope
    TASK ||--o{ CHAT_ROOM : context
    ORDER ||--o{ CHAT_ROOM : context
    CHAT_ROOM ||--o{ CHAT_MESSAGE : has
    USER ||--o{ CHAT_MESSAGE : sends

    USER ||--o{ NOTIFICATION : receives
    USER ||--|| NOTIFICATION_SETTING : config
    USER ||--o{ DEVICE_TOKEN : owns
    USER ||--o{ REPORT : creates
    USER ||--o{ AUDIT_LOG : acts
```

## ERD notes

- Tenant root: `COMPANY`
- Operational scope: `BRANCH`, `WAREHOUSE`
- Security scope: `USER_ROLE`
- FEFO traceability root: `MEDICINE_BATCH` + `STOCK`
- Delivery telemetry root: `DELIVERY_LOCATION_LOG`
- Audit root: `AUDIT_LOG`
