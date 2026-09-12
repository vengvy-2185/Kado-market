-- ============================================================
-- KADO MARKET — Phase 68: custom icon for the "All" category tab
-- ============================================================
-- "All" isn't a real row in `categories` (it's a hardcoded UI element),
-- so it couldn't use the per-category icon_url system from Phase 65.
-- Stored on platform_settings instead since it's a platform-wide setting.

alter table platform_settings add column if not exists all_category_icon_url text;
