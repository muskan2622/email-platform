-- Production template management expansion.
-- This migration is additive so the current demo app keeps working.

create extension if not exists "pg_trgm";

alter table public.templates
  add column if not exists description text,
  add column if not exists folder text not null default 'Lifecycle',
  add column if not exists kind text not null default 'transactional'
    check (kind in ('transactional', 'marketing')),
  add column if not exists tags text[] not null default '{}',
  add column if not exists placeholders text[] not null default '{}',
  add column if not exists favorite boolean not null default false,
  add column if not exists published_version_id uuid,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

create index if not exists templates_folder_idx on public.templates (folder);
create index if not exists templates_kind_status_idx on public.templates (kind, status, updated_at desc);
create index if not exists templates_tags_idx on public.templates using gin (tags);
create index if not exists templates_placeholders_idx on public.templates using gin (placeholders);
create index if not exists templates_search_trgm_idx
  on public.templates using gin ((name || ' ' || subject || ' ' || coalesce(array_to_string(tags, ' '), '')) gin_trgm_ops);

create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  version_number int not null,
  state text not null default 'draft' check (state in ('draft', 'published', 'archived')),
  subject text not null,
  body_html text not null,
  body_text text,
  editor_document jsonb not null default '{}'::jsonb,
  placeholders text[] not null default '{}',
  spam_score numeric(5, 2),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (template_id, version_number)
);

create index if not exists template_versions_template_created_idx
  on public.template_versions (template_id, created_at desc);

create table if not exists public.template_partials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  body_html text not null,
  editor_document jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_comments (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  version_id uuid references public.template_versions (id) on delete cascade,
  body text not null,
  anchor jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_by uuid,
  created_at timestamptz not null default now(),
  resolved_by uuid,
  resolved_at timestamptz
);

create index if not exists template_comments_template_idx
  on public.template_comments (template_id, status, created_at desc);

create table if not exists public.template_approvals (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  version_id uuid not null references public.template_versions (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested', 'rejected')),
  requested_by uuid,
  reviewer_id uuid,
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists template_approvals_reviewer_idx
  on public.template_approvals (reviewer_id, status, created_at desc);

create table if not exists public.template_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  template_id uuid references public.templates (id) on delete set null,
  version_id uuid references public.template_versions (id) on delete set null,
  action text not null,
  before jsonb,
  after jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists template_audit_logs_template_idx
  on public.template_audit_logs (template_id, created_at desc);

create table if not exists public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.templates (id) on delete set null,
  template_version_id uuid references public.template_versions (id) on delete set null,
  provider text not null check (provider in ('resend', 'sendgrid', 'ses')),
  provider_message_id text,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed')),
  idempotency_key text not null,
  attempt int not null default 1,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists email_delivery_logs_template_idx
  on public.email_delivery_logs (template_id, created_at desc);
create index if not exists email_delivery_logs_provider_idx
  on public.email_delivery_logs (provider, status, created_at desc);
create index if not exists email_delivery_logs_recipient_idx
  on public.email_delivery_logs (recipient, created_at desc);

create table if not exists public.email_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('resend', 'sendgrid', 'ses')),
  provider_message_id text not null,
  event_type text not null,
  recipient text,
  template_id uuid references public.templates (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_message_id, event_type, occurred_at)
);

create index if not exists email_webhook_events_unprocessed_idx
  on public.email_webhook_events (created_at)
  where processed_at is null;

alter table public.template_versions enable row level security;
alter table public.template_partials enable row level security;
alter table public.template_comments enable row level security;
alter table public.template_approvals enable row level security;
alter table public.template_audit_logs enable row level security;
alter table public.email_delivery_logs enable row level security;
alter table public.email_webhook_events enable row level security;
