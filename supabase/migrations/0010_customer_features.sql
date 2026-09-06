-- ============================================================
-- KADO MARKET — Phase 5: Customer profile features (favorites + cart)
-- ============================================================

-- ------------------------------------------------------------
-- SAVED PRODUCTS (favorites / wishlist)
-- ------------------------------------------------------------
create table if not exists saved_products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint uq_saved_products unique (user_id, product_id)
);

create index if not exists idx_saved_products_user on saved_products(user_id);
create index if not exists idx_saved_products_product on saved_products(product_id);

-- ------------------------------------------------------------
-- CART ITEMS (persists across sessions/devices, organized by store at read time)
-- ------------------------------------------------------------
create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete cascade,
  quantity    int not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- one row per (user, product, variant) combination — re-adding just bumps quantity
  constraint uq_cart_items unique (user_id, product_id, variant_id)
);

create index if not exists idx_cart_items_user on cart_items(user_id);

drop trigger if exists trg_cart_items_updated_at on cart_items;
create trigger trg_cart_items_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- PROFILE AVATAR (already has avatar_url column from Phase 1 — nothing to add)
-- ------------------------------------------------------------
