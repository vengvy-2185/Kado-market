-- ============================================================
-- KADO MARKET — Phase 5: RLS for favorites + cart
-- ============================================================

alter table saved_products enable row level security;
alter table cart_items     enable row level security;

-- ------------------------------------------------------------
-- SAVED PRODUCTS — strictly private to the owning user
-- ------------------------------------------------------------
create policy "saved_products_select_own"
  on saved_products for select
  using (user_id = auth.uid());

create policy "saved_products_insert_own"
  on saved_products for insert
  with check (user_id = auth.uid());

create policy "saved_products_delete_own"
  on saved_products for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- CART ITEMS — strictly private to the owning user
-- ------------------------------------------------------------
create policy "cart_items_select_own"
  on cart_items for select
  using (user_id = auth.uid());

create policy "cart_items_insert_own"
  on cart_items for insert
  with check (user_id = auth.uid());

create policy "cart_items_update_own"
  on cart_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cart_items_delete_own"
  on cart_items for delete
  using (user_id = auth.uid());
