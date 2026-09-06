-- ============================================================
-- KADO MARKET — Phase 1: Core schema (profiles, stores, plans)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'seller', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active', 'suspended', 'banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type store_status as enum ('draft', 'pending_review', 'active', 'suspended', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_cycle as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- UPDATED_AT TRIGGER HELPER
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text,
  username      text unique,
  avatar_url    text,
  phone         text,
  bio           text,
  role          user_role not null default 'customer',
  status        account_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_username on profiles(username);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text,
  parent_id   uuid references categories(id) on delete set null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SUBSCRIPTION PLANS  (admin-configurable pricing)
-- ------------------------------------------------------------
create table if not exists subscription_plans (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  price_monthly       numeric(10,2) not null default 0,
  price_yearly        numeric(10,2) not null default 0,
  product_limit       int,                     -- null = unlimited
  ai_enabled          boolean not null default false,
  ai_message_limit    int not null default 0,
  analytics_enabled   boolean not null default false,
  stories_enabled     boolean not null default false,
  boost_enabled       boolean not null default false,
  chat_enabled        boolean not null default false,
  features            jsonb not null default '[]',
  is_active           boolean not null default true,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_plans_updated_at on subscription_plans;
create trigger trg_plans_updated_at
  before update on subscription_plans
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- STORES
-- ------------------------------------------------------------
create table if not exists stores (
  id                    uuid primary key default gen_random_uuid(),
  seller_id             uuid not null references profiles(id) on delete cascade,
  store_name            text not null,
  slug                  text not null unique,
  logo_url              text,
  cover_image_url       text,
  description           text,
  category              text,
  phone                 text,
  email                 text,
  address               text,
  city                  text,
  province              text,
  country               text default 'Cambodia',
  opening_hours         jsonb default '{}',
  facebook_url          text,
  telegram_url          text,
  tiktok_url            text,
  instagram_url         text,
  website_url           text,
  shipping_information  text,
  return_policy         text,
  payment_information   text,
  status                store_status not null default 'draft',
  verified              boolean not null default false,
  setup_step            int not null default 1,
  setup_completed       boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- one store per seller for now (relax later if multi-store sellers are needed)
  constraint uq_stores_seller unique (seller_id)
);

create index if not exists idx_stores_status on stores(status);
create index if not exists idx_stores_seller on stores(seller_id);
create index if not exists idx_stores_slug on stores(slug);

drop trigger if exists trg_stores_updated_at on stores;
create trigger trg_stores_updated_at
  before update on stores
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- STORE SETTINGS  (flexible key/value bag for future features)
-- ------------------------------------------------------------
create table if not exists store_settings (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null unique references stores(id) on delete cascade,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_store_settings_updated_at on store_settings;
create trigger trg_store_settings_updated_at
  before update on store_settings
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- STORE SUBSCRIPTIONS
-- ------------------------------------------------------------
create table if not exists store_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  store_id               uuid not null references stores(id) on delete cascade,
  plan_id                uuid not null references subscription_plans(id),
  status                 subscription_status not null default 'trialing',
  billing_cycle          billing_cycle not null default 'monthly',
  current_period_start   timestamptz not null default now(),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_store_subs_store on store_subscriptions(store_id);

drop trigger if exists trg_store_subs_updated_at on store_subscriptions;
create trigger trg_store_subs_updated_at
  before update on store_subscriptions
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- HANDLE NEW USER  (auth.users -> profiles [+ draft store for sellers])
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta        jsonb := new.raw_user_meta_data;
  chosen_role user_role := coalesce((meta->>'role')::user_role, 'customer');
  store_name  text := meta->>'store_name';
  base_slug   text;
  final_slug  text;
  suffix      int := 0;
begin
  insert into profiles (id, email, full_name, username, phone, role)
  values (
    new.id,
    new.email,
    meta->>'full_name',
    meta->>'username',
    meta->>'phone',
    chosen_role
  )
  on conflict (id) do nothing;

  if chosen_role = 'seller' and store_name is not null and length(trim(store_name)) > 0 then
    base_slug := lower(regexp_replace(trim(store_name), '[^a-zA-Z0-9]+', '-', 'g'));
    final_slug := base_slug;
    while exists (select 1 from stores where slug = final_slug) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;

    insert into stores (seller_id, store_name, slug, category, phone, status, setup_step)
    values (new.id, store_name, final_slug, meta->>'business_category', meta->>'phone', 'draft', 1)
    on conflict (seller_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
