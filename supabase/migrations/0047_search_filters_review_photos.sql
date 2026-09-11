-- ============================================================
-- KADO MARKET — Phase 47: review photos + sales tracking for filters/sort
-- ============================================================

-- ------------------------------------------------------------
-- Review photos — customers can attach up to a few real photos of the
-- product they received, alongside their star rating and comment.
-- ------------------------------------------------------------
alter table reviews add column if not exists images text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-images', 'review-images', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- path convention: review-images/{customer_id}/{filename} — the uploader
-- owns the folder, matching the avatars bucket pattern (self-owned, not
-- store-owned, since it's the *customer* uploading here).
create policy "review_images_public_read"
  on storage.objects for select
  using (bucket_id = 'review-images');

create policy "review_images_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "review_images_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- Sales count — cached counter so "best selling" sort doesn't need a
-- live aggregate query across order_items on every home-page request.
-- Incremented when an item is ordered (a reasonable "popularity" signal
-- even before delivery completes) — not decremented on cancellation, to
-- keep this simple; it's a ranking signal, not a financial figure.
-- ------------------------------------------------------------
alter table products add column if not exists sales_count int not null default 0;

create or replace function increment_product_sales_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update products set sales_count = sales_count + new.quantity where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists trg_increment_product_sales_count on order_items;
create trigger trg_increment_product_sales_count
  after insert on order_items
  for each row execute function increment_product_sales_count();

create index if not exists idx_products_sales_count on products(sales_count desc);
create index if not exists idx_products_price on products(price);
