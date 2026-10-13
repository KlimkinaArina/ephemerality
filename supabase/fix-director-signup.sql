-- Починка роли режиссёра: триггер, check, backfill из Auth metadata.
-- SQL Editor, можно гонять повторно.

alter table public.users drop constraint if exists users_role_check;

update public.users
set role = case
  when role in ('visitor', 'director', 'moderator') then role
  when role in ('author', 'director') then 'director'
  when role in ('admin', 'moderator') then 'moderator'
  else 'visitor'
end
where role is null
   or role not in ('visitor', 'director', 'moderator');

alter table public.users
  alter column role set default 'visitor';

alter table public.users
  alter column role set not null;

alter table public.users
  add constraint users_role_check
  check (role in ('visitor', 'director', 'moderator'));

create or replace function public.users_preserve_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if old.role = 'visitor'
     and new.role = 'director'
     and new.id = auth.uid() then
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;

drop trigger if exists users_preserve_role on public.users;
create trigger users_preserve_role
before update on public.users
for each row execute procedure public.users_preserve_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'visitor'));
  if selected_role not in ('visitor', 'director') then
    selected_role := 'visitor';
  end if;

  insert into public.users (id, email, role, last_platform)
  values (new.id, new.email, selected_role, 'web')
  on conflict (id) do update
    set email = excluded.email,
        role = case
          when public.users.role = 'moderator' then public.users.role
          when public.users.role = 'director' then public.users.role
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

-- Уже зарегистрированные режиссёры, у которых в профиле остался visitor.
update public.users u
set role = 'director',
    updated_at = now()
from auth.users au
where au.id = u.id
  and u.role = 'visitor'
  and coalesce(au.raw_user_meta_data ->> 'role', '') = 'director';
