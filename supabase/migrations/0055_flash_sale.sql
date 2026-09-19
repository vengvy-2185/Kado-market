-- Lets a seller put a discount on a countdown ("Flash Sale ends in...")
-- instead of it just being an indefinite compare_at_price markdown.
-- Null means no countdown -- the existing discount display is unaffected.
alter table products add column if not exists sale_ends_at timestamptz;
