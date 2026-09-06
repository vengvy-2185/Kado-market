-- ============================================================
-- KADO MARKET — Phase 36: low stock alerts
-- ============================================================

alter table products add column if not exists low_stock_threshold int not null default 5;
-- tracks whether we've already alerted for the current low-stock episode,
-- so restocking-then-dropping-again re-alerts, but repeated small orders
-- while already low don't spam the seller every single time
alter table products add column if not exists low_stock_alerted boolean not null default false;
