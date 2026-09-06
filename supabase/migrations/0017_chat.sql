-- ============================================================
-- KADO MARKET — Phase 11: Customer <-> Seller chat
-- ============================================================

create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references profiles(id) on delete cascade,
  store_id     uuid not null references stores(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint uq_conversations unique (customer_id, store_id)
);

create index if not exists idx_conversations_customer on conversations(customer_id);
create index if not exists idx_conversations_store on conversations(store_id);

drop trigger if exists trg_conversations_updated_at on conversations;
create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references profiles(id),
  content          text not null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_messages_conversation on messages(conversation_id, created_at);

-- Bump the parent conversation's updated_at whenever a message lands, so
-- conversation lists can sort by most-recent activity.
create or replace function touch_conversation_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on messages;
create trigger trg_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_on_message();
