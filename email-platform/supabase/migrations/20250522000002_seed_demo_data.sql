-- Demo / dummy data for dashboards, charts, events, and logs.
-- Safe to re-run: removes prior demo rows (payload.demo = true) then re-inserts.

-- ---------------------------------------------------------------------------
-- Extra templates
-- ---------------------------------------------------------------------------
insert into public.templates (slug, name, subject, body_html, body_text, status)
values
  (
    'welcome-signup',
    'Welcome Signup',
    'Welcome aboard, {{first_name}}!',
    '<p>Hi {{first_name}},</p><p>Your workspace is ready.</p>',
    'Hi {{first_name}},\n\nYour workspace is ready.',
    'active'
  ),
  (
    'order-receipt',
    'Order Receipt',
    'Your receipt for {{amount}} {{currency}}',
    '<p>Hi {{first_name}},</p><p>Payment received: {{amount}} {{currency}}.</p>',
    'Hi {{first_name}},\n\nPayment received: {{amount}} {{currency}}.',
    'active'
  ),
  (
    'password-reset',
    'Password Reset',
    'Reset your password',
    '<p>Reset your password using the secure link.</p>',
    'Reset your password using the secure link.',
    'active'
  ),
  (
    'weekly-digest',
    'Weekly Digest',
    'Your weekly summary, {{first_name}}',
    '<p>Hi {{first_name}},</p><p>Your weekly summary is attached.</p>',
    'Hi {{first_name}},\n\nYour weekly summary.',
    'draft'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Extra triggers
-- ---------------------------------------------------------------------------
insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Signup welcome', 'New user registration', 'user.signup', t.id,
  '{"operator":"and","rules":[{"field":"user.unsubscribed_product","op":"eq","value":false}]}'::jsonb,
  true, 20, false
from public.templates t where t.slug = 'welcome-signup'
  and not exists (select 1 from public.triggers tr where tr.name = 'Signup welcome');

insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Order receipt', 'Completed purchase', 'order.completed', t.id,
  '{"operator":"and","rules":[{"field":"payload.amount","op":"gt","value":0}]}'::jsonb,
  true, 30, false
from public.templates t where t.slug = 'order-receipt'
  and not exists (select 1 from public.triggers tr where tr.name = 'Order receipt');

insert into public.triggers (name, description, event_type, template_id, conditions, enabled, priority, send_once_per_user)
select 'Password reset', 'Security flow', 'password.reset_requested', t.id,
  '{"operator":"and","rules":[]}'::jsonb,
  true, 40, true
from public.templates t where t.slug = 'password-reset'
  and not exists (select 1 from public.triggers tr where tr.name = 'Password reset');

-- ---------------------------------------------------------------------------
-- Demo recipients
-- ---------------------------------------------------------------------------
insert into public.end_users (external_id, email, metadata, unsubscribed_product)
values
  ('demo_alex', 'alex@acme.io', '{"first_name":"Alex","plan":"pro"}'::jsonb, false),
  ('demo_sara', 'sara@nova.dev', '{"first_name":"Sara","plan":"pro"}'::jsonb, false),
  ('demo_jordan', 'jordan@linear.app', '{"first_name":"Jordan","plan":"team"}'::jsonb, false),
  ('demo_morgan', 'morgan@stripe.com', '{"first_name":"Morgan","plan":"enterprise"}'::jsonb, false),
  ('demo_riley', 'riley@startup.io', '{"first_name":"Riley","plan":"free"}'::jsonb, false),
  ('demo_casey', 'casey@design.co', '{"first_name":"Casey","plan":"pro"}'::jsonb, true),
  ('demo_taylor', 'taylor@ops.dev', '{"first_name":"Taylor","plan":"pro"}'::jsonb, false),
  ('demo_bad', 'bad@invalid.local', '{"first_name":"Bad"}'::jsonb, false)
on conflict (external_id) do update set
  email = excluded.email,
  metadata = excluded.metadata,
  unsubscribed_product = excluded.unsubscribed_product;

-- ---------------------------------------------------------------------------
-- Clear previous demo events / sends (full wipe for safe re-run)
-- ---------------------------------------------------------------------------
delete from public.send_log
where provider_message_id like 're_demo_%'
   or event_id in (select id from public.events where payload->>'demo' = 'true')
   or end_user_id in (
     select id from public.end_users where external_id like 'demo_%'
   );

delete from public.events where payload->>'demo' = 'true';

-- ---------------------------------------------------------------------------
-- Demo events
-- ---------------------------------------------------------------------------
insert into public.events (type, payload, user_external_id, processed_at, processing_result, created_at)
values
  ('user.signup', '{"demo":true,"first_name":"Alex","plan":"pro"}'::jsonb, 'demo_alex',
    now() - interval '2 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Signup welcome","status":"sent"}]}'::jsonb,
    now() - interval '2 minutes'),
  ('order.completed', '{"demo":true,"amount":299,"currency":"USD","first_name":"Sara"}'::jsonb, 'demo_sara',
    now() - interval '6 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Order receipt","status":"sent"}]}'::jsonb,
    now() - interval '6 minutes'),
  ('user.plan_upgraded', '{"demo":true,"plan_name":"Pro","first_name":"Jordan"}'::jsonb, 'demo_jordan',
    now() - interval '14 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Welcome to paid (once)","status":"sent"}]}'::jsonb,
    now() - interval '14 minutes'),
  ('subscription.cancelled', '{"demo":true,"reason":"churn"}'::jsonb, 'demo_riley',
    now() - interval '22 minutes',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '22 minutes'),
  ('password.reset_requested', '{"demo":true}'::jsonb, 'demo_taylor',
    now() - interval '35 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Password reset","status":"sent"}]}'::jsonb,
    now() - interval '35 minutes'),
  ('user.signup', '{"demo":true,"first_name":"Casey"}'::jsonb, 'demo_casey',
    now() - interval '48 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Signup welcome","status":"skipped","skip_reason":"conditions_not_met"}]}'::jsonb,
    now() - interval '48 minutes'),
  ('webhook.received', '{"demo":true,"source":"stripe","event":"invoice.paid"}'::jsonb, null,
    now() - interval '1 hour',
    '{"matched_triggers":0,"evaluations":[]}'::jsonb,
    now() - interval '1 hour'),
  ('email.bounced', '{"demo":true,"reason":"mailbox_full"}'::jsonb, 'demo_bad',
    now() - interval '90 minutes',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Signup welcome","status":"failed"}]}'::jsonb,
    now() - interval '90 minutes'),
  ('order.completed', '{"demo":true,"amount":49,"currency":"USD","first_name":"Morgan"}'::jsonb, 'demo_morgan',
    now() - interval '2 hours',
    '{"matched_triggers":1,"evaluations":[{"trigger_name":"Order receipt","status":"sent"}]}'::jsonb,
    now() - interval '2 hours'),
  ('trial.expiring', '{"demo":true,"days_left":3,"first_name":"Riley"}'::jsonb, 'demo_riley',
    null, null, now() - interval '3 hours');

-- ---------------------------------------------------------------------------
-- Demo send_log — one row per insert (avoids duplicate triggers with same name)
-- Uses template slug + event_type to pick a single trigger id (limit 1)
-- ---------------------------------------------------------------------------

-- Extra cleanup right before send_log (safe if you run from line 141 only)
delete from public.send_log
where provider_message_id like 're_demo_%'
   or end_user_id in (select id from public.end_users where external_id like 'demo_%');

-- Clear any leftover sent rows on send_once triggers for demo users
delete from public.send_log sl
using public.triggers tr, public.end_users u
where sl.trigger_id = tr.id
  and sl.end_user_id = u.id
  and u.external_id like 'demo_%'
  and tr.send_once_per_user = true
  and sl.status = 'sent';

insert into public.send_log (event_id, trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select ev.id, tr.id, tr.template_id, u.id, 'sent', 're_demo_001', 'Welcome aboard, Alex!', now() - interval '25 minutes'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup'
  order by tr.created_at asc limit 1
) tr
left join lateral (
  select e.id from public.events e
  where e.payload->>'demo' = 'true' and e.type = 'user.signup' and e.user_external_id = 'demo_alex'
  order by e.created_at desc limit 1
) ev on true
where u.external_id = 'demo_alex'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_001');

insert into public.send_log (event_id, trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select ev.id, tr.id, tr.template_id, u.id, 'sent', 're_demo_002', 'Your receipt for 299 USD', now() - interval '55 minutes'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed'
  order by tr.created_at asc limit 1
) tr
left join lateral (
  select e.id from public.events e
  where e.payload->>'demo' = 'true' and e.type = 'order.completed' and e.user_external_id = 'demo_sara'
  limit 1
) ev on true
where u.external_id = 'demo_sara'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_002');

insert into public.send_log (event_id, trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select ev.id, tr.id, tr.template_id, u.id, 'sent', 're_demo_003', 'Welcome to Pro, Jordan!', now() - interval '2 hours'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'welcome-to-paid' and tr.event_type = 'user.plan_upgraded'
  order by tr.created_at asc limit 1
) tr
left join lateral (
  select e.id from public.events e
  where e.payload->>'demo' = 'true' and e.type = 'user.plan_upgraded' and e.user_external_id = 'demo_jordan'
  limit 1
) ev on true
where u.external_id = 'demo_jordan'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_003');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_004', 'Reset your password', now() - interval '4 hours'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'password-reset' and tr.event_type = 'password.reset_requested'
  order by tr.created_at asc limit 1
) tr
where u.external_id = 'demo_taylor'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_004');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_005', 'Your receipt for 49 USD', now() - interval '5 hours'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed'
  order by tr.created_at asc limit 1
) tr
where u.external_id = 'demo_morgan'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_005');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_006', 'Welcome aboard, Sara!', now() - interval '6 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_sara' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_006');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_007', 'Welcome aboard, Jordan!', now() - interval '7 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_jordan' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_007');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_008', 'Your receipt for 120 USD', now() - interval '8 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_alex' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_008');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_009', 'Welcome aboard, Morgan!', now() - interval '9 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_morgan' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_009');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_010', 'Welcome aboard, Taylor!', now() - interval '10 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_taylor' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_010');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_011', 'Your receipt for 899 USD', now() - interval '11 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_jordan' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_011');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_012', 'Welcome aboard, Riley!', now() - interval '3 hours'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_riley' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_012');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_013', 'Your receipt for 15 USD', now() - interval '3 hours 15 minutes'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_taylor' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_013');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_014', 'Your receipt for 59 USD', now() - interval '45 minutes'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_alex' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_014');

insert into public.send_log (trigger_id, template_id, end_user_id, status, provider_message_id, rendered_subject, created_at)
select tr.id, tr.template_id, u.id, 'sent', 're_demo_015', 'Order follow-up', now() - interval '1 hour 20 minutes'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'order-receipt' and tr.event_type = 'order.completed' order by tr.created_at asc limit 1) tr
where u.external_id = 'demo_riley' and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_015');

insert into public.send_log (event_id, trigger_id, template_id, end_user_id, status, skip_reason, rendered_subject, created_at)
select ev.id, tr.id, tr.template_id, u.id, 'skipped', 'conditions_not_met', null, now() - interval '48 minutes'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
left join lateral (select e.id from public.events e where e.payload->>'demo' = 'true' and e.user_external_id = 'demo_casey' and e.type = 'user.signup' limit 1) ev on true
where u.external_id = 'demo_casey'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_skip_casey');

insert into public.send_log (event_id, trigger_id, template_id, end_user_id, status, rendered_subject, error, created_at)
select ev.id, tr.id, tr.template_id, u.id, 'failed', 'Welcome aboard, Bad!', 'Invalid recipient', now() - interval '90 minutes'
from public.end_users u
cross join lateral (select tr.id, tr.template_id from public.triggers tr inner join public.templates tmpl on tmpl.id = tr.template_id where tmpl.slug = 'welcome-signup' and tr.event_type = 'user.signup' order by tr.created_at asc limit 1) tr
left join lateral (select e.id from public.events e where e.payload->>'demo' = 'true' and e.user_external_id = 'demo_bad' limit 1) ev on true
where u.external_id = 'demo_bad'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_fail_bad');

-- Riley: skipped welcome-to-paid (no sent for riley on this trigger)
insert into public.send_log (trigger_id, template_id, end_user_id, status, skip_reason, created_at)
select tr.id, tr.template_id, u.id, 'skipped', 'already_sent_once', now() - interval '20 minutes'
from public.end_users u
cross join lateral (
  select tr.id, tr.template_id from public.triggers tr
  inner join public.templates tmpl on tmpl.id = tr.template_id
  where tmpl.slug = 'welcome-to-paid' and tr.event_type = 'user.plan_upgraded'
  order by tr.created_at asc limit 1
) tr
where u.external_id = 'demo_riley'
  and not exists (select 1 from public.send_log sl where sl.provider_message_id = 're_demo_skip_riley');
