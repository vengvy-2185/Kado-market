-- ============================================================
-- KADO MARKET — Phase 2: RLS for products / images / variants / inventory
-- ============================================================

create or replace function owns_product(uid uuid, target_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from products p
    join stores s on s.id = p.store_id
    where p.id = target_product_id and s.seller_id = uid
  );
$$;

alter table products               enable row level security;
alter table product_images         enable row level security;
alter table product_variants       enable row level security;
alter table inventory_transactions enable row level security;

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
-- Public sees only 'active' products belonging to an 'active' store.
-- The seller who owns the store (and admins) sees every status.
create policy "products_select_public_or_owner_or_admin"
  on products for select
  using (
    (
      status = 'active'
      and exists (select 1 from stores s where s.id = store_id and s.status = 'active')
    )
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

create policy "products_insert_owner"
  on products for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "products_update_owner_or_admin"
  on products for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "products_delete_owner_or_admin"
  on products for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- ------------------------------------------------------------
create policy "product_images_select_public_or_owner_or_admin"
  on product_images for select
  using (
    exists (
      select 1 from products p
      where p.id = product_id
        and (
          p.status = 'active'
          or owns_product(auth.uid(), p.id)
          or is_admin(auth.uid())
        )
    )
  );

create policy "product_images_write_owner_or_admin"
  on product_images for insert
  with check (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

create policy "product_images_update_owner_or_admin"
  on product_images for update
  using (owns_product(auth.uid(), product_id) or is_admin(auth.uid()))
  with check (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

create policy "product_images_delete_owner_or_admin"
  on product_images for delete
  using (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- PRODUCT VARIANTS
-- ------------------------------------------------------------
create policy "product_variants_select_public_or_owner_or_admin"
  on product_variants for select
  using (
    exists (
      select 1 from products p
      where p.id = product_id
        and (
          p.status = 'active'
          or owns_product(auth.uid(), p.id)
          or is_admin(auth.uid())
        )
    )
  );

create policy "product_variants_write_owner_or_admin"
  on product_variants for insert
  with check (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

create policy "product_variants_update_owner_or_admin"
  on product_variants for update
  using (owns_product(auth.uid(), product_id) or is_admin(auth.uid()))
  with check (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

create policy "product_variants_delete_owner_or_admin"
  on product_variants for delete
  using (owns_product(auth.uid(), product_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- INVENTORY TRANSACTIONS  (append-only ledger — no update/delete for sellers)
-- ------------------------------------------------------------
create policy "inventory_txn_select_owner_or_admin"
  on inventory_transactions for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "inventory_txn_insert_owner_or_admin"
  on inventory_transactions for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "inventory_txn_delete_admin"
  on inventory_transactions for delete
  using (is_admin(auth.uid()));
