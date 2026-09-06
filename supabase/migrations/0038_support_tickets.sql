-- ============================================================
-- KADO MARKET — Phase 32: seller support tickets
-- ============================================================

do $$ begin
  create type support_ticket_status as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null; end $$;

create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  created_by   uuid not null references profiles(id),
  subject      text not null,
  message      text not null,
  status       support_ticket_status not null default 'open',
  admin_reply  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_support_tickets_store on support_tickets(store_id);
create index if not exists idx_support_tickets_status on support_tickets(status);

drop trigger if exists trg_support_tickets_updated_at on support_tickets;
create trigger trg_support_tickets_updated_at
  before update on support_tickets
  for each row execute function set_updated_at();

alter table support_tickets enable row level security;

-- Seller sees/creates their own store's tickets; admin sees and resolves all
create policy "support_tickets_select_owner_or_admin"
  on support_tickets for select
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "support_tickets_insert_owner"
  on support_tickets for insert
  with check (owns_store(auth.uid(), store_id) and created_by = auth.uid());

create policy "support_tickets_update_admin"
  on support_tickets for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
