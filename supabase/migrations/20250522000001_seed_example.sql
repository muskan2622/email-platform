-- Example: "welcome to paid" — once per user, skip if unsubscribed from product emails

insert into public.templates (slug, name, subject, body_html, body_text, status)
values (
  'welcome-to-paid',
  'Welcome to Paid',
  'Welcome to {{plan_name}}, {{first_name}}!',
  '<p>Hi {{first_name}},</p><p>Thanks for upgrading to <strong>{{plan_name}}</strong>. You now have access to all paid features.</p><p>— The team</p>',
  'Hi {{first_name}},

Thanks for upgrading to {{plan_name}}. You now have access to all paid features.

— The team',
  'active'
)
on conflict (slug) do nothing;

insert into public.triggers (
  name,
  description,
  event_type,
  template_id,
  conditions,
  enabled,
  priority,
  send_once_per_user
)
select
  'Welcome to paid (once)',
  'Fires on plan upgrade; only if user has not unsubscribed from product notifications.',
  'user.plan_upgraded',
  t.id,
  '{
    "operator": "and",
    "rules": [
      { "field": "user.unsubscribed_product", "op": "eq", "value": false }
    ]
  }'::jsonb,
  true,
  10,
  true
from public.templates t
where t.slug = 'welcome-to-paid'
  and not exists (
    select 1 from public.triggers tr
    where tr.event_type = 'user.plan_upgraded'
      and tr.name = 'Welcome to paid (once)'
  );
