-- ============================================================
-- KADO MARKET — Phase 34: login rate limiting (brute-force protection)
-- ============================================================
-- Tracks login attempts per email so repeated failures can be blocked
-- server-side, in addition to whatever rate limiting Supabase Auth itself
-- already applies. Only ever written/read via the service-role client from
-- a server action — no client-side or anon access, so RLS is left at
-- "enabled, no policies" (default deny) rather than granting anyone access.

create table if not exists login_attempts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  success     boolean not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_login_attempts_email_time on login_attempts(email, created_at desc);

alter table login_attempts enable row level security;
-- Intentionally no policies — only the service-role client (which bypasses
-- RLS) touches this table, from server actions.

-- Auto-clean old rows so this table doesn't grow forever (keeps 7 days)
create or replace function prune_old_login_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from login_attempts where created_at < now() - interval '7 days';
$$;
