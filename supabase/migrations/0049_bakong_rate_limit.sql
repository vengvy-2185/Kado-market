-- ============================================================
-- KADO MARKET — Phase 55: protect the shared 100/day Bakong API quota
-- ============================================================
-- The whole platform shares ONE developer token with a hard 100
-- requests/day limit from NBC. Without a server-side guard, repeated
-- clicks (or many customers checking at once) could burn through the
-- entire day's quota in minutes. Tracked here, enforced in
-- verifyBakongPayment() — never trust a client-side cooldown alone for
-- something this easy to exhaust.

create table if not exists bakong_api_calls (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete set null,
  called_at   timestamptz not null default now()
);

create index if not exists idx_bakong_api_calls_time on bakong_api_calls(called_at desc);

alter table bakong_api_calls enable row level security;
-- No policies — only ever written/read via the service-role client from
-- the verifyBakongPayment server action.

-- Per-order cooldown, so one impatient customer re-clicking can't burn
-- through the shared daily quota by themselves.
alter table orders add column if not exists bakong_last_checked_at timestamptz;
