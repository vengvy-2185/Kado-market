-- ============================================================
-- KADO MARKET — Phase 32: platform settings (platform-level KHQR)
-- ============================================================
-- A single-row table for KADO MARKET's own operator settings — currently
-- just the platform's own Bakong info, so sellers can pay their
-- subscription/AI/boost fees via KHQR directly to the platform (not to an
-- individual store). Public read (needed to render the QR to any seller);
-- admin-only write.

create table if not exists platform_settings (
  id                  int primary key default 1,
  platform_name       text not null default 'KADO MARKET',
  platform_city       text not null default 'Phnom Penh',
  bakong_account_id   text,
  bakong_phone        text,
  updated_at          timestamptz not null default now(),

  constraint chk_platform_settings_singleton check (id = 1)
);

insert into platform_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_platform_settings_updated_at on platform_settings;
create trigger trg_platform_settings_updated_at
  before update on platform_settings
  for each row execute function set_updated_at();

alter table platform_settings enable row level security;

create policy "platform_settings_select_all"
  on platform_settings for select
  using (true);

create policy "platform_settings_update_admin"
  on platform_settings for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
