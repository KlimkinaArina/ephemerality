-- Постеры: bucket public + постоянные public URL в films.thumbnail_url.
-- SQL Editor, можно гонять повторно.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posters',
  'posters',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true;

update public.films
set thumbnail_url = regexp_replace(
  split_part(thumbnail_url, '?', 1),
  '/object/sign/',
  '/object/public/'
)
where thumbnail_url like '%/storage/v1/object/sign/%';

update public.films
set share_image_url = regexp_replace(
  split_part(share_image_url, '?', 1),
  '/object/sign/',
  '/object/public/'
)
where share_image_url like '%/storage/v1/object/sign/%';
