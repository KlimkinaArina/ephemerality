-- Bucket постеров для заявок режиссёра. SQL Editor, после migrate-festival-roles.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posters',
  'posters',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists posters_select_public on storage.objects;
create policy posters_select_public on storage.objects
for select to anon, authenticated
using (bucket_id = 'posters');

drop policy if exists posters_insert_own on storage.objects;
create policy posters_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'posters'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists posters_update_own on storage.objects;
create policy posters_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'posters'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'posters'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists posters_delete_own on storage.objects;
create policy posters_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'posters'
  and split_part(name, '/', 1) = auth.uid()::text
);
