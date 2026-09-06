-- ============================================================
-- KADO MARKET — Phase 25: fix AI subscription visibility for customers
-- ============================================================
-- Bug: ai_subscriptions RLS only allowed the owning seller (or admin) to
-- SELECT any row at all. That's correct for the seller's own dashboard
-- (which needs to see expired/cancelled history too), but it also meant
-- customers could never check "does this store have an active AI
-- assistant?" — so the "Ask AI Assistant" button never appeared for real
-- customers anywhere (store page, product cards), only for the seller
-- viewing their own store.
--
-- Fix: add a second, public policy that lets anyone see a store's *active*
-- subscription rows (which is exactly what powers that UI check). The
-- existing owner/admin policy still applies on top for full history.

create policy "ai_subs_select_active_public"
  on ai_subscriptions for select
  using (status = 'active' and expires_at > now());
