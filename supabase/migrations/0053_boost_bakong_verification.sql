-- Boost campaigns were activated immediately on click ("Boost now (Demo
-- payment)"), with no check that the platform KHQR shown above the
-- button was ever actually scanned/paid. Bring boosts in line with how
-- orders are verified: create as pending, only flip to active once a
-- real Bakong transaction matching the KHQR's MD5 is confirmed via NBC's
-- Open API.

alter type boost_status add value if not exists 'pending_payment';

alter table boost_campaigns add column if not exists khqr_string text;
alter table boost_campaigns add column if not exists khqr_md5 text;
alter table boost_campaigns add column if not exists bakong_last_checked_at timestamptz;
alter table boost_campaigns add column if not exists bakong_verified_at timestamptz;

-- Reuse the same shared daily-quota counter as order verification; boost
-- checks just leave order_id null.
alter table bakong_api_calls add column if not exists boost_campaign_id uuid references boost_campaigns(id) on delete set null;
