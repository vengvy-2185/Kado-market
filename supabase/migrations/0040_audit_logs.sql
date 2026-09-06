-- ============================================================
-- KADO MARKET — Phase 34: admin audit log
-- ============================================================
-- Records sensitive admin actions (store approval/suspension, user status
-- changes, support ticket resolution, platform settings changes) for
-- accountability — "who changed what, when." Only admins can read it;
-- writes happen via a SECURITY DEFINER function called from the relevant
-- server actions, so regular users can never insert fake entries.

create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles(id),
  action       text not null,        -- e.g. 'store.status_changed', 'user.status_changed'
  target_type  text not null,        -- e.g. 'store', 'profile', 'support_ticket'
  target_id    uuid,
  details      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on audit_logs(actor_id);

alter table audit_logs enable row level security;

create policy "audit_logs_select_admin"
  on audit_logs for select
  using (is_admin(auth.uid()));

create or replace function log_audit_event(p_action text, p_target_type text, p_target_id uuid, p_details jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_details);
end;
$$;

grant execute on function log_audit_event(text, text, uuid, jsonb) to authenticated;
