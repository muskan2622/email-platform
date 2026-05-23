-- Dynamic automation catalog: event types + condition field definitions

create table if not exists public.event_type_categories (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.event_types (
  id text primary key,
  event text not null unique,
  label text not null,
  description text not null default '',
  category_id text not null references public.event_type_categories (id) on delete restrict,
  icon text not null default 'Zap',
  realtime boolean not null default true,
  sample_payload jsonb,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_types_category_enabled_idx
  on public.event_types (category_id, enabled, sort_order);

create table if not exists public.condition_field_definitions (
  id uuid primary key default gen_random_uuid(),
  field text not null unique,
  label text not null,
  description text,
  value_type text not null
    check (value_type in ('string', 'number', 'boolean', 'date', 'select')),
  operators text[] not null,
  options jsonb,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists condition_field_definitions_enabled_idx
  on public.condition_field_definitions (enabled, sort_order);
