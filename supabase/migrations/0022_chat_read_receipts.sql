-- ============================================================
-- KADO MARKET — Phase 16: chat read receipts (for unread badges)
-- ============================================================

alter table messages add column if not exists read_at timestamptz;

-- Marks every unread message in a conversation (that wasn't sent by the
-- caller) as read. SECURITY DEFINER so it can update rows the caller
-- doesn't directly own, but it only ever touches messages in a
-- conversation the caller is actually a participant of.
create or replace function mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from conversations c
    where c.id = p_conversation_id
      and (c.customer_id = auth.uid() or owns_store(auth.uid(), c.store_id))
  ) then
    return; -- not a participant — silently no-op
  end if;

  update messages
    set read_at = now()
    where conversation_id = p_conversation_id
      and sender_id != auth.uid()
      and read_at is null;
end;
$$;

grant execute on function mark_conversation_read(uuid) to authenticated;
