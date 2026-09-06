-- ============================================================
-- KADO MARKET — Phase 4: auto-reserve stock on order placement
-- ============================================================
-- Customers are NOT allowed to insert inventory_transactions directly (that
-- table's RLS only allows the owning seller/admin — see 0005_products_rls.sql).
-- Instead, placing an order_item automatically reserves stock through this
-- SECURITY DEFINER trigger, which then flows through the existing
-- apply_inventory_transaction() trigger from Phase 2 to decrement
-- products/product_variants.stock. The app code never touches
-- inventory_transactions directly for orders — this trigger is the only path.

create or replace function reserve_stock_on_order_item()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  order_customer_id uuid;
begin
  select customer_id into order_customer_id from orders where id = new.order_id;

  insert into inventory_transactions (store_id, product_id, variant_id, type, quantity, reason, created_by)
  values (
    new.store_id,
    new.product_id,
    new.variant_id,
    'order_reserved',
    -new.quantity,
    'Order item ' || new.id,
    order_customer_id
  );

  return new;
end;
$$;

drop trigger if exists trg_reserve_stock_on_order_item on order_items;
create trigger trg_reserve_stock_on_order_item
  after insert on order_items
  for each row execute function reserve_stock_on_order_item();
