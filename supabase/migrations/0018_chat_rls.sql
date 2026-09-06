-- ============================================================
-- KADO MARKET — Phase 11: RLS for chat
-- ============================================================

alter table conversations enable row level security;
alter table messages      enable row level security;

-- ------------------------------------------------------------
-- CONVERSATIONS — participant-only (the customer or the store's seller)
-- ------------------------------------------------------------
create policy "conversations_select_participant_or_admin"
  on conversations for select
  using (
    customer_id = auth.uid()
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

-- only the customer can start a conversation with a store
create policy "conversations_insert_customer"
  on conversations for insert
  with check (customer_id = auth.uid());

-- ------------------------------------------------------------
-- MESSAGES — participant-only, sender must be the caller
-- ------------------------------------------------------------
create policy "messages_select_participant_or_admin"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or owns_store(auth.uid(), c.store_id) or is_admin(auth.uid()))
    )
  );

create policy "messages_insert_participant"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or owns_store(auth.uid(), c.store_id))
    )
  );
