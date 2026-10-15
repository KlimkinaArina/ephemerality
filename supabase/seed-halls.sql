-- Залы для расписания. SQL Editor, можно гонять повторно.
-- Поля как в §10: name, address, capacity, seat_map_url.

insert into public.halls (name, address, capacity, seat_map_url)
select v.name, v.address, v.capacity, v.seat_map_url
from (
  values
    ('Большой зал', 'ул. Пример, 1', 200, null::text),
    ('Малый зал', 'ул. Пример, 1', 80, null::text),
    ('Зал-лекторий', 'ул. Пример, 2', 50, null::text)
) as v(name, address, capacity, seat_map_url)
where not exists (
  select 1 from public.halls h where h.name = v.name
);
