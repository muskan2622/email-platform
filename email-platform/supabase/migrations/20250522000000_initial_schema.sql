-- Email Platform: core schema
-- Run via Supabase CLI (`supabase db push`) or SQL editor in dashboard.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subject text not null default '',
  body_html text not null default '',
  body_text text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_status_idx on public.templates (status);
create index templates_name_idx on public.templates using gin (to_tsvector('english', name || ' ' || coalesce(subject, '')));

-- ---------------------------------------------------------------------------
-- Triggers (when to send which template)
-- ---------------------------------------------------------------------------
create table public.triggers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_type text not null,
  template_id uuid not null references public.templates (id) on delete restrict,
  conditions jsonb not null default '{"operator":"and","rules":[]}'::jsonb,
  enabled boolean not null default true,
  priority int not null default 100,
  send_once_per_user boolean not null default false,
  send_once_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index triggers_event_type_enabled_idx
  on public.triggers (event_type, enabled, priority);

-- ---------------------------------------------------------------------------
-- End users (recipients in your product — not Supabase Auth users)
-- ---------------------------------------------------------------------------
create table public.end_users (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  email text not null,
  metadata jsonb not null default '{}'::jsonb,
  unsubscribed_product boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index end_users_email_idx on public.end_users (email);

-- ---------------------------------------------------------------------------
-- Event stream
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  user_external_id text,
  processed_at timestamptz,
  processing_result jsonb,
  created_at timestamptz not null default now()
);

create index events_type_created_idx on public.events (type, created_at desc);
create index events_unprocessed_idx on public.events (created_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- Send log (delivery history + deduplication for send-once rules)
-- ---------------------------------------------------------------------------
create table public.send_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  trigger_id uuid references public.triggers (id) on delete set null,
  template_id uuid references public.templates (id) on delete set null,
  end_user_id uuid references public.end_users (id) on delete set null,
  status text not null
    check (status in ('sent', 'failed', 'skipped')),
  skip_reason text,
  provider_message_id text,
  rendered_subject text,
  error text,
  created_at timestamptz not null default now()
);

create index send_log_end_user_trigger_idx
  on public.send_log (end_user_id, trigger_id, status);

-- Dedup: one successful send per (trigger, user) when send_once is enabled
create unique index send_log_once_per_user_idx
  on public.send_log (trigger_id, end_user_id)
  where status = 'sent' and trigger_id is not null and end_user_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

create trigger triggers_updated_at
  before update on public.triggers
  for each row execute function public.set_updated_at();

create trigger end_users_updated_at
  before update on public.end_users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (service role bypasses; anon blocked by default)
-- ---------------------------------------------------------------------------
alter table public.templates enable row level security;
alter table public.triggers enable row level security;
alter table public.end_users enable row level security;
alter table public.events enable row level security;
alter table public.send_log enable row level security;

-- Authenticated admin users (Supabase Auth) can manage data
create policy "Authenticated users manage templates"
  on public.templates for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users manage triggers"
  on public.triggers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users manage end_users"
  on public.end_users for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users read events"
  on public.events for select
  to authenticated
  using (true);

create policy "Authenticated users read send_log"
  on public.send_log for select
  to authenticated
  using (true);
