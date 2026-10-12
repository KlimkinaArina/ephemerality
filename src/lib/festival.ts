export const SESSION_SELECT =
  "id, starts_at, ends_at, ticket_price, capacity, film_id, hall_id, films(id, title, slug, description, duration_seconds, genre, themes, thumbnail_url, share_image_url, release_date, authors(name)), halls(id, name, address, capacity)" as const;

export const SEAT_ROWS = 10;
export const SEAT_COLS = 10;
export const SLOT_MINUTES = 30;

export type FestivalInfo = {
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  city: string | null;
  address: string | null;
};

export type FestivalFilm = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_seconds: number;
  genre: string[];
  themes: string[];
  thumbnail_url: string | null;
  share_image_url: string | null;
  release_date: string | null;
  director: string;
};

export type FestivalHall = {
  id: string;
  name: string;
  address: string | null;
  capacity: number;
};

export type FestivalSession = {
  id: string;
  starts_at: string;
  ends_at: string;
  ticket_price: number;
  capacity: number;
  film_id: string;
  hall_id: string;
  film: FestivalFilm;
  hall: FestivalHall;
};

type AuthorEmbed =
  | { name: string }
  | { name: string }[]
  | null;

type FilmEmbed = {
  id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  duration_seconds: number;
  genre: string[] | null;
  themes: string[] | null;
  thumbnail_url: string | null;
  share_image_url: string | null;
  release_date: string | null;
  authors: AuthorEmbed;
};

type HallEmbed = {
  id: string;
  name: string;
  address: string | null;
  capacity: number;
};

export function embedOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function dateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

export function festivalDayKeys(startsOn: string | null | undefined) {
  const start = startsOn ?? dateKey(new Date());
  return [0, 1, 2].map((offset) => {
    const date = addDays(start, offset);
    return {
      key: dateKey(date),
      label: `Д${offset + 1}`,
      dateLabel: date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      }),
    };
  });
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function formatPrice(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function authorName(authors: AuthorEmbed) {
  const row = embedOne(authors);
  return row?.name?.trim() || "Режиссёр неизвестен";
}

export function mapFestivalFilm(row: FilmEmbed): FestivalFilm {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? row.id,
    description: row.description,
    duration_seconds: row.duration_seconds,
    genre: row.genre ?? [],
    themes: row.themes ?? [],
    thumbnail_url: row.thumbnail_url,
    share_image_url: row.share_image_url,
    release_date: row.release_date,
    director: authorName(row.authors),
  };
}

export function mapFestivalSession(row: {
  id: string;
  starts_at: string;
  ends_at: string;
  ticket_price: number | string;
  capacity: number;
  film_id: string;
  hall_id: string;
  films: FilmEmbed | FilmEmbed[] | null;
  halls: HallEmbed | HallEmbed[] | null;
}): FestivalSession | null {
  const film = embedOne(row.films);
  const hall = embedOne(row.halls);
  if (!film || !hall) return null;
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    ticket_price: Number(row.ticket_price),
    capacity: row.capacity,
    film_id: row.film_id,
    hall_id: row.hall_id,
    film: mapFestivalFilm(film),
    hall,
  };
}

export function sessionSearchHaystack(session: FestivalSession) {
  const film = session.film;
  return [
    film.title,
    film.director,
    film.genre.join(" "),
    film.themes.join(" "),
  ]
    .join(" ")
    .toLocaleLowerCase("ru");
}

export function matchesQuery(session: FestivalSession, query: string) {
  const needle = query.trim().toLocaleLowerCase("ru");
  if (!needle) return true;
  return sessionSearchHaystack(session).includes(needle);
}

export function dayStartMs(dayKey: string, sessions: FestivalSession[]) {
  const ofDay = sessions.filter(
    (session) => dateKey(new Date(session.starts_at)) === dayKey
  );
  const ten = new Date(`${dayKey}T10:00:00`).getTime();
  const earliest = ofDay.reduce((min, session) => {
    const t = new Date(session.starts_at).getTime();
    return Math.min(min, t);
  }, ten);
  const slot = SLOT_MINUTES * 60 * 1000;
  return Math.floor(earliest / slot) * slot;
}

export function dayEndMs(dayKey: string, sessions: FestivalSession[]) {
  const ofDay = sessions.filter(
    (session) => dateKey(new Date(session.starts_at)) === dayKey
  );
  const twentyTwo = new Date(`${dayKey}T22:00:00`).getTime();
  const latest = ofDay.reduce((max, session) => {
    const t = new Date(session.ends_at).getTime();
    return Math.max(max, t);
  }, twentyTwo);
  const slot = SLOT_MINUTES * 60 * 1000;
  return Math.max(twentyTwo, Math.ceil(latest / slot) * slot);
}

export function slotTimes(dayKey: string, sessions: FestivalSession[]) {
  const start = dayStartMs(dayKey, sessions);
  const end = dayEndMs(dayKey, sessions);
  const slot = SLOT_MINUTES * 60 * 1000;
  const times: number[] = [];
  for (let t = start; t < end; t += slot) times.push(t);
  return times.length > 0 ? times : [start];
}

export function seatKey(row: number, seat: number) {
  return `${row}:${seat}`;
}
