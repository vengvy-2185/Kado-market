-- ============================================================
-- KADO MARKET — Phase 7: Posts, likes, comments
-- ============================================================

-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  content     text not null,
  product_id  uuid references products(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_posts_store on posts(store_id);
create index if not exists idx_posts_created on posts(created_at desc);

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- POST MEDIA
-- ------------------------------------------------------------
create table if not exists post_media (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  url         text not null,
  media_type  text not null default 'image' check (media_type in ('image', 'video')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_post_media_post on post_media(post_id);

-- ------------------------------------------------------------
-- LIKES (posts only for now — product likes can reuse this shape later)
-- ------------------------------------------------------------
create table if not exists likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint uq_likes unique (post_id, user_id)
);

create index if not exists idx_likes_post on likes(post_id);

-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_comments_post on comments(post_id);
