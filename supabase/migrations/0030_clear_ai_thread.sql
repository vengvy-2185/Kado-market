-- ============================================================
-- KADO MARKET — Phase 22: clear an entire AI conversation at once
-- ============================================================
-- The existing delete policy only lets a customer delete their own
-- individual questions (role='user'). This adds a bulk "clear everything"
-- action for either the thread's customer or the store's seller/admin,
-- including the AI's own answers — useful for resetting a test/demo
-- conversation without deleting messages one by one.

create or replace function clear_ai_thread(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from ai_threads t
    where t.id = p_thread_id
      and (t.customer_id = auth.uid() or owns_store(auth.uid(), t.store_id) or is_admin(auth.uid()))
  ) then
    return; -- not a participant — silently no-op
  end if;

  delete from ai_messages where thread_id = p_thread_id;
end;
$$;

grant execute on function clear_ai_thread(uuid) to authenticated;
