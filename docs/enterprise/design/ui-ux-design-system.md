# UI/UX Design System

## Design direction

Vizual yo‘nalish:

- Apple clarity
- Linear precision
- Notion simplicity
- Enterprise density

## Brand fundamentals

- Primary color: `#2563EB`
- Primary locale: Uzbek
- Secondary locales: Russian, English
- Primary mode: Dark
- Secondary mode: Light
- Primary font: Inter

## Design principles

1. **Fast scanning** — operatorlar ko‘p ma’lumotni tez o‘qiydi
2. **Operational clarity** — status, alert, KPI juda ko‘rinadigan bo‘lishi kerak
3. **Low cognitive load** — bir ekranda bitta asosiy vazifa
4. **Action-first** — Create, Approve, Export, Assign har doim ko‘rinadi
5. **Consistency** — web va mobile’da bir xil status ranglari

## Color system

### Semantic palette
- Primary: `#2563EB`
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Info: `#3B82F6`
- Neutral 900: `#0F172A`
- Neutral 800: `#1E293B`
- Neutral 600: `#475569`
- Neutral 400: `#94A3B8`
- Neutral 100: `#F1F5F9`

### Status mapping
- Pending — slate
- Approved / Delivered / Completed — emerald
- In Progress / On Route — blue
- Warning / Expiring 30 days — amber
- Critical / Expiring 7 days — red
- Cancelled / Failed — rose

## Typography

### Web
- Display: 32/40, 700
- Page title: 24/32, 700
- Section title: 18/28, 600
- Body: 14/22, 400/500
- Table text: 13/20, 400
- Micro label: 12/16, 500

### Mobile
- Hero: 28/34, 700
- Page title: 20/28, 600
- Body: 14/20
- Caption: 12/16

## Spacing scale

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48

## Radius

- Small: 8
- Medium: 12
- Large: 16
- XL: 20
- Sheet/Dialog: 24

## Elevation

Dark-mode dominant system uchun soft shadow + subtle border:

- surface border: 1px neutral alpha
- card shadow: low blur
- modal shadow: medium blur
- drawers: stronger contrast border, minimal shadow

## Surface tokens

### Dark
- App background: `#0F172A`
- Surface: `#111827`
- Card: `#1E293B`
- Elevated card: `#243247`

### Light
- App background: `#F8FAFC`
- Surface: `#FFFFFF`
- Card: `#FFFFFF`
- Elevated card: `#F8FAFC`

## Feedback patterns

### Alerts
- inline banner
- toast
- persistent alert rail widget
- notification center item

### Critical flows
- expired batch
- recall triggered
- failed delivery
- geofence violation
- overdue payment

## Data-heavy UI rules

- sticky table header
- horizontal scroll hidden behind gradient edge hints
- default saved filters per role
- batch action toolbar appears only on selection
- export in 1 click
- audit trail link in detail header

## Accessibility

- min contrast AA
- full keyboard navigation for web
- 44x44 tap target for mobile
- status is never color-only; always icon + label
- locale switch always available
