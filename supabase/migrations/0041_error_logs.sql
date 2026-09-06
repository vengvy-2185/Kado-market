-- ============================================================
-- KADO MARKET — Phase 34: application error logging
-- ============================================================
-- Captures real runtime errors (unhandled exceptions in React error
-- boundaries, and caught errors in key server actions) so an admin can see
-- what's actually breaking for users, instead of only hearing about it
-- via support tickets. Writes go through a SECURITY DEFINER function so
-- any authenticated (or anonymous) user's browser can report an error
-- without needing table-level insert access.

create table if not exists error_logs (
  id          uuid primary key default gen_random_uuid(),
  level       text not null default 'error' check (level in ('error', 'warning')),
  message     text not null,
  stack       text,
  path        text,
  user_id     uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_error_logs_created on error_logs(created_at desc);

alter table error_logs enable row level security;

create policy "error_logs_select_admin"
  on error_logs for select
  using (is_admin(auth.uid()));

create or replace function log_client_error(p_message text, p_stack text, p_path text, p_level text default 'error')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into error_logs (level, message, stack, path, user_id)
  values (coalesce(p_level, 'error'), p_message, p_stack, p_path, auth.uid());
end;
$$;

grant execute on function log_client_error(text, text, text, text) to authenticated, anon;
