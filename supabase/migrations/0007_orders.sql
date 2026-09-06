-- ============================================================
-- KADO MARKET — Phase 4: Orders (single-store "Buy Now" checkout)
-- ============================================================
-- NOTE: this is a direct product → checkout → order flow (spec section 19),
-- not yet the full multi-store cart from section 18. Each order belongs to
-- exactly one store; a customer buying from two stores gets two orders.

do $$ begin
  create type order_status as enum (
    'pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'success', 'failed', 'expired', 'refunded');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- ADDRESSES
-- ------------------------------------------------------------
create table if not exists addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  address_line  text not null,
  city          text,
  province      text,
  country       text default 'Cambodia',
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_addresses_user on addresses(user_id);

drop trigger if exists trg_addresses_updated_at on addresses;
create trigger trg_addresses_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,          -- short human-friendly code, e.g. ORD-A1B2C3
  customer_id         uuid not null references profiles(id),
  store_id            uuid not null references stores(id),
  status              order_status not null default 'pending',
  payment_status      payment_status not null default 'pending',
  payment_method      text not null default 'demo',   -- DEMO MODE per spec section 31 — no real payment provider yet
  subtotal            numeric(10,2) not null default 0,
  shipping_fee        numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  shipping_address    jsonb not null,                 -- snapshot of the address at order time
  customer_note       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_store on orders(store_id);
create index if not exists idx_orders_status on orders(status);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- ORDER ITEMS  (store_id denormalized for RLS/queries)
-- ------------------------------------------------------------
create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  store_id        uuid not null references stores(id),
  product_id      uuid not null references products(id),
  variant_id      uuid references product_variants(id),
  product_name    text not null,   -- snapshot — survives later product edits/deletes
  product_image   text,
  unit_price      numeric(10,2) not null,
  quantity        int not null check (quantity > 0),
  subtotal        numeric(10,2) not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_store on order_items(store_id);

-- ------------------------------------------------------------
-- ORDER STATUS HISTORY  (auto-logged whenever an order's status changes)
-- ------------------------------------------------------------
create table if not exists order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  status      order_status not null,
  note        text,
  changed_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on order_status_history(order_id);

create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_order_status_insert on orders;
create trigger trg_log_order_status_insert
  after insert on orders
  for each row execute function log_order_status_change();

drop trigger if exists trg_log_order_status_update on orders;
create trigger trg_log_order_status_update
  after update on orders
  for each row execute function log_order_status_change();
