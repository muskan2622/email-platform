-- Rich sample data for the automation wizard workflow (idempotent).
-- Run after:
--   20250524000000_event_catalog.sql
--   20250524000001_seed_event_catalog.sql
-- Also requires base tables: templates, triggers, events (initial_schema migration).

-- ---------------------------------------------------------------------------
-- Prerequisites: automations table (from automation_builder migration)
-- Safe to re-run — skipped if already created via 20250523000000_automation_builder.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Extra templates for wizard testing
-- ---------------------------------------------------------------------------
insert into public.templates (slug, name, subject, body_html, body_text, status)
values
  (
    'trial-expiring-nudge',
    'Trial Expiring Nudge',
    'Your trial ends in {{days_left}} days',
    '<p>Hi {{first_name}},</p><p>Your trial ends in {{days_left}} days. Upgrade to keep Pro features.</p>',
    'Hi {{first_name}},\n\nYour trial ends in {{days_left}} days.',
    'active'
  ),
  (
    'invoice-failed-dunning',
    'Invoice Failed Dunning',
    'We could not process your payment',
    '<p>Hi {{first_name}},</p><p>Please update your billing details.</p>',
    'Hi {{first_name}},\n\nPlease update your billing details.',
    'active'
  ),
  (
    'feature-adoption',
    'Feature Adoption',
    'You unlocked {{feature}}',
    '<p>Hi {{first_name}},</p><p>Great job using {{feature}}!</p>',
    'Hi {{first_name}},\n\nGreat job using {{feature}}!',
    'active'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Sample automations (wizard-created flows)
-- ---------------------------------------------------------------------------
insert into public.automations (
  name,
  slug,
  description,
  status,
  trigger_event,
  conditions,
  template_id,
  delivery_rules,
  metadata
)
select
  'Pro upgrade welcome',
  'pro-upgrade-welcome-' || substr(md5(random()::text), 1, 6),
  'Draft automation — plan upgraded with pro filter',
  'draft',
  'user.plan_upgraded',
  '{"operator":"and","rules":[{"field":"user.metadata.plan","op":"eq","value":"pro"}]}'::jsonb,
  t.id,
  '{"mode":"once_per_user","delay_minutes":0,"cooldown_days":7,"max_sends_per_user":1,"send_immediately":true}'::jsonb,
  '{"source":"seed","demo":true}'::jsonb
from public.templates t
where t.slug = 'welcome-to-paid'
  and not exists (
    select 1 from public.automations a where a.name = 'Pro upgrade welcome'
  );

insert into public.automations (
  name,
  slug,
  description,
  status,
  trigger_event,
  conditions,
  template_id,
  delivery_rules,
  metadata,
  activated_at
)
select
  'High-value order receipt',
  'high-value-order-' || substr(md5(random()::text), 1, 6),
  'Active — order total over $100',
  'active',
  'order.completed',
  '{"operator":"and","rules":[{"field":"payload.order_total","op":"gt","value":100}]}'::jsonb,
  t.id,
  '{"mode":"every_trigger","delay_minutes":5,"cooldown_days":0,"max_sends_per_user":null,"send_immediately":false}'::jsonb,
  '{"source":"seed","demo":true}'::jsonb,
  now() - interval '1 day'
from public.templates t
where t.slug = 'order-receipt'
  and not exists (
    select 1 from public.automations a where a.name = 'High-value order receipt'
  );

insert into public.automations (
  name,
  slug,
  description,
  status,
  trigger_event,
  conditions,
  template_id,
  delivery_rules,
  metadata
)
select
  'Trial expiring nurture',
  'trial-expiring-' || substr(md5(random()::text), 1, 6),
  'Paused — trial expiring with no conditions',
  'paused',
  'trial.expiring',
  '{"operator":"and","rules":[]}'::jsonb,
  t.id,
  '{"mode":"cooldown","delay_minutes":60,"cooldown_days":3,"max_sends_per_user":2,"send_immediately":false}'::jsonb,
  '{"source":"seed","demo":true}'::jsonb
from public.templates t
where t.slug = 'trial-expiring-nudge'
  and not exists (
    select 1 from public.automations a where a.name = 'Trial expiring nurture'
  );

-- ---------------------------------------------------------------------------
-- Extra demo events (catalog-aligned)
-- ---------------------------------------------------------------------------
insert into public.events (type, payload, user_external_id, processed_at, processing_result, created_at)
values
  (
    'trial.expiring',
    '{"demo":true,"days_left":3,"first_name":"Riley","plan":"pro"}'::jsonb,
    'demo_riley',
    now() - interval '15 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '15 minutes'
  ),
  (
    'invoice.failed',
    '{"demo":true,"amount":49,"currency":"USD","attempt":2,"first_name":"Casey"}'::jsonb,
    'demo_casey',
    now() - interval '28 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '28 minutes'
  ),
  (
    'feature.used',
    '{"demo":true,"feature":"export_csv","first_name":"Taylor"}'::jsonb,
    'demo_taylor',
    now() - interval '40 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '40 minutes'
  ),
  (
    'invoice.paid',
    '{"demo":true,"amount":120,"currency":"USD","first_name":"Morgan"}'::jsonb,
    'demo_morgan',
    now() - interval '55 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '55 minutes'
  ),
  (
    'user.invited',
    '{"demo":true,"inviter_name":"Alex","role":"admin","first_name":"Sara"}'::jsonb,
    'demo_sara',
    now() - interval '70 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '70 minutes'
  ),
  (
    'login.suspicious',
    '{"demo":true,"country":"RU","device":"unknown"}'::jsonb,
    'demo_jordan',
    now() - interval '95 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '95 minutes'
  ),
  (
    'trial.started',
    '{"demo":true,"trial_days":14,"plan":"pro","first_name":"Alex"}'::jsonb,
    'demo_alex',
    now() - interval '2 hours',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '2 hours'
  );

-- ---------------------------------------------------------------------------
-- Triggers for new event types (optional engine rules)
-- ---------------------------------------------------------------------------
insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Trial expiring reminder', 'Nurture before trial ends', 'trial.expiring', t.id,
  '{"operator":"and","rules":[{"field":"user.unsubscribed_product","op":"eq","value":false}]}'::jsonb,
  true, 45, false
from public.templates t where t.slug = 'trial-expiring-nudge'
  and not exists (select 1 from public.triggers tr where tr.name = 'Trial expiring reminder');

insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Invoice failed dunning', 'Payment recovery', 'invoice.failed', t.id,
  '{"operator":"and","rules":[{"field":"payload.amount","op":"gt","value":0}]}'::jsonb,
  true, 55, false
from public.templates t where t.slug = 'invoice-failed-dunning'
  and not exists (select 1 from public.triggers tr where tr.name = 'Invoice failed dunning');

insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Feature adoption cheer', 'Celebrate feature usage', 'feature.used', t.id,
  '{"operator":"and","rules":[]}'::jsonb,
  true, 60, true
from public.templates t where t.slug = 'feature-adoption'
  and not exists (select 1 from public.triggers tr where tr.name = 'Feature adoption cheer');
