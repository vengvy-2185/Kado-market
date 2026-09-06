-- ============================================================
-- KADO MARKET — Phase 35: platform Telegram (admin purchase alerts)
-- ============================================================

alter table platform_settings add column if not exists telegram_bot_token text;
alter table platform_settings add column if not exists telegram_bot_username text;
alter table platform_settings add column if not exists telegram_chat_id text;

-- ------------------------------------------------------------
-- SECURITY FIX: platform_settings had a public SELECT policy from
-- migration 0037, which would expose the new telegram_bot_token /
-- telegram_chat_id columns to everyone (RLS is row-level, not
-- column-level). Replace public read access with a function that only
-- returns the non-sensitive KHQR display fields sellers actually need.
-- ------------------------------------------------------------

drop policy if exists "platform_settings_select_all" on platform_settings;

create policy "platform_settings_select_admin"
  on platform_settings for select
  using (is_admin(auth.uid()));

create or replace function get_public_platform_khqr()
returns table(platform_name text, platform_city text, bakong_account_id text, bakong_phone text)
language sql
security definer
set search_path = public
stable
as $$
  select platform_name, platform_city, bakong_account_id, bakong_phone
  from platform_settings
  where id = 1;
$$;

grant execute on function get_public_platform_khqr() to authenticated, anon;
