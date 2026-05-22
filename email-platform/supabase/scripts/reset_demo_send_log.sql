-- Run this in Supabase SQL Editor, then run the full 20250522000002_seed_demo_data.sql

delete from public.send_log
where provider_message_id like 're_demo_%'
   or provider_message_id in ('re_demo_skip_casey', 're_demo_fail_bad', 're_demo_skip_riley')
   or end_user_id in (select id from public.end_users where external_id like 'demo_%');

delete from public.send_log sl
using public.triggers tr, public.end_users u
where sl.trigger_id = tr.id
  and sl.end_user_id = u.id
  and u.external_id like 'demo_%'
  and tr.send_once_per_user = true
  and sl.status = 'sent';
