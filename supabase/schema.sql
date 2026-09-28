-- «Эфемерность» — схема public по product_book.md §10 (+ share_image_url из §6.5).
-- Вставить целиком в Supabase SQL Editor. RLS не включается.

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
-- users  (профиль; 1:1 с auth.users — при создании из Auth подставляйте id)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key default uuid_generate_v4()
    references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text unique,
  telegram_id text unique,
  oauth_provider text,
  name text,
  avatar_url text,
  role text not null default 'viewer'
    check (role in ('viewer', 'author', 'moderator', 'admin')),
  platform_origin text
    check (platform_origin is null or platform_origin in ('web', 'ios', 'android', 'telegram')),
  last_platform text
    check (last_platform is null or last_platform in ('web', 'ios', 'android', 'telegram')),
  preferences jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false
);

create trigger users_set_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- authors
-- ---------------------------------------------------------------------------
create table public.authors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  name text not null,
  slug text not null unique,
  bio text,
  avatar_url text,
  website_url text,
  is_verified boolean not null default false
);

create index authors_user_id_idx on public.authors (user_id);

create trigger authors_set_updated_at
before update on public.authors
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- films
-- ---------------------------------------------------------------------------
create table public.films (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid not null references public.authors (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  duration_seconds integer not null check (duration_seconds > 0),
  genre text[] not null default '{}',
  themes text[] not null default '{}',
  moods text[] not null default '{}',
  video_url text,
  thumbnail_url text,
  trailer_url text,
  share_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private')),
  release_date date,
  views_count integer not null default 0 check (views_count >= 0),
  rating_avg numeric(3, 2) not null default 0
    check (rating_avg >= 0 and rating_avg <= 5),
  rating_count integer not null default 0 check (rating_count >= 0)
);

create index films_author_id_idx on public.films (author_id);
create index films_user_id_idx on public.films (user_id);
create index films_status_visibility_idx on public.films (status, visibility);

create trigger films_set_updated_at
before update on public.films
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text not null unique,
  description text,
  curator_user_id uuid references public.users (id) on delete set null,
  curator_name text,
  cover_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private'))
);

create index collections_curator_user_id_idx on public.collections (curator_user_id);

create trigger collections_set_updated_at
before update on public.collections
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- collection_films  (N:M collections ↔ films)
-- ---------------------------------------------------------------------------
create table public.collection_films (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  film_id uuid not null references public.films (id) on delete cascade,
  position integer not null default 0,
  unique (collection_id, film_id)
);

create index collection_films_collection_id_idx on public.collection_films (collection_id);
create index collection_films_film_id_idx on public.collection_films (film_id);

create trigger collection_films_set_updated_at
before update on public.collection_films
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- film_views
-- ---------------------------------------------------------------------------
create table public.film_views (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  film_id uuid not null references public.films (id) on delete cascade,
  session_id text,
  platform text
    check (platform is null or platform in ('web', 'ios', 'android', 'telegram')),
  started_at timestamptz not null default now(),
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  completed boolean not null default false
);

create index film_views_user_id_idx on public.film_views (user_id);
create index film_views_film_id_idx on public.film_views (film_id);
create index film_views_session_id_idx on public.film_views (session_id);

create trigger film_views_set_updated_at
before update on public.film_views
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ratings  (1–5)
-- ---------------------------------------------------------------------------
create table public.ratings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  film_id uuid not null references public.films (id) on delete cascade,
  value smallint not null check (value between 1 and 5),
  unique (user_id, film_id)
);

create index ratings_user_id_idx on public.ratings (user_id);
create index ratings_film_id_idx on public.ratings (film_id);

create trigger ratings_set_updated_at
before update on public.ratings
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  film_id uuid not null references public.films (id) on delete cascade,
  unique (user_id, film_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_film_id_idx on public.favorites (film_id);

create trigger favorites_set_updated_at
before update on public.favorites
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- author_follows
-- ---------------------------------------------------------------------------
create table public.author_follows (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  author_id uuid not null references public.authors (id) on delete cascade,
  unique (user_id, author_id)
);

create index author_follows_user_id_idx on public.author_follows (user_id);
create index author_follows_author_id_idx on public.author_follows (author_id);

create trigger author_follows_set_updated_at
before update on public.author_follows
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- recommendations
-- ---------------------------------------------------------------------------
create table public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  film_id uuid not null references public.films (id) on delete cascade,
  source text not null default 'rule'
    check (source in ('rule', 'ai', 'editorial', 'time_budget')),
  score numeric(6, 4) not null default 0,
  reason text
);

create index recommendations_user_id_idx on public.recommendations (user_id);
create index recommendations_film_id_idx on public.recommendations (film_id);

create trigger recommendations_set_updated_at
before update on public.recommendations
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan text not null default 'free'
    check (plan in ('free', 'supporter', 'festival_pass')),
  status text not null default 'inactive'
    check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  provider text,
  provider_subscription_id text,
  current_period_end timestamptz
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.users (id) on delete cascade,
  film_id uuid references public.films (id) on delete set null,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  data jsonb not null default '{}'::jsonb
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_film_id_idx on public.notifications (film_id);

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shares
-- ---------------------------------------------------------------------------
create table public.shares (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  film_id uuid not null references public.films (id) on delete cascade,
  target text not null
    check (target in ('copy', 'telegram', 'vk', 'facebook', 'other')),
  platform text
    check (platform is null or platform in ('web', 'ios', 'android', 'telegram'))
);

create index shares_user_id_idx on public.shares (user_id);
create index shares_film_id_idx on public.shares (film_id);

create trigger shares_set_updated_at
before update on public.shares
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  session_id text,
  name text not null,
  platform text
    check (platform is null or platform in ('web', 'ios', 'android', 'telegram')),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index analytics_events_user_id_idx on public.analytics_events (user_id);
create index analytics_events_name_idx on public.analytics_events (name);

create trigger analytics_events_set_updated_at
before update on public.analytics_events
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_requests
-- ---------------------------------------------------------------------------
create table public.ai_requests (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.users (id) on delete set null,
  model text,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  status text not null default 'ok'
    check (status in ('ok', 'error', 'skipped')),
  metadata jsonb not null default '{}'::jsonb
);

create index ai_requests_user_id_idx on public.ai_requests (user_id);

create trigger ai_requests_set_updated_at
before update on public.ai_requests
for each row execute procedure public.set_updated_at();
