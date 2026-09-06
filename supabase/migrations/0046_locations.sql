-- ============================================================
-- KADO MARKET — Phase 37: real location — store pin + chat location sharing
-- ============================================================

alter table stores add column if not exists latitude numeric(10,7);
alter table stores add column if not exists longitude numeric(10,7);

alter table messages add column if not exists location_lat numeric(10,7);
alter table messages add column if not exists location_lng numeric(10,7);
