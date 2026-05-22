# Automation Builder (Wizard)

Full-screen 5-step wizard for creating Pulsemail automations. Open via **New automation** in the top navbar (desktop) or **+** in the mobile dock.

## Folder structure

```
components/automation-builder/
  automation-wizard.tsx          # Main orchestrator
  automation-wizard-host.tsx     # Dynamic import wrapper
  wizard-step-indicator.tsx
  wizard-nav.tsx
  steps/
    trigger-step.tsx
    conditions-step.tsx
    template-step.tsx
    delivery-step.tsx
    review-step.tsx
  conditions/
    condition-group.tsx
    condition-row.tsx
  modals/
    activation-modal.tsx
    template-preview-modal.tsx
  shared/
    wizard-input.tsx

components/layout/
  new-automation-button.tsx

lib/automation/
  trigger-catalog.ts
  field-definitions.ts
  humanize-conditions.ts
  persist-automation.ts

lib/stores/
  automation-wizard-store.ts     # Zustand + localStorage draft

lib/validators/
  automation-wizard.ts           # Zod schemas

lib/types/
  automation.ts

app/api/automations/
  route.ts                       # GET list, POST save/activate
  estimate/route.ts              # Audience estimation

supabase/migrations/
  20250523000000_automation_builder.sql
```

## Database

Run migration `20250523000000_automation_builder.sql` in Supabase SQL editor or via CLI.

Tables: `automations`, `automation_condition_groups`, `automation_conditions`, `automation_actions`, `automation_runs` (plus existing `templates`).

On activate, a linked row is also created/updated in `triggers` so the existing event engine continues to process sends.

## API

- `POST /api/automations` — `{ draft: true }` autosave, `{ activate: true }` go live
- `POST /api/automations/estimate` — `{ trigger_event, conditions }` → audience estimate
