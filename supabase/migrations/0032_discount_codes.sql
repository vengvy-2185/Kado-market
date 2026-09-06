-- ============================================================
-- KADO MARKET — Phase 26: Marketing — discount codes
-- ============================================================

do $$ begin
  create type discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

create table if not exists discount_codes (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references stores(id) on delete cascade,
  code               text not null,
  discount_type      discount_type not null default 'percent',
  value              numeric(10,2) not null check (value > 0),
  min_order_amount   numeric(10,2) not null default 0,
  usage_limit        int,                 -- null = unlimited
  used_count         int not null default 0,
  expires_at         timestamptz,         -- null = never expires
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint uq_discount_codes unique (store_id, code)
);

create index if not exists idx_discount_codes_store on discount_codes(store_id);

drop trigger if exists trg_discount_codes_updated_at on discount_codes;
create trigger trg_discount_codes_updated_at
  before update on discount_codes
  for each row execute function set_updated_at();

-- Track which discount (if any) was applied to an order
alter table orders add column if not exists discount_code text;
alter table orders add column if not exists discount_amount numeric(10,2) not null default 0;

-- ------------------------------------------------------------
-- Validate a code and return the discount amount it would apply —
-- without exposing the discount_codes table itself to customers.
-- Returns 0 (not null) when invalid, so callers can just check > 0.
-- ------------------------------------------------------------
create or replace function validate_discount_code(p_store_id uuid, p_code text, p_subtotal numeric)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  dc discount_codes%rowtype;
  discount numeric;
begin
  select * into dc
  from discount_codes
  where store_id = p_store_id
    and upper(code) = upper(p_code)
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or used_count < usage_limit)
    and p_subtotal >= min_order_amount;

  if not found then
    return 0;
  end if;

  if dc.discount_type = 'percent' then
    discount := round(p_subtotal * (dc.value / 100), 2);
  else
    discount := dc.value;
  end if;

  return least(discount, p_subtotal);
end;
$$;

grant execute on function validate_discount_code(uuid, text, numeric) to authenticated, anon;

-- ------------------------------------------------------------
-- Increment usage after a successful order — called once the order is
-- actually placed, never just on validation.
-- ------------------------------------------------------------
create or replace function redeem_discount_code(p_store_id uuid, p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update discount_codes
    set used_count = used_count + 1
    where store_id = p_store_id and upper(code) = upper(p_code);
$$;

grant execute on function redeem_discount_code(uuid, text) to authenticated;
