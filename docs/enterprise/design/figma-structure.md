# Figma Structure

## Workspace structure

```text
Shifoxona Enterprise
  00 Foundations
  01 Tokens
  02 Components
  03 Patterns
  04 Web - Super Admin
  05 Web - Admin
  06 Web - Pharmacy Portal
  07 Mobile - Admin APK
  08 Mobile - Warehouse APK
  09 Mobile - Driver APK
  10 Prototypes
  11 Specs and Handoff
```

## Page/file plan

### 00 Foundations
- brand
- vision
- iconography
- accessibility checklist
- writing style

### 01 Tokens
- colors
- typography
- spacing
- radius
- shadows
- grid
- breakpoints
- dark/light mappings

### 02 Components
Atoms:
- button
- input
- select
- badge
- avatar
- checkbox
- tabs
- toast
- tooltip

Molecules:
- search bar
- filter strip
- stat card
- KPI card
- list item
- table toolbar
- chat item
- timeline item

Organisms:
- sidebar
- header
- table grid
- dashboard widget
- form section
- approval drawer
- map panel
- notification center

### 03 Patterns
- CRUD list/detail
- approval flow
- assignment flow
- export flow
- mobile scan flow
- offline sync conflict pattern
- geofence attendance pattern

### 04 Web - Super Admin
- global dashboard
- company switcher
- audit center
- monitoring center
- KPI analytics

### 05 Web - Admin
- operations dashboard
- warehouse management
- medicines
- pharmacies
- orders
- delivery
- reports
- finance placeholders

### 06 Web - Pharmacy Portal
- catalog
- cart
- order history
- debt status
- invoice detail
- notifications

### 07 Mobile - Admin APK
- dashboard
- orders list/detail
- map
- chat
- reports summary

### 08 Mobile - Warehouse APK
- dashboard
- QR scan
- stock lookup
- pick orders
- movements
- attendance
- tasks

### 09 Mobile - Driver APK
- assigned deliveries
- delivery detail
- live map
- attendance
- chat
- offline sync state

## Naming rules

- `WEB/Admin/Orders/List`
- `WEB/Admin/Orders/Detail`
- `MOB/Warehouse/Scan/Success`
- `MOB/Driver/Delivery/OnRoute`

## Variant strategy

Component variants:
- theme: dark | light
- size: sm | md | lg
- state: default | hover | active | disabled | loading | error
- density: comfortable | compact

## Handoff essentials

Har bir screen uchun:
- empty state
- loading state
- success state
- error state
- permission denied state
- offline state (mobile)
