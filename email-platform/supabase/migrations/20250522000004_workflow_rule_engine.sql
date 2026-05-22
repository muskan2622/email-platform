-- Enterprise workflow automation engine expansion.

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  trigger_event text not null,
  graph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  version int not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_status_event_idx
  on public.workflows (status, trigger_event, updated_at desc);

create table if not exists public.workflow_nodes (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  node_key text not null,
  node_type text not null check (node_type in ('trigger','condition','frequency_cap','delay','wait_until','branch','send_template','webhook','goal','exit')),
  config jsonb not null default '{}'::jsonb,
  position jsonb not null default '{"x":0,"y":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_id, node_key)
);

create index if not exists workflow_nodes_workflow_idx
  on public.workflow_nodes (workflow_id, node_type);

create table if not exists public.rule_groups (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows (id) on delete cascade,
  node_id uuid references public.workflow_nodes (id) on delete cascade,
  parent_group_id uuid references public.rule_groups (id) on delete cascade,
  operator text not null default 'and' check (operator in ('and', 'or')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.condition_rules (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.rule_groups (id) on delete cascade,
  field_path text not null,
  operator text not null,
  value jsonb,
  value_type text not null default 'json',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists condition_rules_group_idx
  on public.condition_rules (group_id, sort_order);

create table if not exists public.event_log (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  type text not null,
  source text not null default 'api',
  user_external_id text,
  identifiers jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  user_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  replay_of uuid references public.event_log (id) on delete set null,
  unique (source, message_id)
);

create index if not exists event_log_type_received_idx
  on public.event_log (type, received_at desc);
create index if not exists event_log_user_idx
  on public.event_log (user_external_id, received_at desc);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  event_log_id uuid references public.event_log (id) on delete set null,
  user_external_id text,
  status text not null default 'running' check (status in ('queued','running','waiting','completed','failed','cancelled')),
  current_node_key text,
  idempotency_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  context jsonb not null default '{}'::jsonb,
  unique (idempotency_key)
);

create index if not exists automation_runs_workflow_status_idx
  on public.automation_runs (workflow_id, status, started_at desc);
create index if not exists automation_runs_user_idx
  on public.automation_runs (user_external_id, started_at desc);

create table if not exists public.workflow_state (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.automation_runs (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  node_key text not null,
  status text not null default 'pending' check (status in ('pending','running','waiting','completed','skipped','failed')),
  resume_at timestamptz,
  attempts int not null default 0,
  lock_token text,
  locked_until timestamptz,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, node_key)
);

create index if not exists workflow_state_waiting_idx
  on public.workflow_state (resume_at, status)
  where status = 'waiting';

create table if not exists public.delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.automation_runs (id) on delete set null,
  workflow_id uuid references public.workflows (id) on delete set null,
  node_key text,
  template_id uuid references public.templates (id) on delete set null,
  provider text not null check (provider in ('resend','sendgrid','ses')),
  recipient text not null,
  status text not null check (status in ('queued','sent','delivered','opened','clicked','bounced','failed')),
  attempt int not null default 1,
  idempotency_key text not null,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  unique (idempotency_key, attempt)
);

create index if not exists delivery_attempts_run_idx
  on public.delivery_attempts (run_id, created_at desc);

create table if not exists public.workflow_locks (
  key text primary key,
  owner text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_dead_letters (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.automation_runs (id) on delete set null,
  workflow_id uuid references public.workflows (id) on delete set null,
  queue_name text not null,
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  replayed_at timestamptz
);

alter table public.workflows enable row level security;
alter table public.workflow_nodes enable row level security;
alter table public.rule_groups enable row level security;
alter table public.condition_rules enable row level security;
alter table public.event_log enable row level security;
alter table public.automation_runs enable row level security;
alter table public.workflow_state enable row level security;
alter table public.delivery_attempts enable row level security;
alter table public.workflow_locks enable row level security;
alter table public.workflow_dead_letters enable row level security;
