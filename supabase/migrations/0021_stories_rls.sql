-- ============================================================
-- KADO MARKET — Phase 13: RLS for stories + story-media storage
-- ============================================================

alter table stories enable row level security;

-- Public sees only non-expired stories from active stores; the owning
-- seller (and admin) can also see their own expired ones for management.
create policy "stories_select_public_or_owner_or_admin"
  on stories for select
  using (
    (
      expires_at > now()
      and exists (select 1 from stores s where s.id = store_id and s.status = 'active')
    )
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

create policy "stories_insert_owner"
  on stories for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "stories_delete_owner_or_admin"
  on stories for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- STORY MEDIA BUCKET — path: {store_id}/{filename} (bucket created in 0006)
-- ------------------------------------------------------------
create policy "story_media_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'story-media');

create policy "story_media_bucket_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'story-media'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

create policy "story_media_bucket_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'story-media'
    and owns_store(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
