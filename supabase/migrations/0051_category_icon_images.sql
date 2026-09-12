-- ============================================================
-- KADO MARKET — Phase 65: category icon images (not just emoji)
-- ============================================================
-- Answers "should the category icon be an emoji or an image?" — now both
-- work: icon_url takes priority when set, falling back to the emoji in
-- `icon` when it isn't. Font Awesome (or any other icon font) classes
-- won't render here since this project doesn't load Font Awesome — an
-- uploaded image or an emoji are the two supported options.

alter table categories add column if not exists icon_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('category-icons', 'category-icons', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy "category_icons_public_read"
  on storage.objects for select
  using (bucket_id = 'category-icons');

create policy "category_icons_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'category-icons' and is_admin(auth.uid()));

create policy "category_icons_admin_update"
  on storage.objects for update
  using (bucket_id = 'category-icons' and is_admin(auth.uid()));

create policy "category_icons_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'category-icons' and is_admin(auth.uid()));
