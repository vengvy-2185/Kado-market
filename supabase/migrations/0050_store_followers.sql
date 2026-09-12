-- ============================================================
-- KADO MARKET — Phase 57: real store follow/followers system
-- ============================================================

create table if not exists store_followers (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (store_id, user_id)
);

create index if not exists idx_store_followers_store on store_followers(store_id);
create index if not exists idx_store_followers_user on store_followers(user_id);

alter table store_followers enable row level security;

create policy "store_followers_select_public"
  on store_followers for select
  using (true); -- follower counts/lists are public, like any social platform

create policy "store_followers_insert_self"
  on store_followers for insert
  with check (auth.uid() = user_id);

create policy "store_followers_delete_self"
  on store_followers for delete
  using (auth.uid() = user_id);
