-- ============================================================
-- KADO MARKET — Phase 54: real Bakong Open API auto-verification
-- ============================================================
-- The KHQR string includes a timestamp tag, so it's different every time
-- it's generated — meaning the MD5 hash used to check payment status must
-- be captured from the *exact* QR the customer actually scanned, not
-- recomputed later. We persist both on the order at creation time.

alter table orders add column if not exists khqr_string text;
alter table orders add column if not exists khqr_md5 text;
alter table orders add column if not exists bakong_verified_at timestamptz;

-- Platform-level Bakong Open API credentials (one KADO MARKET
-- integration checks transactions for all stores' KHQR codes — the
-- Bakong API just confirms "did money move matching this hash," it
-- doesn't care which of our sellers' accounts received it).
alter table platform_settings add column if not exists bakong_developer_token text;
alter table platform_settings add column if not exists bakong_use_sandbox boolean not null default true;
