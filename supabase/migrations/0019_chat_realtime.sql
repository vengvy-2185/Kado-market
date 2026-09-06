-- ============================================================
-- KADO MARKET — Phase 11: enable Realtime for live chat messages
-- ============================================================
-- Supabase projects come with a `supabase_realtime` publication; tables must
-- be added to it explicitly to broadcast postgres_changes over Realtime.

do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;
