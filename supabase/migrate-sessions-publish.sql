-- Публикация расписания. SQL Editor, после migrate-festival-roles.sql.

alter table public.sessions
  add column if not exists is_published boolean not null default false;

drop policy if exists sessions_select_public on public.sessions;
create policy sessions_select_public on public.sessions
for select to anon, authenticated
using (is_published = true or public.user_is_moderator());
