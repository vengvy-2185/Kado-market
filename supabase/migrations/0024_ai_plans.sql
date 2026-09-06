-- ============================================================
-- KADO MARKET — Phase 18: AI Store Assistant — subscription plans
-- ============================================================

do $$ begin
  create type ai_subscription_status as enum ('active', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists ai_plans (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  duration_months int not null check (duration_months in (1, 3, 12)),
  price           numeric(10,2) not null,
  message_limit   int not null default 500,
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_ai_plans_updated_at on ai_plans;
create trigger trg_ai_plans_updated_at
  before update on ai_plans
  for each row execute function set_updated_at();

insert into ai_plans (name, duration_months, price, message_limit, sort_order) values
  ('1 Month',  1,  5.00,   500, 1),
  ('3 Months', 3,  12.00, 1800, 2),
  ('1 Year',   12, 40.00, 8000, 3)
on conflict do nothing;

create table if not exists ai_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  plan_id         uuid not null references ai_plans(id),
  status          ai_subscription_status not null default 'active',
  payment_method  text not null default 'demo',
  started_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_subscriptions_store on ai_subscriptions(store_id);

-- ------------------------------------------------------------
-- AI USAGE — one row per store per calendar month
-- ------------------------------------------------------------
create table if not exists ai_usage (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  month           date not null, -- first day of the month, e.g. 2026-09-01
  messages_used   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_ai_usage unique (store_id, month)
);

drop trigger if exists trg_ai_usage_updated_at on ai_usage;
create trigger trg_ai_usage_updated_at
  before update on ai_usage
  for each row execute function set_updated_at();
