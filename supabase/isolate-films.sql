-- Изоляция фильмов: владелец = films.user_id (auth.uid()).
-- Выполнить в SQL Editor.

alter table public.films
  add column if not exists user_id uuid references auth.users (id) on delete set null;

update public.films f
set user_id = a.user_id
from public.authors a
where a.id = f.author_id
  and f.user_id is null
  and a.user_id is not null;

create index if not exists films_user_id_idx on public.films (user_id);

drop policy if exists films_select_published on public.films;
create policy films_select_published on public.films
for select to anon, authenticated
using (
  (status = 'published' and visibility = 'public')
  or user_id = auth.uid()
  or exists (
    select 1 from public.authors a
    where a.id = films.author_id
      and a.user_id = auth.uid()
  )
  or public.is_staff()
);

drop policy if exists films_insert_own on public.films;
create policy films_insert_own on public.films
for insert to authenticated
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists films_update_own on public.films;
create policy films_update_own on public.films
for update to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists films_delete_own on public.films;
create policy films_delete_own on public.films
for delete to authenticated
using (user_id = auth.uid() or public.is_staff());
