-- ============================================================
-- KADO MARKET — Phase 27: RLS for Boost
-- ============================================================

alter table boost_plans     enable row level security;
alter table boost_campaigns enable row level security;

-- ------------------------------------------------------------
-- BOOST PLANS — public read (pricing), admin write
-- ------------------------------------------------------------
create policy "boost_plans_select_all" on boost_plans for select using (true);
create policy "boost_plans_write_admin" on boost_plans for insert with check (is_admin(auth.uid()));
create policy "boost_plans_update_admin" on boost_plans for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "boost_plans_delete_admin" on boost_plans for delete using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- BOOST CAMPAIGNS — owner manages their own; anyone can see which
-- posts/products are *currently* boosted (needed to show "Sponsored" tags
-- in the public feed) without exposing spend/history to everyone.
-- ------------------------------------------------------------
create policy "boost_campaigns_select_active_public"
  on boost_campaigns for select
  using (status = 'active' and expires_at > now());

create policy "boost_campaigns_select_owner_or_admin"
  on boost_campaigns for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "boost_campaigns_insert_owner"
  on boost_campaigns for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "boost_campaigns_update_owner_or_admin"
  on boost_campaigns for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));
