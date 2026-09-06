-- ============================================================
-- KADO MARKET — Phase 36: Reviews & Ratings
-- ============================================================

create table if not exists reviews (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  order_item_id   uuid not null references order_items(id) on delete cascade,
  customer_id     uuid not null references profiles(id) on delete cascade,
  store_id        uuid not null references stores(id) on delete cascade,
  rating          int not null check (rating between 1 and 5),
  comment         text,
  seller_reply    text,
  seller_replied_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_review_per_order_item unique (order_item_id)
);

create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_store on reviews(store_id);

drop trigger if exists trg_reviews_updated_at on reviews;
create trigger trg_reviews_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- Cached aggregate columns on products, kept correct by trigger below
-- (avoids recomputing avg/count from all reviews on every product page view)
alter table products add column if not exists avg_rating numeric(2,1) not null default 0;
alter table products add column if not exists review_count int not null default 0;

create or replace function refresh_product_rating(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products p
    set avg_rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where product_id = p_product_id), 0),
        review_count = (select count(*) from reviews where product_id = p_product_id)
    where p.id = p_product_id;
end;
$$;

create or replace function trg_refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform refresh_product_rating(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_reviews_refresh_rating on reviews;
create trigger trg_reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function trg_refresh_product_rating();

-- ------------------------------------------------------------
-- Only the customer who actually bought (order_item) a delivered order,
-- and hasn't reviewed that line item yet, can leave a review — enforced
-- here, not just trusted client-side.
-- ------------------------------------------------------------
create or replace function can_review_order_item(p_order_item_id uuid, p_customer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    where oi.id = p_order_item_id
      and o.customer_id = p_customer_id
      and o.status = 'delivered'
  ) and not exists (
    select 1 from reviews where order_item_id = p_order_item_id
  );
$$;

grant execute on function can_review_order_item(uuid, uuid) to authenticated;

alter table reviews enable row level security;

create policy "reviews_select_all" on reviews for select using (true);

create policy "reviews_insert_verified_purchase"
  on reviews for insert
  with check (customer_id = auth.uid() and can_review_order_item(order_item_id, auth.uid()));

create policy "reviews_update_own_comment"
  on reviews for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid() and seller_reply is null); -- editing own review can't also fake a seller reply

create policy "reviews_update_seller_reply"
  on reviews for update
  using (owns_store(auth.uid(), store_id))
  with check (owns_store(auth.uid(), store_id));

create policy "reviews_delete_own_or_admin"
  on reviews for delete
  using (customer_id = auth.uid() or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Defense in depth: RLS policies above allow either the reviewing
-- customer OR the store owner to run an UPDATE, but a raw UPDATE call
-- doesn't know "which columns should this role be allowed to touch." This
-- trigger enforces that explicitly — a seller (or anyone who isn't the
-- original reviewer) can only ever change seller_reply/seller_replied_at,
-- never the rating, comment, or who it's attributed to.
-- ------------------------------------------------------------
create or replace function enforce_review_update_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is distinct from old.customer_id then
    if new.rating is distinct from old.rating
      or new.comment is distinct from old.comment
      or new.customer_id is distinct from old.customer_id
      or new.order_item_id is distinct from old.order_item_id
      or new.product_id is distinct from old.product_id
      or new.store_id is distinct from old.store_id
    then
      raise exception 'Only the reviewer can change the review itself.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_review_update_columns on reviews;
create trigger trg_enforce_review_update_columns
  before update on reviews
  for each row execute function enforce_review_update_columns();
