# Backend setup

Stack: **Next.js API routes** + **Supabase (Postgres)** + **Resend** + **OpenAI**.

## 1. Database (Supabase)

Apply migrations from `supabase/migrations/`:

**Option A — Supabase CLI**

```bash
cd email-platform
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — SQL Editor**

Copy and run each file in order in the Supabase dashboard SQL editor.

### Tables

| Table | Purpose |
|-------|---------|
| `templates` | Email content (subject, HTML/text, status) |
| `triggers` | Event type + conditions + template + send-once flag |
| `end_users` | Recipients (`external_id`, email, unsubscribe flags) |
| `events` | Incoming event stream + processing results |
| `send_log` | Delivery history and deduplication |

### Demo data (optional)

Run `supabase/migrations/20250522000002_seed_demo_data.sql` in the SQL Editor to populate templates, triggers, events, and send logs for dashboards and charts. Safe to re-run.

### Example scenario (seeded)

Event `user.plan_upgraded` → trigger **Welcome to paid (once)**:

- Condition: `user.unsubscribed_product` equals `false`
- `send_once_per_user`: true (enforced via `send_log` unique index)

## 2. Environment

Copy `.env.example` to `.env.local` and fill in keys.

## 3. API surface

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/events` | Ingest event → evaluate triggers → send email |
| `GET` | `/api/events` | List recent events |
| `GET/POST` | `/api/templates` | List / create templates |
| `GET/PATCH/DELETE` | `/api/templates/:id` | CRUD single template |
| `POST` | `/api/templates/:id/preview` | Render with sample payload |
| `POST` | `/api/templates/:id/test` | Send test email via Resend (`{ "to": "..." }`) |
| `GET/POST` | `/api/triggers` | List / create triggers |
| `GET/PATCH/DELETE` | `/api/triggers/:id` | CRUD single trigger |
| `POST` | `/api/ai/assist` | AI copy helper |
| `GET` | `/api/send-log` | Delivery log |

### Ingest an event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EVENTS_API_KEY" \
  -d '{
    "type": "user.plan_upgraded",
    "payload": { "plan_name": "Pro", "first_name": "Alex" },
    "user": {
      "external_id": "user_123",
      "email": "alex@example.com",
      "unsubscribed_product": false,
      "metadata": { "first_name": "Alex" }
    }
  }'
```

Response (`202`):

```json
{
  "ok": true,
  "data": {
    "event_id": "...",
    "result": {
      "matched_triggers": 1,
      "evaluations": [{ "trigger_id": "...", "status": "sent", ... }]
    }
  }
}
```

### Condition DSL

Triggers store JSON on `conditions`:

```json
{
  "operator": "and",
  "rules": [
    { "field": "payload.plan", "op": "eq", "value": "pro" },
    { "field": "user.unsubscribed_product", "op": "eq", "value": false }
  ]
}
```

Supported ops: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `exists`, `not_exists`.

Fields are dot-paths under `payload.*` or `user.*`.

## 4. Architecture

```
POST /api/events
    → insert events row
    → upsert end_users (if user block present)
    → load triggers WHERE event_type = type AND enabled
    → for each trigger (by priority):
         evaluate conditions
         check send_once via send_log
         render template (Handlebars)
         send via Resend
         append send_log
    → update events.processing_result
```

Core logic lives in `lib/engine/process-event.ts` and `lib/engine/conditions.ts`.
