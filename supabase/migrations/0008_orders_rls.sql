-- ============================================================
-- KADO MARKET — Phase 4: RLS for orders
-- ============================================================

alter table addresses            enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;

-- ------------------------------------------------------------
-- ADDRESSES — strictly private to the owning user
-- ------------------------------------------------------------
create policy "addresses_select_own_or_admin"
  on addresses for select
  using (user_id = auth.uid() or is_admin(auth.uid()));

create policy "addresses_insert_own"
  on addresses for insert
  with check (user_id = auth.uid());

create policy "addresses_update_own"
  on addresses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "addresses_delete_own"
  on addresses for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- ORDERS — customer sees their own orders, seller sees orders for their
-- store, admin sees everything. No one but the customer can create an
-- order for themselves; only the seller/admin can change its status.
-- ------------------------------------------------------------
create policy "orders_select_customer_or_seller_or_admin"
  on orders for select
  using (
    customer_id = auth.uid()
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

create policy "orders_insert_own_customer"
  on orders for insert
  with check (customer_id = auth.uid());

create policy "orders_update_seller_or_admin"
  on orders for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "orders_delete_admin"
  on orders for delete
  using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------
create policy "order_items_select_customer_or_seller_or_admin"
  on order_items for select
  using (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

-- Items are inserted as part of placing an order — the order itself must
-- belong to the caller (checked via the FK'd orders row, RLS-protected above)
create policy "order_items_insert_via_own_order"
  on order_items for insert
  with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- ------------------------------------------------------------
-- ORDER STATUS HISTORY — read-only trail, same visibility as the order
-- ------------------------------------------------------------
create policy "order_status_history_select"
  on order_status_history for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or owns_store(auth.uid(), o.store_id) or is_admin(auth.uid()))
    )
  );

-- inserted only by the log_order_status_change() trigger (security definer),
-- so no direct insert/update/delete policy is needed for regular users.
