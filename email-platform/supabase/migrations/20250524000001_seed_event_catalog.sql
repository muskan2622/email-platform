-- Seed dynamic event catalog + condition fields (idempotent)

insert into public.event_type_categories (id, label, sort_order)
values
  ('users', 'User lifecycle', 10),
  ('billing', 'Billing & plans', 20),
  ('commerce', 'Orders & invoices', 30),
  ('security', 'Security', 40),
  ('product', 'Product usage', 50)
on conflict (id) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.event_types (id, event, label, description, category_id, icon, realtime, sample_payload, sort_order)
values
  (
    'user-signup',
    'user.signup',
    'User signed up',
    'Fires when a new account is created in your product.',
    'users',
    'UserPlus',
    true,
    '{"first_name":"Alex","plan":"free","country":"US"}'::jsonb,
    10
  ),
  (
    'user-plan-upgraded',
    'user.plan_upgraded',
    'Plan upgraded',
    'User moved to a higher tier or paid plan.',
    'billing',
    'ArrowUpCircle',
    true,
    '{"plan_name":"Pro","previous_plan":"free","first_name":"Jordan"}'::jsonb,
    20
  ),
  (
    'order-completed',
    'order.completed',
    'Order completed',
    'Checkout succeeded and the order is confirmed.',
    'commerce',
    'Package',
    true,
    '{"amount":299,"currency":"USD","product_name":"Annual Pro"}'::jsonb,
    30
  ),
  (
    'invoice-failed',
    'invoice.failed',
    'Invoice payment failed',
    'A recurring charge or invoice could not be collected.',
    'billing',
    'CreditCard',
    true,
    '{"amount":49,"currency":"USD","attempt":3}'::jsonb,
    40
  ),
  (
    'password-reset',
    'password.reset_requested',
    'Password reset requested',
    'User asked to reset their password.',
    'security',
    'KeyRound',
    false,
    '{"ip":"203.0.113.42"}'::jsonb,
    50
  ),
  (
    'subscription-cancelled',
    'subscription.cancelled',
    'Subscription cancelled',
    'User cancelled their subscription or trial ended.',
    'billing',
    'Receipt',
    true,
    '{"reason":"churn","plan":"pro"}'::jsonb,
    60
  ),
  (
    'trial-started',
    'trial.started',
    'Trial started',
    'User began a free trial period.',
    'product',
    'ArrowUpCircle',
    true,
    '{"trial_days":14,"plan":"pro"}'::jsonb,
    70
  ),
  (
    'feature-used',
    'feature.used',
    'Feature used',
    'User completed a key product action.',
    'product',
    'Package',
    true,
    '{"feature":"export_csv","count":1}'::jsonb,
    80
  ),
  (
    'trial-expiring',
    'trial.expiring',
    'Trial expiring soon',
    'Trial ends within a few days — good for nurture emails.',
    'product',
    'ArrowUpCircle',
    true,
    '{"days_left":3,"first_name":"Riley"}'::jsonb,
    90
  ),
  (
    'invoice-paid',
    'invoice.paid',
    'Invoice paid',
    'Payment succeeded for a subscription or one-time invoice.',
    'billing',
    'Receipt',
    true,
    '{"amount":120,"currency":"USD"}'::jsonb,
    100
  ),
  (
    'user-invited',
    'user.invited',
    'Team member invited',
    'Someone invited a colleague to the workspace.',
    'users',
    'UserPlus',
    true,
    '{"inviter_name":"Alex","role":"member"}'::jsonb,
    110
  ),
  (
    'login-suspicious',
    'login.suspicious',
    'Suspicious login detected',
    'Unusual sign-in location or device.',
    'security',
    'KeyRound',
    true,
    '{"country":"RU","device":"unknown"}'::jsonb,
    120
  )
on conflict (id) do update set
  event = excluded.event,
  label = excluded.label,
  description = excluded.description,
  category_id = excluded.category_id,
  icon = excluded.icon,
  realtime = excluded.realtime,
  sample_payload = excluded.sample_payload,
  sort_order = excluded.sort_order,
  enabled = true,
  updated_at = now();

insert into public.condition_field_definitions (field, label, description, value_type, operators, options, sort_order)
values
  (
    'user.metadata.plan',
    'User plan',
    null,
    'select',
    array['eq', 'neq', 'in', 'not_in']::text[],
    '[{"value":"free","label":"Free"},{"value":"pro","label":"Pro"},{"value":"enterprise","label":"Enterprise"}]'::jsonb,
    10
  ),
  (
    'user.metadata.country',
    'Country',
    null,
    'select',
    array['eq', 'neq', 'in', 'not_in']::text[],
    '[{"value":"US","label":"United States"},{"value":"IN","label":"India"},{"value":"GB","label":"United Kingdom"},{"value":"DE","label":"Germany"}]'::jsonb,
    20
  ),
  (
    'user.unsubscribed_product',
    'Product email subscription',
    'Whether the user receives product marketing emails',
    'boolean',
    array['eq']::text[],
    '[{"value":"false","label":"Subscribed to product emails"},{"value":"true","label":"Unsubscribed from product emails"}]'::jsonb,
    30
  ),
  (
    'user.metadata.marketing_opt_in',
    'Marketing subscription',
    null,
    'boolean',
    array['eq']::text[],
    '[{"value":"true","label":"Opted in to marketing"},{"value":"false","label":"Opted out of marketing"}]'::jsonb,
    40
  ),
  (
    'payload.order_total',
    'Order total',
    null,
    'number',
    array['eq', 'neq', 'gt', 'gte', 'lt', 'lte']::text[],
    null,
    50
  ),
  (
    'payload.product_name',
    'Product name',
    null,
    'string',
    array['eq', 'neq', 'contains']::text[],
    null,
    60
  ),
  (
    'user.created_at',
    'Account created',
    null,
    'date',
    array['date_before', 'date_after']::text[],
    null,
    70
  ),
  (
    'payload.amount',
    'Event amount',
    'Numeric value from the event payload (orders, invoices)',
    'number',
    array['eq', 'neq', 'gt', 'gte', 'lt', 'lte']::text[],
    null,
    80
  )
on conflict (field) do update set
  label = excluded.label,
  description = excluded.description,
  value_type = excluded.value_type,
  operators = excluded.operators,
  options = excluded.options,
  sort_order = excluded.sort_order,
  enabled = true;
