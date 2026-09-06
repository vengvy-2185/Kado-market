-- ============================================================
-- KADO MARKET — Phase 7: storage policies for post-media
-- ============================================================
-- Bucket itself already exists (created in 0006_storage_buckets.sql).
-- Path convention: {store_id}/{filename}

create policy "post_media_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "post_media_bucket_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "post_media_bucket_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
