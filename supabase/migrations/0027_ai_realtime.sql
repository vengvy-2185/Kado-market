-- ============================================================
-- KADO MARKET — Phase 18: enable Realtime for ai_messages
-- ============================================================

do $$ begin
  alter publication supabase_realtime add table ai_messages;
exception when duplicate_object then null; end $$;
