-- ============================================================
-- KADO MARKET — Phase 20: AI chat read-tracking + editable questions
-- ============================================================

alter table ai_messages add column if not exists read_at timestamptz;

-- Marks a seller's unread customer questions (role='user') in one thread
-- as read. Only the store's own seller (or admin) can call this
-- meaningfully — it's a no-op otherwise.
create or replace function mark_ai_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from ai_threads t
    where t.id = p_thread_id and (owns_store(auth.uid(), t.store_id) or is_admin(auth.uid()))
  ) then
    return;
  end if;

  update ai_messages
    set read_at = now()
    where thread_id = p_thread_id
      and role = 'user'
      and read_at is null;
end;
$$;

grant execute on function mark_ai_thread_read(uuid) to authenticated;

-- Customers can edit or delete their own questions (role='user') in their
-- own thread. AI answers are never editable/deletable by the customer.
create policy "ai_messages_update_own_question"
  on ai_messages for update
  using (
    role = 'user'
    and exists (select 1 from ai_threads t where t.id = thread_id and t.customer_id = auth.uid())
  )
  with check (
    role = 'user'
    and exists (select 1 from ai_threads t where t.id = thread_id and t.customer_id = auth.uid())
  );

create policy "ai_messages_delete_own_question"
  on ai_messages for delete
  using (
    role = 'user'
    and exists (select 1 from ai_threads t where t.id = thread_id and t.customer_id = auth.uid())
  );
