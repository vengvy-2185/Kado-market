-- ============================================================
-- KADO MARKET — Phase 18: RLS for AI Assistant
-- ============================================================

alter table ai_plans            enable row level security;
alter table ai_subscriptions    enable row level security;
alter table ai_usage            enable row level security;
alter table ai_documents        enable row level security;
alter table ai_document_chunks  enable row level security;
alter table ai_threads          enable row level security;
alter table ai_messages         enable row level security;

-- ------------------------------------------------------------
-- AI PLANS — public read (pricing page), admin write
-- ------------------------------------------------------------
create policy "ai_plans_select_all" on ai_plans for select using (true);
create policy "ai_plans_write_admin" on ai_plans for insert with check (is_admin(auth.uid()));
create policy "ai_plans_update_admin" on ai_plans for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "ai_plans_delete_admin" on ai_plans for delete using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- AI SUBSCRIPTIONS — store owner + admin only
-- ------------------------------------------------------------
create policy "ai_subs_select_owner_or_admin"
  on ai_subscriptions for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_subs_insert_owner"
  on ai_subscriptions for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_subs_update_owner_or_admin"
  on ai_subscriptions for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- AI USAGE — store owner + admin only (read); writes go through the
-- ask-the-assistant server action using the service role, not client RLS
-- ------------------------------------------------------------
create policy "ai_usage_select_owner_or_admin"
  on ai_usage for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- AI DOCUMENTS / CHUNKS — strictly the owning seller (+ admin). Never
-- exposed to customers directly; the search_store_knowledge() function
-- (SECURITY DEFINER) is the only retrieval path for the public chat flow.
-- ------------------------------------------------------------
create policy "ai_documents_select_owner_or_admin"
  on ai_documents for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_documents_insert_owner"
  on ai_documents for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_documents_delete_owner_or_admin"
  on ai_documents for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_chunks_select_owner_or_admin"
  on ai_document_chunks for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_chunks_insert_owner"
  on ai_document_chunks for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_chunks_delete_owner_or_admin"
  on ai_document_chunks for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- AI THREADS — the customer who owns it, or the store's seller/admin
-- ------------------------------------------------------------
create policy "ai_threads_select_participant_or_admin"
  on ai_threads for select
  using (customer_id = auth.uid() or owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "ai_threads_insert_customer"
  on ai_threads for insert
  with check (customer_id = auth.uid());

-- ------------------------------------------------------------
-- AI MESSAGES — visible to the thread's customer or the store's seller
-- ------------------------------------------------------------
create policy "ai_messages_select_participant_or_admin"
  on ai_messages for select
  using (
    exists (
      select 1 from ai_threads t
      where t.id = thread_id
        and (t.customer_id = auth.uid() or owns_store(auth.uid(), t.store_id) or is_admin(auth.uid()))
    )
  );

create policy "ai_messages_insert_participant"
  on ai_messages for insert
  with check (
    exists (
      select 1 from ai_threads t
      where t.id = thread_id and t.customer_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- AI DOCUMENTS STORAGE BUCKET — path: {store_id}/{filename}; private,
-- only the owning seller can read/write their own documents.
-- ------------------------------------------------------------
create policy "ai_documents_bucket_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'ai-documents'
    and (owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid) or is_admin(auth.uid()))
  );

create policy "ai_documents_bucket_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'ai-documents'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "ai_documents_bucket_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'ai-documents'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
