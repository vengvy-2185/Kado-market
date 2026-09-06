-- ============================================================
-- KADO MARKET — Phase 2: Products & Inventory
-- ============================================================

do $$ begin
  create type product_status as enum ('draft', 'active', 'out_of_stock', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_condition as enum ('new', 'used', 'refurbished');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_txn_type as enum ('stock_in', 'stock_out', 'adjustment', 'order_reserved', 'order_released');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table if not exists products (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references stores(id) on delete cascade,
  category_id         uuid references categories(id) on delete set null,
  name                text not null,
  slug                text not null unique,
  description         text,
  price               numeric(10,2) not null check (price >= 0),
  compare_at_price    numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  sku                 text,
  brand               text,
  stock               int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 5,
  status              product_status not null default 'draft',
  condition           product_condition not null default 'new',
  weight              numeric(10,2),
  view_count          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_products_store on products(store_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_name_trgm on products using gin (to_tsvector('simple', name));

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- ------------------------------------------------------------
create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_product_images_product on product_images(product_id);

-- ------------------------------------------------------------
-- PRODUCT VARIANTS  (e.g. Color / Size / Storage combinations)
-- ------------------------------------------------------------
create table if not exists product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  variant_name text not null,               -- e.g. "256GB / Titanium Black"
  sku          text,
  price        numeric(10,2) check (price is null or price >= 0),  -- null = use product.price
  stock        int not null default 0 check (stock >= 0),
  attributes   jsonb not null default '{}', -- e.g. {"color":"Black","storage":"256GB"}
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_variants_product on product_variants(product_id);

drop trigger if exists trg_variants_updated_at on product_variants;
create trigger trg_variants_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- INVENTORY TRANSACTIONS  (append-only ledger; store_id denormalized for RLS/queries)
-- ------------------------------------------------------------
create table if not exists inventory_transactions (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete cascade,
  type        inventory_txn_type not null,
  quantity    int not null,             -- signed delta: +10 stock_in, -3 stock_out
  reason      text,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_inv_txn_store on inventory_transactions(store_id);
create index if not exists idx_inv_txn_product on inventory_transactions(product_id);

-- Every transaction automatically moves the product's (or variant's) stock,
-- so `products.stock` / `product_variants.stock` is always the current
-- balance and inventory_transactions is the full audit trail.
create or replace function apply_inventory_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.variant_id is not null then
    update product_variants
      set stock = greatest(0, stock + new.quantity)
      where id = new.variant_id;
  else
    update products
      set stock = greatest(0, stock + new.quantity)
      where id = new.product_id;
  end if;

  -- keep product status in sync when it fully sells out / gets restocked
  update products p
    set status = 'out_of_stock'
    where p.id = new.product_id
      and p.status = 'active'
      and p.stock = 0
      and not exists (select 1 from product_variants v where v.product_id = p.id and v.stock > 0);

  update products p
    set status = 'active'
    where p.id = new.product_id
      and p.status = 'out_of_stock'
      and (p.stock > 0 or exists (select 1 from product_variants v where v.product_id = p.id and v.stock > 0));

  return new;
end;
$$;

drop trigger if exists trg_apply_inventory_txn on inventory_transactions;
create trigger trg_apply_inventory_txn
  after insert on inventory_transactions
  for each row execute function apply_inventory_transaction();
