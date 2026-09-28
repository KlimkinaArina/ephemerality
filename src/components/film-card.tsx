import Link from "next/link";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CatalogFilm = {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorId: string;
  ownerId: string;
  year: number;
  durationSeconds: number;
  moods: string[];
  themes: string[];
  synopsis: string;
  thumbnailUrl?: string;
  shareImageUrl?: string;
  showtime?: string;
  day?: string;
  dayLabel?: string;
};

export const FILM_SELECT =
  "id, title, slug, description, duration_seconds, moods, themes, thumbnail_url, share_image_url, release_date, author_id, user_id, authors(id, name, user_id)" as const;

/** @deprecated use CatalogFilm */
export type MockFilm = CatalogFilm;

type AuthorEmbed =
  | { id?: string; name: string; user_id?: string | null }
  | { id?: string; name: string; user_id?: string | null }[]
  | null;

function authorEmbed(authors: AuthorEmbed) {
  if (!authors) return { id: "", name: "Автор неизвестен", userId: "" };
  const row = Array.isArray(authors) ? authors[0] : authors;
  return {
    id: row?.id ?? "",
    name: row?.name ?? "Автор неизвестен",
    userId: row?.user_id ?? "",
  };
}

export function isFilmOwner(
  film: Pick<CatalogFilm, "ownerId">,
  userId: string | undefined | null
) {
  return Boolean(userId && film.ownerId && film.ownerId === userId);
}

export function toCatalogFilm(row: {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  duration_seconds: number;
  moods: string[] | null;
  themes: string[] | null;
  thumbnail_url: string | null;
  share_image_url?: string | null;
  release_date: string | null;
  author_id?: string | null;
  user_id?: string | null;
  authors: AuthorEmbed;
}): CatalogFilm {
  const author = authorEmbed(row.authors);
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.title,
    author: author.name,
    authorId: row.author_id ?? author.id,
    ownerId: row.user_id ?? author.userId ?? "",
    year: row.release_date ? Number(row.release_date.slice(0, 4)) : 0,
    durationSeconds: row.duration_seconds,
    moods: row.moods ?? [],
    themes: row.themes ?? [],
    synopsis: row.description ?? "",
    thumbnailUrl: row.thumbnail_url ?? undefined,
    shareImageUrl: row.share_image_url ?? undefined,
  };
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0
    ? `${minutes} мин`
    : `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function FilmCard({
  film,
  variant = "poster",
}: {
  film: CatalogFilm;
  variant?: "poster" | "landscape" | "schedule";
}) {
  if (variant === "schedule") {
    return (
      <Link
        href={`/film/${film.id}`}
        className="grid gap-4 py-4 sm:grid-cols-[250px_minmax(0,1fr)_minmax(0,211px)_auto] sm:items-start sm:gap-6"
      >
        <div className="relative h-[140px] w-full overflow-hidden bg-hero sm:w-[250px]">
          {film.thumbnailUrl ? (
            <img
              src={film.thumbnailUrl}
              alt=""
              className="size-full object-cover object-bottom"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <h3 className="text-[length:var(--ef-text-body)] font-normal text-foreground">
            {film.title}
          </h3>
          <p className="mt-1 font-extralight text-[length:var(--ef-text-meta)] text-foreground">
            Режисер {film.author}
          </p>
          <p className="mt-1 font-extralight text-[length:var(--ef-text-meta)] text-sage-muted">
            {formatDuration(film.durationSeconds)}
          </p>
        </div>
        <p className="max-w-[211px] text-[length:var(--ef-text-meta)] font-normal leading-normal text-foreground">
          {film.synopsis}
        </p>
        <div className="sm:text-right">
          {film.showtime ? (
            <p className="text-[length:var(--ef-text-meta)] font-normal text-foreground">
              {film.showtime}
            </p>
          ) : null}
          <p className="mt-1 font-extralight uppercase text-[length:var(--ef-text-meta)] text-foreground">
            {film.moods[0]}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "landscape") {
    return (
      <Link href={`/film/${film.id}`} className="group block">
        <div className="relative aspect-[385/216] overflow-hidden bg-hero">
          {film.thumbnailUrl ? (
            <img
              src={film.thumbnailUrl}
              alt=""
              className="size-full object-cover object-bottom"
            />
          ) : null}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[length:var(--ef-text-body)] font-normal text-foreground">
              {film.title}
            </h3>
            <p className="mt-1 font-extralight uppercase text-[length:var(--ef-text-meta)] text-foreground">
              {film.moods[0]}
            </p>
          </div>
          <p className="shrink-0 font-extralight text-[length:var(--ef-text-meta)] text-sage-muted">
            {formatDuration(film.durationSeconds)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/film/${film.id}`}
      className="group block overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-muted via-muted/60 to-muted/20">
        {film.thumbnailUrl ? (
          <img
            src={film.thumbnailUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <Badge variant="secondary" className="absolute left-3 top-3 z-10">
          {formatDuration(film.durationSeconds)}
        </Badge>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-foreground/20 bg-background/60 text-foreground/70 backdrop-blur-sm transition-colors group-hover:border-primary/60 group-hover:text-primary">
            <Play className="size-5" />
          </span>
        </span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-medium text-foreground">
          {film.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {film.author} · {film.year}
        </p>
        <p className="truncate text-xs text-muted-foreground/80">
          {film.moods.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
