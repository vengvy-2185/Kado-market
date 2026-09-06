-- ============================================================
-- KADO MARKET — Phase 17: chat edit/delete/reply/attachments
-- ============================================================

alter table messages add column if not exists reply_to_id uuid references messages(id) on delete set null;
alter table messages add column if not exists attachment_url text;
alter table messages add column if not exists edited_at timestamptz;

-- content can now be empty if the message is attachment-only
alter table messages alter column content drop not null;

create index if not exists idx_messages_reply_to on messages(reply_to_id);

-- ------------------------------------------------------------
-- Allow the sender to edit or delete their own messages
-- ------------------------------------------------------------
create policy "messages_update_own"
  on messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "messages_delete_own"
  on messages for delete
  using (sender_id = auth.uid());

-- ------------------------------------------------------------
-- Helper: is the caller a participant of this conversation?
-- ------------------------------------------------------------
create or replace function is_conversation_participant(uid uuid, target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversations c
    where c.id = target_conversation_id
      and (c.customer_id = uid or owns_store(uid, c.store_id))
  );
$$;

-- ------------------------------------------------------------
-- CHAT ATTACHMENTS BUCKET — path: {conversation_id}/{filename}
-- Made public for simplicity (same pattern as the other media buckets);
-- only a conversation participant can upload into a given conversation's
-- folder, which keeps the path itself unguessable in practice.
-- ------------------------------------------------------------
update storage.buckets set public = true where id = 'chat-attachments';

create policy "chat_attachments_public_read"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');

create policy "chat_attachments_participant_write"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and is_conversation_participant(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
