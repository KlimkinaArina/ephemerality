-- Исправление: авторы/подборки ссылаются на auth.users (auth.uid()),
-- плюс профили для уже зарегистрированных пользователей.

insert into public.users (id, email)
select id, email
from auth.users
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

alter table public.authors drop constraint if exists authors_user_id_fkey;
alter table public.authors
  add constraint authors_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

alter table public.collections drop constraint if exists collections_curator_user_id_fkey;
alter table public.collections
  add constraint collections_curator_user_id_fkey
  foreign key (curator_user_id) references auth.users (id) on delete set null;
