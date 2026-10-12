-- Демо-программа для проверки /program (Иван в названии и у режиссёра).
-- Запускать в SQL Editor после migrate-festival-roles.sql.

insert into public.halls (name, address, capacity)
select v.name, v.address, v.capacity
from (
  values
    ('Зал 1', 'Москва, Малый Козихинский пер., 2', 100),
    ('Зал 2', 'Москва, Малый Козихинский пер., 2', 80)
) as v(name, address, capacity)
where not exists (select 1 from public.halls h where h.name = v.name);

insert into public.authors (name, slug, is_verified)
select 'Иван Петров', 'ivan-petrov-demo', false
where not exists (select 1 from public.authors where slug = 'ivan-petrov-demo');

insert into public.films (
  author_id, title, slug, description, duration_seconds, genre, themes, status, visibility
)
select
  a.id,
  'Иван и бабочка',
  'ivan-i-babochka',
  'Короткометражка о встрече в летнем городе.',
  1200,
  array['драма'],
  array['Россия'],
  'accepted',
  'public'
from public.authors a
where a.slug = 'ivan-petrov-demo'
  and not exists (select 1 from public.films where slug = 'ivan-i-babochka');

insert into public.films (
  author_id, title, slug, description, duration_seconds, genre, themes, status, visibility
)
select
  a.id,
  'Летний ветер',
  'letniy-veter-demo',
  'Фильм режиссёра Ивана Петрова.',
  900,
  array['документальный'],
  array['Россия'],
  'accepted',
  'public'
from public.authors a
where a.slug = 'ivan-petrov-demo'
  and not exists (select 1 from public.films where slug = 'letniy-veter-demo');

update public.festival_info
set
  starts_on = coalesce(starts_on, date '2026-07-10'),
  ends_on = coalesce(ends_on, date '2026-07-12'),
  city = coalesce(city, 'Москва')
where id = 1;

insert into public.sessions (film_id, hall_id, starts_at, ends_at, ticket_price, capacity)
select f.id, h.id, timestamptz '2026-07-10 11:00:00+03', timestamptz '2026-07-10 11:30:00+03', 350, 100
from public.films f
join public.halls h on h.name = 'Зал 1'
where f.slug = 'ivan-i-babochka'
  and not exists (
    select 1 from public.sessions s
    where s.film_id = f.id and s.starts_at = timestamptz '2026-07-10 11:00:00+03'
  );

insert into public.sessions (film_id, hall_id, starts_at, ends_at, ticket_price, capacity)
select f.id, h.id, timestamptz '2026-07-10 14:00:00+03', timestamptz '2026-07-10 14:30:00+03', 350, 80
from public.films f
join public.halls h on h.name = 'Зал 2'
where f.slug = 'letniy-veter-demo'
  and not exists (
    select 1 from public.sessions s
    where s.film_id = f.id and s.starts_at = timestamptz '2026-07-10 14:00:00+03'
  );
