-- Full automation builder schema (idempotent).
-- Run this in Supabase SQL editor if POST /api/automations fails with missing tables.

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  trigger_event text not null,
  conditions jsonb not null default '{"operator":"and","rules":[]}'::jsonb,
  template_id uuid references public.templates (id) on delete set null,
  delivery_rules jsonb not null default '{}'::jsonb,
  trigger_id uuid references public.triggers (id) on delete set null,
  audience_estimate int,
  metadata jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automations_status_trigger_idx
  on public.automations (status, trigger_event, updated_at desc);

create index if not exists automations_template_idx
  on public.automations (template_id)
  where template_id is not null;

create table if not exists public.automation_condition_groups (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  parent_group_id uuid references public.automation_condition_groups (id) on delete cascade,
  operator text not null default 'and' check (operator in ('and', 'or')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists automation_condition_groups_automation_idx
  on public.automation_condition_groups (automation_id, parent_group_id, sort_order);

create table if not exists public.automation_conditions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.automation_condition_groups (id) on delete cascade,
  field_path text not null,
  operator text not null,
  value jsonb,
  human_label text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists automation_conditions_group_idx
  on public.automation_conditions (group_id, sort_order);

create table if not exists public.automation_actions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  action_type text not null default 'send_email'
    check (action_type in ('send_email', 'webhook', 'delay')),
  template_id uuid references public.templates (id) on delete set null,
  config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists automation_actions_automation_idx
  on public.automation_actions (automation_id, sort_order);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  user_external_id text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'waiting', 'completed', 'failed', 'skipped', 'cancelled')),
  skip_reason text,
  idempotency_key text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  context jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists automation_runs_automation_status_idx
  on public.automation_runs (automation_id, status, started_at desc);

create index if not exists automation_runs_user_idx
  on public.automation_runs (user_external_id, started_at desc);

create unique index if not exists automation_runs_idempotency_idx
  on public.automation_runs (idempotency_key)
  where idempotency_key is not null;

-- Refresh PostgREST schema cache (fixes "Could not find the table in the schema cache")
notify pgrst, 'reload schema';
