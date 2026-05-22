# Visual Event Trigger & Rule Engine

The Rules tab is now modeled as an enterprise workflow automation engine: events enter the platform, rules qualify users, workflow state advances through a graph, and delivery is executed through provider adapters.

## Product Surface

- React Flow canvas with draggable nodes, animated connections, minimap, zoom, pan, fit controls, and node selection.
- Workflow nodes: Trigger, Condition, Frequency Cap, Delay, Wait Until, Branch/Split, Send Template, Webhook, Goal, and Exit.
- Inspector panel for node configuration, status, and execution notes.
- Node palette for adding future graph steps.
- Live metrics: active users, waiting users, qualification rate, goal rate, retries, and dead-letter count.
- Event replay simulator and rule evaluation debugger.
- Recent execution overlay showing event processing state.

## Event Ingestion

Incoming events should include:

```json
{
  "type": "user.plan_upgraded",
  "message_id": "evt_01HY",
  "source": "billing",
  "timestamp": "2026-05-23T01:45:00.000Z",
  "identifiers": { "workspace_id": "ws_123" },
  "payload": { "plan_name": "pro", "mrr": 99 },
  "user": {
    "external_id": "user_123",
    "email": "alex@example.com",
    "metadata": { "timezone": "Asia/Calcutta" },
    "unsubscribed_product": false
  }
}
```

Validation happens in `lib/validators/events.ts`. Production ingestion should persist to `event_log` with a unique `(source, message_id)` key for replay protection and deduplication.

## Rule Evaluation

`lib/engine/conditions.ts` supports nested AND/OR groups and operators:

- equality: `eq`, `neq`
- text: `contains`, `regex`
- numeric: `gt`, `gte`, `lt`, `lte`, `between`
- array: `in`, `not_in`, `in_array`
- date: `date_before`, `date_after`, `date_between`
- presence: `exists`, `not_exists`

Field paths can query:

- `payload.*`
- `user.*`
- `aggregates.*`
- `activity.*`

Example:

```json
{
  "operator": "and",
  "rules": [
    { "field": "payload.plan_name", "op": "eq", "value": "pro" },
    { "field": "user.unsubscribed_product", "op": "eq", "value": false },
    { "field": "aggregates.emails_sent_last_7_days", "op": "lt", "value": 3 }
  ]
}
```

## Execution Engine

Recommended execution flow:

1. `event.ingest`: validate schema, verify source, insert `event_log`, reject duplicate `(source, message_id)`.
2. `workflow.match`: load active workflows by `trigger_event`.
3. `workflow.start`: create `automation_runs` with deterministic idempotency key.
4. `node.execute`: acquire Redis/Postgres lock, execute current node, persist `workflow_state`.
5. `node.delay`: schedule delayed resume using BullMQ delayed jobs or Temporal timers.
6. `email.send`: render template, enforce suppression/unsubscribe/quiet hours, send via provider abstraction.
7. `webhook.process`: ingest delivery/open/click/bounce webhooks and update attempts.
8. `goal.evaluate`: attribute conversion and terminate runs that hit goals.

## Queue Architecture

Use Redis + BullMQ for this app shape, or Temporal if exactly-once durable timers and long-running workflows become central.

Queues:

- `events.ingest`
- `workflows.match`
- `workflow.nodes`
- `workflow.delayed`
- `email.delivery`
- `webhook.events`
- `analytics.rollups`
- `dead.letters`

Redis usage:

- Hot event queue transport.
- Short TTL dedup keys.
- Rate limit buckets per workspace/provider.
- Distributed node locks.
- Presence and live execution counters.

Kafka usage:

- Long-term event backbone when ingestion volume exceeds a single Redis queue.
- Partition by workspace/user for ordered per-user automation processing.
- Feed downstream analytics and warehouse exports.

## Reliability

- Idempotency key: `workflow_id:event_log_id:user_external_id`.
- Node lock: `run_id:node_key` with expiry and heartbeat.
- Retry policy: exponential backoff with jitter for transient provider/webhook failures.
- Dead-letter queue: persist final failures in `workflow_dead_letters` for operator replay.
- Race prevention: unique indexes on event log, automation run idempotency, workflow state, and delivery attempts.
- Quiet hours: compute recipient-local windows from user timezone and resume with delayed job.
- Frequency caps: query delivery attempts and workflow state before entering send nodes.

## Files

- UI: `components/rules/workflow-builder.tsx`
- Replay API: `app/api/workflows/replay/route.ts`
- Evaluator: `lib/engine/conditions.ts`
- SQL schema: `supabase/migrations/20250522000004_workflow_rule_engine.sql`
- Prisma models: `prisma/schema.prisma`
