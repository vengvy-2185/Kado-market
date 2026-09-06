-- ============================================================
-- KADO MARKET — Phase 13: Stories (24-hour expiring)
-- ============================================================

do $$ begin
  create type story_media_type as enum ('image', 'video', 'text');
exception when duplicate_object then null; end $$;

create table if not exists stories (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  media_type   story_media_type not null default 'image',
  media_url    text,                      -- null when media_type = 'text'
  caption      text,
  text_content text,                      -- used when media_type = 'text'
  product_id   uuid references products(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idx_stories_store on stories(store_id);
create index if not exists idx_stories_expires on stories(expires_at);
