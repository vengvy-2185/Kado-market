-- ============================================================
-- KADO MARKET — Phase 1: Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- HELPER FUNCTIONS  (security definer -> avoid RLS recursion)
-- ------------------------------------------------------------
create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'super_admin')
  );
$$;

create or replace function is_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = uid and role = 'super_admin'
  );
$$;

create or replace function owns_store(uid uuid, target_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from stores
    where id = target_store_id and seller_id = uid
  );
$$;

-- ------------------------------------------------------------
-- ENABLE RLS
-- ------------------------------------------------------------
alter table profiles             enable row level security;
alter table categories           enable row level security;
alter table subscription_plans   enable row level security;
alter table stores               enable row level security;
alter table store_settings       enable row level security;
alter table store_subscriptions  enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
-- Public profile info is readable by anyone (feed, store pages, etc.)
create policy "profiles_select_all"
  on profiles for select
  using (true);

-- Users can only ever insert their own row (normally done by the trigger)
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile; admins can update any profile
create policy "profiles_update_own_or_admin"
  on profiles for update
  using (auth.uid() = id or is_admin(auth.uid()))
  with check (auth.uid() = id or is_admin(auth.uid()));

-- Only super admins can delete profiles (soft-ban via status is preferred)
create policy "profiles_delete_super_admin"
  on profiles for delete
  using (is_super_admin(auth.uid()));

-- ------------------------------------------------------------
-- CATEGORIES  (public read, admin write)
-- ------------------------------------------------------------
create policy "categories_select_all"
  on categories for select
  using (true);

create policy "categories_write_admin"
  on categories for insert
  with check (is_admin(auth.uid()));

create policy "categories_update_admin"
  on categories for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "categories_delete_admin"
  on categories for delete
  using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- SUBSCRIPTION PLANS  (public read, admin write)
-- ------------------------------------------------------------
create policy "plans_select_all"
  on subscription_plans for select
  using (true);

create policy "plans_write_admin"
  on subscription_plans for insert
  with check (is_admin(auth.uid()));

create policy "plans_update_admin"
  on subscription_plans for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "plans_delete_admin"
  on subscription_plans for delete
  using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- STORES
-- ------------------------------------------------------------
-- Public can see active stores; owner sees their own store in any status; admins see all
create policy "stores_select_public_or_owner_or_admin"
  on stores for select
  using (
    status = 'active'
    or seller_id = auth.uid()
    or is_admin(auth.uid())
  );

-- Only a profile with role='seller' can create a store, and only for themselves
create policy "stores_insert_own_seller"
  on stores for insert
  with check (
    seller_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role = 'seller')
  );

-- Owner can update their own store; admins can update any store (approve/suspend)
create policy "stores_update_owner_or_admin"
  on stores for update
  using (seller_id = auth.uid() or is_admin(auth.uid()))
  with check (seller_id = auth.uid() or is_admin(auth.uid()));

-- Only admins can hard-delete a store
create policy "stores_delete_admin"
  on stores for delete
  using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- STORE SETTINGS
-- ------------------------------------------------------------
create policy "store_settings_select_owner_or_admin"
  on store_settings for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "store_settings_insert_owner"
  on store_settings for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "store_settings_update_owner_or_admin"
  on store_settings for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "store_settings_delete_admin"
  on store_settings for delete
  using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- STORE SUBSCRIPTIONS
-- ------------------------------------------------------------
create policy "store_subs_select_owner_or_admin"
  on store_subscriptions for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- Demo-mode: store owner can create their own subscription record (checkout flow)
create policy "store_subs_insert_owner_or_admin"
  on store_subscriptions for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "store_subs_update_owner_or_admin"
  on store_subscriptions for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "store_subs_delete_admin"
  on store_subscriptions for delete
  using (is_admin(auth.uid()));
