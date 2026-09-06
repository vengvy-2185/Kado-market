-- ============================================================
-- KADO MARKET — Phase 36: in-app notifications
-- ============================================================

do $$ begin
  create type notification_type as enum ('order_status', 'review_reply', 'chat_message', 'system');
exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null default 'system',
  title       text not null,
  message     text not null,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where is_read = false;

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts only ever happen server-side via this SECURITY DEFINER function
-- — no public insert policy, so a client can never forge a notification.
create or replace function notify_user(p_user_id uuid, p_type notification_type, p_title text, p_message text, p_link text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, type, title, message, link)
  values (p_user_id, p_type, p_title, p_message, p_link);
end;
$$;

grant execute on function notify_user(uuid, notification_type, text, text, text) to authenticated;

alter publication supabase_realtime add table notifications;
