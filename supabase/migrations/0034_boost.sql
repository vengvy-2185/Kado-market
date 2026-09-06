-- ============================================================
-- KADO MARKET — Phase 27: Boost (paid post/product promotion)
-- ============================================================

do $$ begin
  create type boost_target_type as enum ('post', 'product');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boost_status as enum ('active', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists boost_plans (
  id             uuid primary key default gen_random_uuid(),
  duration_days  int not null check (duration_days in (1, 3, 7, 30)),
  price          numeric(10,2) not null,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_boost_plans_updated_at on boost_plans;
create trigger trg_boost_plans_updated_at
  before update on boost_plans
  for each row execute function set_updated_at();

insert into boost_plans (duration_days, price, sort_order) values
  (1,  1.00,  1),
  (3,  2.50,  2),
  (7,  5.00,  3),
  (30, 15.00, 4)
on conflict do nothing;

create table if not exists boost_campaigns (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  target_type    boost_target_type not null,
  post_id        uuid references posts(id) on delete cascade,
  product_id     uuid references products(id) on delete cascade,
  plan_id        uuid not null references boost_plans(id),
  status         boost_status not null default 'active',
  payment_method text not null default 'demo',
  started_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),

  constraint chk_boost_target check (
    (target_type = 'post' and post_id is not null and product_id is null)
    or (target_type = 'product' and product_id is not null and post_id is null)
  )
);

create index if not exists idx_boost_campaigns_store on boost_campaigns(store_id);
create index if not exists idx_boost_campaigns_post on boost_campaigns(post_id) where post_id is not null;
create index if not exists idx_boost_campaigns_product on boost_campaigns(product_id) where product_id is not null;

-- Real-time check used by the feed: "is this post/product currently boosted?"
create or replace function is_post_boosted(p_post_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from boost_campaigns
    where post_id = p_post_id and status = 'active' and expires_at > now()
  );
$$;

grant execute on function is_post_boosted(uuid) to authenticated, anon;
