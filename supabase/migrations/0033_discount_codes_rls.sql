-- ============================================================
-- KADO MARKET — Phase 26: RLS for discount codes
-- ============================================================

alter table discount_codes enable row level security;

-- Only the owning seller (or admin) can browse the raw codes table —
-- customers never see it directly, only through validate_discount_code().
create policy "discount_codes_select_owner_or_admin"
  on discount_codes for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "discount_codes_insert_owner"
  on discount_codes for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "discount_codes_update_owner_or_admin"
  on discount_codes for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "discount_codes_delete_owner_or_admin"
  on discount_codes for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));
