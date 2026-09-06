-- ============================================================
-- KADO MARKET — Phase 9: product view counter
-- ============================================================

create or replace function increment_product_view(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update products set view_count = view_count + 1 where id = p_product_id;
$$;

-- Anyone (including anonymous visitors) can trigger a view count —
-- the function itself only ever touches view_count, nothing sensitive.
grant execute on function increment_product_view(uuid) to authenticated, anon;
