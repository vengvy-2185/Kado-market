-- ============================================================
-- KADO MARKET — Phase 19: fix AI knowledge base retrieval
-- ============================================================
-- Bug: search_store_knowledge() used the 'simple' text search config,
-- which does NOT strip stopwords (how/much/is/the/...) and
-- websearch_to_tsquery ANDs every word together — so a natural question
-- like "How much is the iced latte?" required the chunk to literally
-- contain "how" and "much" too, which it never does. Every question
-- fell through to the "I don't have that information" fallback.
--
-- Fix: re-index with the 'english' config (stopwords removed, stemming
-- applied — "latte" matches "lattes", etc.), and rank chunks by how many
-- of the question's significant words they contain (OR-based) instead of
-- requiring every single one (AND-based).

alter table ai_document_chunks drop column if exists search_vector;
alter table ai_document_chunks
  add column search_vector tsvector generated always as (to_tsvector('english', content)) stored;

drop index if exists idx_ai_chunks_search;
create index idx_ai_chunks_search on ai_document_chunks using gin(search_vector);

create or replace function search_store_knowledge(p_store_id uuid, p_query text, p_limit int default 5)
returns table(content text, rank real)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  and_query tsquery;
  or_query tsquery;
begin
  and_query := websearch_to_tsquery('english', p_query);
  if and_query is null or and_query = ''::tsquery then
    return;
  end if;

  -- Turn the AND query into an OR query so a chunk matching *some* of the
  -- meaningful words still ranks and gets returned, not just exact-all matches.
  or_query := to_tsquery('english', replace(and_query::text, ' & ', ' | '));

  return query
    select c.content, ts_rank(c.search_vector, or_query) as rank
    from ai_document_chunks c
    where c.store_id = p_store_id
      and c.search_vector @@ or_query
    order by rank desc
    limit p_limit;
end;
$$;

grant execute on function search_store_knowledge(uuid, text, int) to authenticated, anon;
