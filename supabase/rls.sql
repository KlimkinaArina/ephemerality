-- RLS по product_book.md §10 + веб-правила §6.5.
-- Вставить в Supabase SQL Editor после schema.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role in ('moderator', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on table
  public.authors,
  public.films,
  public.collections,
  public.collection_films
to anon, authenticated;

grant insert on table
  public.film_views,
  public.shares,
  public.analytics_events
to anon, authenticated;

grant select, insert, update, delete on table
  public.users,
  public.authors,
  public.films,
  public.collections,
  public.collection_films,
  public.film_views,
  public.ratings,
  public.favorites,
  public.author_follows,
  public.shares
to authenticated;

grant select on table
  public.recommendations,
  public.subscriptions,
  public.notifications
to authenticated;

-- ---------------------------------------------------------------------------
-- enable RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.authors enable row level security;
alter table public.films enable row level security;
alter table public.collections enable row level security;
alter table public.collection_films enable row level security;
alter table public.film_views enable row level security;
alter table public.ratings enable row level security;
alter table public.favorites enable row level security;
alter table public.author_follows enable row level security;
alter table public.recommendations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.shares enable row level security;
alter table public.analytics_events enable row level security;
alter table public.ai_requests enable row level security;

-- ---------------------------------------------------------------------------
-- users: только свои данные
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- authors: public read; write автору
-- ---------------------------------------------------------------------------
drop policy if exists authors_select_public on public.authors;
create policy authors_select_public on public.authors
for select to anon, authenticated
using (true);

drop policy if exists authors_insert_own on public.authors;
create policy authors_insert_own on public.authors
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists authors_update_own on public.authors;
create policy authors_update_own on public.authors
for update to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists authors_delete_own on public.authors;
create policy authors_delete_own on public.authors
for delete to authenticated
using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- films: public read published/public; drafts — автору
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- collections: public read published; write curator / staff
-- ---------------------------------------------------------------------------
drop policy if exists collections_select_published on public.collections;
create policy collections_select_published on public.collections
for select to anon, authenticated
using (
  (status = 'published' and visibility = 'public')
  or curator_user_id = auth.uid()
  or public.is_staff()
);

drop policy if exists collections_insert_own on public.collections;
create policy collections_insert_own on public.collections
for insert to authenticated
with check (curator_user_id = auth.uid() or public.is_staff());

drop policy if exists collections_update_own on public.collections;
create policy collections_update_own on public.collections
for update to authenticated
using (curator_user_id = auth.uid() or public.is_staff())
with check (curator_user_id = auth.uid() or public.is_staff());

drop policy if exists collections_delete_own on public.collections;
create policy collections_delete_own on public.collections
for delete to authenticated
using (curator_user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- collection_films
-- ---------------------------------------------------------------------------
drop policy if exists collection_films_select_published on public.collection_films;
create policy collection_films_select_published on public.collection_films
for select to anon, authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and (
        (c.status = 'published' and c.visibility = 'public')
        or c.curator_user_id = auth.uid()
        or public.is_staff()
      )
  )
);

drop policy if exists collection_films_insert_own on public.collection_films;
create policy collection_films_insert_own on public.collection_films
for insert to authenticated
with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and (c.curator_user_id = auth.uid() or public.is_staff())
  )
);

drop policy if exists collection_films_update_own on public.collection_films;
create policy collection_films_update_own on public.collection_films
for update to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and (c.curator_user_id = auth.uid() or public.is_staff())
  )
);

drop policy if exists collection_films_delete_own on public.collection_films;
create policy collection_films_delete_own on public.collection_films
for delete to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and (c.curator_user_id = auth.uid() or public.is_staff())
  )
);

-- ---------------------------------------------------------------------------
-- film_views: self (гость — user_id is null)
-- ---------------------------------------------------------------------------
drop policy if exists film_views_select_own on public.film_views;
create policy film_views_select_own on public.film_views
for select to authenticated
using (user_id = auth.uid());

drop policy if exists film_views_insert_guest on public.film_views;
create policy film_views_insert_guest on public.film_views
for insert to anon
with check (user_id is null);

drop policy if exists film_views_insert_own on public.film_views;
create policy film_views_insert_own on public.film_views
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists film_views_update_own on public.film_views;
create policy film_views_update_own on public.film_views
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists film_views_delete_own on public.film_views;
create policy film_views_delete_own on public.film_views
for delete to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ratings / favorites / author_follows: owner write/read
-- ---------------------------------------------------------------------------
drop policy if exists ratings_select_own on public.ratings;
create policy ratings_select_own on public.ratings
for select to authenticated
using (user_id = auth.uid());

drop policy if exists ratings_insert_own on public.ratings;
create policy ratings_insert_own on public.ratings
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists ratings_update_own on public.ratings;
create policy ratings_update_own on public.ratings
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists ratings_delete_own on public.ratings;
create policy ratings_delete_own on public.ratings
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
for select to authenticated
using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists favorites_update_own on public.favorites;
create policy favorites_update_own on public.favorites
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists author_follows_select_own on public.author_follows;
create policy author_follows_select_own on public.author_follows
for select to authenticated
using (user_id = auth.uid());

drop policy if exists author_follows_insert_own on public.author_follows;
create policy author_follows_insert_own on public.author_follows
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists author_follows_update_own on public.author_follows;
create policy author_follows_update_own on public.author_follows
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists author_follows_delete_own on public.author_follows;
create policy author_follows_delete_own on public.author_follows
for delete to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- recommendations / subscriptions / notifications: user reads own
-- ---------------------------------------------------------------------------
drop policy if exists recommendations_select_own on public.recommendations;
create policy recommendations_select_own on public.recommendations
for select to authenticated
using (user_id = auth.uid());

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
for select to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- shares: client insert
-- ---------------------------------------------------------------------------
drop policy if exists shares_select_own on public.shares;
create policy shares_select_own on public.shares
for select to authenticated
using (user_id = auth.uid());

drop policy if exists shares_insert_guest on public.shares;
create policy shares_insert_guest on public.shares
for insert to anon
with check (user_id is null);

drop policy if exists shares_insert_own on public.shares;
create policy shares_insert_own on public.shares
for insert to authenticated
with check (user_id = auth.uid() or user_id is null);

-- ---------------------------------------------------------------------------
-- analytics_events: client insert
-- ---------------------------------------------------------------------------
drop policy if exists analytics_events_insert_guest on public.analytics_events;
create policy analytics_events_insert_guest on public.analytics_events
for insert to anon
with check (user_id is null);

drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events
for insert to authenticated
with check (user_id is null or user_id = auth.uid());

-- ai_requests: service role only (no client policies)

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
