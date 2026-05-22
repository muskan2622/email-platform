-- Speed up dashboard list queries ordered by created_at

create index if not exists send_log_created_at_idx
  on public.send_log (created_at desc);

create index if not exists templates_updated_at_idx
  on public.templates (updated_at desc);
