-- ============================================================
-- KADO MARKET — Phase 7: RLS for posts, likes, comments
-- ============================================================

alter table posts      enable row level security;
alter table post_media enable row level security;
alter table likes      enable row level security;
alter table comments   enable row level security;

-- ------------------------------------------------------------
-- POSTS — public read (from active stores), owner/admin write
-- ------------------------------------------------------------
create policy "posts_select_public_or_owner_or_admin"
  on posts for select
  using (
    exists (select 1 from stores s where s.id = store_id and s.status = 'active')
    or owns_store(auth.uid(), store_id)
    or is_admin(auth.uid())
  );

create policy "posts_insert_owner"
  on posts for insert
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "posts_update_owner_or_admin"
  on posts for update
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()))
  with check (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

create policy "posts_delete_owner_or_admin"
  on posts for delete
  using (owns_store(auth.uid(), store_id) or is_admin(auth.uid()));

-- ------------------------------------------------------------
-- POST MEDIA
-- ------------------------------------------------------------
create policy "post_media_select_public_or_owner_or_admin"
  on post_media for select
  using (
    exists (
      select 1 from posts p join stores s on s.id = p.store_id
      where p.id = post_id and (s.status = 'active' or owns_store(auth.uid(), s.id) or is_admin(auth.uid()))
    )
  );

create policy "post_media_write_owner_or_admin"
  on post_media for insert
  with check (
    exists (select 1 from posts p where p.id = post_id and (owns_store(auth.uid(), p.store_id) or is_admin(auth.uid())))
  );

create policy "post_media_delete_owner_or_admin"
  on post_media for delete
  using (
    exists (select 1 from posts p where p.id = post_id and (owns_store(auth.uid(), p.store_id) or is_admin(auth.uid())))
  );

-- ------------------------------------------------------------
-- LIKES — any authenticated user can like/unlike; likes are public to view
-- ------------------------------------------------------------
create policy "likes_select_all"
  on likes for select
  using (true);

create policy "likes_insert_own"
  on likes for insert
  with check (user_id = auth.uid());

create policy "likes_delete_own"
  on likes for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- COMMENTS — any authenticated user can comment; only the author (or store
-- owner/admin, for moderation) can delete
-- ------------------------------------------------------------
create policy "comments_select_all"
  on comments for select
  using (true);

create policy "comments_insert_own"
  on comments for insert
  with check (user_id = auth.uid());

create policy "comments_delete_own_or_store_owner_or_admin"
  on comments for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from posts p where p.id = post_id and owns_store(auth.uid(), p.store_id))
    or is_admin(auth.uid())
  );
