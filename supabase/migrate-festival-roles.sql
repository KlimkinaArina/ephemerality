-- «Эфемерность» — миграция ролей / заявок / сеансов / билетов.
-- Один скрипт для Supabase SQL Editor (идемпотентный).

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- helper
-- ---------------------------------------------------------------------------
create or replace function public.user_is_moderator()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'moderator'
  );
$$;

grant execute on function public.user_is_moderator() to anon, authenticated;

create or replace function public.users_preserve_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') is distinct from 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. users.role
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists role text;

alter table public.users
  alter column role set default 'visitor';

alter table public.users drop constraint if exists users_role_check;

update public.users
set role = case
  when role in ('visitor', 'director', 'moderator') then role
  when role = 'author' then 'director'
  when role in ('admin', 'moderator') then 'moderator'
  else 'visitor'
end
where role is null
   or role not in ('visitor', 'director', 'moderator');

alter table public.users
  alter column role set not null;

alter table public.users
  add constraint users_role_check
  check (role in ('visitor', 'director', 'moderator'));

drop trigger if exists users_preserve_role on public.users;
create trigger users_preserve_role
before update on public.users
for each row execute procedure public.users_preserve_role();

-- ---------------------------------------------------------------------------
-- 2. festival_info (одна строка)
-- ---------------------------------------------------------------------------
create table if not exists public.festival_info (
  id integer primary key default 1 check (id = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null default 'Эфемерность',
  starts_on date,
  ends_on date,
  city text,
  address text,
  description text,
  hero_image text
);

drop trigger if exists festival_info_set_updated_at on public.festival_info;
create trigger festival_info_set_updated_at
before update on public.festival_info
for each row execute procedure public.set_updated_at();

insert into public.festival_info (id, name, city, description)
values (
  1,
  'Эфемерность',
  'Москва',
  'Фестиваль короткометражного кино.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. halls
-- ---------------------------------------------------------------------------
create table if not exists public.halls (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  address text,
  capacity integer not null default 0 check (capacity >= 0),
  seat_map_url text
);

drop trigger if exists halls_set_updated_at on public.halls;
create trigger halls_set_updated_at
before update on public.halls
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. films — существующая таблица, только недостающие поля
-- ---------------------------------------------------------------------------
alter table public.films
  add column if not exists director_id uuid references public.users (id) on delete set null;

alter table public.films
  add column if not exists reviewer_id uuid references public.users (id) on delete set null;

alter table public.films
  add column if not exists review_notes text;

alter table public.films
  add column if not exists submitted_at timestamptz;

alter table public.films
  add column if not exists reviewed_at timestamptz;

alter table public.films drop constraint if exists films_status_check;

update public.films
set director_id = coalesce(
  director_id,
  user_id,
  (select a.user_id from public.authors a where a.id = films.author_id)
)
where director_id is null;

update public.films
set status = case
  when status in ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted') then status
  when status = 'published' then 'accepted'
  when status = 'archived' then 'rejected'
  else 'draft'
end;

alter table public.films
  alter column status set default 'draft';

alter table public.films
  add constraint films_status_check
  check (status in (
    'draft',
    'submitted',
    'under_review',
    'accepted',
    'rejected',
    'waitlisted'
  ));

-- ---------------------------------------------------------------------------
-- 5. sessions
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  film_id uuid not null references public.films (id) on delete cascade,
  hall_id uuid not null references public.halls (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  ticket_price numeric(10, 2) not null default 0 check (ticket_price >= 0),
  capacity integer not null check (capacity >= 0),
  check (ends_at > starts_at)
);

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. tickets
-- ---------------------------------------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  seat_row text,
  seat_number text,
  status text not null default 'reserved'
    check (status in ('reserved', 'confirmed', 'cancelled', 'used')),
  unique (session_id, seat_row, seat_number)
);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. индексы
-- ---------------------------------------------------------------------------
create index if not exists films_status_idx on public.films (status);
create index if not exists films_director_id_idx on public.films (director_id);
create index if not exists sessions_starts_at_idx on public.sessions (starts_at);
create index if not exists sessions_film_id_idx on public.sessions (film_id);
create index if not exists tickets_session_id_idx on public.tickets (session_id);
create index if not exists tickets_user_id_idx on public.tickets (user_id);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
grant select on table public.festival_info, public.halls, public.sessions to anon, authenticated;
grant insert, update, delete on table public.festival_info, public.halls, public.sessions to authenticated;

grant select, insert on table public.tickets to anon, authenticated;
grant update, delete on table public.tickets to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.films enable row level security;
alter table public.festival_info enable row level security;
alter table public.halls enable row level security;
alter table public.sessions enable row level security;
alter table public.tickets enable row level security;

-- users
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select to authenticated
using (id = auth.uid());

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
for insert to authenticated
with check (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists users_delete_own on public.users;
create policy users_delete_own on public.users
for delete to authenticated
using (id = auth.uid());

-- films
drop policy if exists films_select_published on public.films;
drop policy if exists films_select_access on public.films;
create policy films_select_access on public.films
for select to anon, authenticated
using (
  status = 'accepted'
  or director_id = auth.uid()
  or public.user_is_moderator()
);

drop policy if exists films_insert_own on public.films;
create policy films_insert_own on public.films
for insert to authenticated
with check (
  public.user_is_moderator()
  or (
    director_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'director'
    )
  )
);

drop policy if exists films_update_own on public.films;
create policy films_update_own on public.films
for update to authenticated
using (
  public.user_is_moderator()
  or (director_id = auth.uid() and status in ('draft', 'submitted'))
)
with check (
  public.user_is_moderator()
  or (director_id = auth.uid() and status in ('draft', 'submitted'))
);

drop policy if exists films_delete_own on public.films;
create policy films_delete_own on public.films
for delete to authenticated
using (
  public.user_is_moderator()
  or (director_id = auth.uid() and status = 'draft')
);

-- festival_info, halls, sessions: public read, write moderator
drop policy if exists festival_info_select_public on public.festival_info;
create policy festival_info_select_public on public.festival_info
for select to anon, authenticated
using (true);

drop policy if exists festival_info_write_moderator on public.festival_info;
create policy festival_info_write_moderator on public.festival_info
for all to authenticated
using (public.user_is_moderator())
with check (public.user_is_moderator());

drop policy if exists halls_select_public on public.halls;
create policy halls_select_public on public.halls
for select to anon, authenticated
using (true);

drop policy if exists halls_write_moderator on public.halls;
create policy halls_write_moderator on public.halls
for all to authenticated
using (public.user_is_moderator())
with check (public.user_is_moderator());

drop policy if exists sessions_select_public on public.sessions;
create policy sessions_select_public on public.sessions
for select to anon, authenticated
using (true);

drop policy if exists sessions_write_moderator on public.sessions;
create policy sessions_write_moderator on public.sessions
for all to authenticated
using (public.user_is_moderator())
with check (public.user_is_moderator());

-- tickets
drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own on public.tickets
for select to anon, authenticated
using (user_id = auth.uid());

drop policy if exists tickets_insert_capacity on public.tickets;
create policy tickets_insert_capacity on public.tickets
for insert to anon, authenticated
with check (
  (user_id is null or user_id = auth.uid())
  and (
    select count(*)::integer
    from public.tickets t
    where t.session_id = tickets.session_id
      and t.status is distinct from 'cancelled'
  ) < (
    select s.capacity
    from public.sessions s
    where s.id = tickets.session_id
  )
);

drop policy if exists tickets_update_moderator on public.tickets;
create policy tickets_update_moderator on public.tickets
for update to authenticated
using (public.user_is_moderator())
with check (public.user_is_moderator());

drop policy if exists tickets_delete_moderator on public.tickets;
create policy tickets_delete_moderator on public.tickets
for delete to authenticated
using (public.user_is_moderator());

-- ---------------------------------------------------------------------------
-- 4. модератор
-- ---------------------------------------------------------------------------
insert into public.users (id, email, role, last_platform)
select au.id, au.email, 'moderator', 'web'
from auth.users au
where lower(au.email) = lower('dima-pulemetchick@yandex.ru')
on conflict (id) do update
set
  email = excluded.email,
  role = 'moderator',
  updated_at = now();

update public.users
set role = 'moderator'
where lower(email) = lower('dima-pulemetchick@yandex.ru');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', 'visitor');
  if selected_role not in ('visitor', 'director') then
    selected_role := 'visitor';
  end if;

  insert into public.users (id, email, role)
  values (new.id, new.email, selected_role)
  on conflict (id) do update
    set email = excluded.email,
        role = case
          when public.users.role = 'moderator' then public.users.role
          else excluded.role
        end,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
