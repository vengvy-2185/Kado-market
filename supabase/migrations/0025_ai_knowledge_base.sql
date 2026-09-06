-- ============================================================
-- KADO MARKET — Phase 18: AI knowledge base (documents + chunks)
-- ============================================================

do $$ begin
  create type ai_document_status as enum ('processed', 'unsupported', 'error');
exception when duplicate_object then null; end $$;

create table if not exists ai_documents (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  file_name       text not null,
  file_type       text not null,
  storage_url     text not null,
  status          ai_document_status not null default 'processed',
  char_count      int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_documents_store on ai_documents(store_id);

-- ------------------------------------------------------------
-- CHUNKS — plain-text pieces of each document, with a generated tsvector
-- column so retrieval is real Postgres full-text search (no embeddings
-- provider required to get "search this store's knowledge" working).
-- ------------------------------------------------------------
create table if not exists ai_document_chunks (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references ai_documents(id) on delete cascade,
  store_id        uuid not null references stores(id) on delete cascade,
  content         text not null,
  search_vector   tsvector generated always as (to_tsvector('simple', content)) stored,
  chunk_index     int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_chunks_store on ai_document_chunks(store_id);
create index if not exists idx_ai_chunks_document on ai_document_chunks(document_id);
create index if not exists idx_ai_chunks_search on ai_document_chunks using gin(search_vector);

-- ------------------------------------------------------------
-- Retrieval function: top-N chunks for a store matching a query.
-- SECURITY DEFINER so the public-facing "ask AI" flow can retrieve
-- context without granting customers direct table access to chunks.
-- ------------------------------------------------------------
create or replace function search_store_knowledge(p_store_id uuid, p_query text, p_limit int default 5)
returns table(content text, rank real)
language sql
security definer
set search_path = public
stable
as $$
  select content, ts_rank(search_vector, websearch_to_tsquery('simple', p_query)) as rank
  from ai_document_chunks
  where store_id = p_store_id
    and search_vector @@ websearch_to_tsquery('simple', p_query)
  order by rank desc
  limit p_limit;
$$;

grant execute on function search_store_knowledge(uuid, text, int) to authenticated, anon;

-- ------------------------------------------------------------
-- AI THREADS + MESSAGES — separate from the human chat (conversations/
-- messages) so the two are never mixed up.
-- ------------------------------------------------------------
create table if not exists ai_threads (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint uq_ai_threads unique (store_id, customer_id)
);

drop trigger if exists trg_ai_threads_updated_at on ai_threads;
create trigger trg_ai_threads_updated_at
  before update on ai_threads
  for each row execute function set_updated_at();

do $$ begin
  create type ai_message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

create table if not exists ai_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references ai_threads(id) on delete cascade,
  role        ai_message_role not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_ai_messages_thread on ai_messages(thread_id, created_at);
