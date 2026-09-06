-- ============================================================
-- KADO MARKET — Phase 1: Seed data
-- ============================================================

insert into categories (name, slug, sort_order) values
  ('Fashion',        'fashion',        1),
  ('Electronics',     'electronics',    2),
  ('Beauty',          'beauty',         3),
  ('Home',            'home',           4),
  ('Food',            'food',           5),
  ('Sports',          'sports',         6),
  ('Gaming',          'gaming',         7),
  ('Vehicles',        'vehicles',       8),
  ('Books',           'books',          9),
  ('Accessories',     'accessories',   10),
  ('Shoes',           'shoes',         11),
  ('Bags',            'bags',          12),
  ('Jewelry',         'jewelry',       13),
  ('Furniture',       'furniture',     14),
  ('Mobile Phones',   'mobile-phones', 15),
  ('Computers',       'computers',     16),
  ('Cameras',         'cameras',       17),
  ('Other',           'other',         18)
on conflict (slug) do nothing;

insert into subscription_plans
  (name, slug, price_monthly, price_yearly, product_limit, ai_enabled, ai_message_limit,
   analytics_enabled, stories_enabled, boost_enabled, chat_enabled, features, sort_order)
values
  ('Starter', 'starter', 3.00, 30.00, 30, false, 0,
    false, false, false, true,
    '["Store page","Up to 30 products","Basic dashboard","Basic posts"]', 1),
  ('Pro', 'pro', 7.00, 70.00, 200, true, 2000,
    true, true, true, true,
    '["Store page","Up to 200 products","Advanced analytics","Stories","Customer chat","Basic AI Assistant"]', 2),
  ('Business', 'business', 15.00, 150.00, null, true, 5000,
    true, true, true, true,
    '["Unlimited products","Advanced analytics","AI Assistant","Advanced promotion","Priority support"]', 3)
on conflict (slug) do nothing;
