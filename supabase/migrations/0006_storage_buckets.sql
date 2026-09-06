-- ============================================================
-- KADO MARKET — Phase 2: Storage buckets
-- ============================================================
-- Upload path convention (enforced by policy, not just by convention):
--   avatars/{user_id}/...
--   store-logos/{store_id}/...
--   store-covers/{store_id}/...
--   product-images/{store_id}/{product_id}/...
--
-- post-media, story-media, chat-attachments, and ai-documents buckets are
-- created here (empty, no policies yet) so later phases only need to add
-- policies, not re-create the buckets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',         'avatars',         true,  5242880,  array['image/png','image/jpeg','image/webp']),
  ('store-logos',     'store-logos',     true,  5242880,  array['image/png','image/jpeg','image/webp']),
  ('store-covers',    'store-covers',    true,  10485760, array['image/png','image/jpeg','image/webp']),
  ('product-images',  'product-images',  true,  10485760, array['image/png','image/jpeg','image/webp']),
  ('post-media',      'post-media',      true,  20971520, null),
  ('story-media',     'story-media',     true,  20971520, null),
  ('chat-attachments','chat-attachments',false, 20971520, null),
  ('ai-documents',    'ai-documents',    false, 20971520, null)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- AVATARS — path: {user_id}/filename
-- ------------------------------------------------------------
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- STORE LOGOS — path: {store_id}/filename
-- ------------------------------------------------------------
create policy "store_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'store-logos');

create policy "store_logos_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'store-logos'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "store_logos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'store-logos'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "store_logos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'store-logos'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- ------------------------------------------------------------
-- STORE COVERS — path: {store_id}/filename
-- ------------------------------------------------------------
create policy "store_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'store-covers');

create policy "store_covers_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'store-covers'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "store_covers_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'store-covers'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "store_covers_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'store-covers'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- ------------------------------------------------------------
-- PRODUCT IMAGES — path: {store_id}/{product_id}/filename
-- ------------------------------------------------------------
create policy "product_images_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_bucket_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "product_images_bucket_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "product_images_bucket_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
