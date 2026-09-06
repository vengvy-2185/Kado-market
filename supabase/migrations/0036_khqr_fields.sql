-- ============================================================
-- KADO MARKET — Phase 28: KHQR payment info on stores
-- ============================================================
-- Bakong Account ID and phone/account number the seller has registered
-- with their bank for KHQR (National Bank of Cambodia's interoperable QR
-- payment standard). Used to generate a real, scannable KHQR code on
-- checkout/order pages — customers pay via any Cambodian banking app.
--
-- Note: this generates a *valid* KHQR string (verified against Bakong's
-- published tag structure and CRC16 algorithm), but KADO MARKET has no
-- Bakong merchant API integration — payment confirmation is still manual
-- (the seller checks their own banking app and marks the order Paid).

alter table stores add column if not exists bakong_account_id text;
alter table stores add column if not exists bakong_phone text;
