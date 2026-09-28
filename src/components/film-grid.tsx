import type { ReactNode } from "react";
import Link from "next/link";
import { FilmCard, type CatalogFilm } from "@/components/film-card";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type { CatalogFilm };

export function ErrorState({
  title = "Не удалось загрузить данные",
  description = "Проверьте соединение и обновите страницу.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent">
      <CardHeader className="items-center py-10 text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function EmptyState({
  title = "Здесь пока ничего нет",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent">
      <CardHeader className="items-center py-10 text-center">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export function ListRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 sm:grid-cols-[250px_minmax(0,1fr)] sm:items-start"
        >
          <Skeleton className="h-[140px] rounded-none" />
          <div className="space-y-3 py-1">
            <Skeleton className="h-5 w-2/5 rounded-none" />
            <Skeleton className="h-4 w-1/4 rounded-none" />
            <Skeleton className="h-4 w-3/5 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilmGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[385/216] rounded-none" />
          <Skeleton className="mt-3 h-4 w-2/3 rounded-none" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-none" />
        </div>
      ))}
    </div>
  );
}

export function FilmGrid({
  title,
  films,
  emptyLabel = "Здесь пока ничего нет",
  toolbar,
  action,
  loading = false,
  renderActions,
}: {
  title: string;
  films: CatalogFilm[];
  emptyLabel?: string;
  toolbar?: ReactNode;
  action?: { href: string; label: string };
  loading?: boolean;
  renderActions?: (film: CatalogFilm) => ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "…" : films.length}
          </p>
        </div>
        {toolbar}
        {action ? (
          <Link
            href={action.href}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {loading ? (
        <FilmGridSkeleton />
      ) : films.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {films.map((film) => (
            <div key={film.id}>
              <FilmCard film={film} variant="landscape" />
              {renderActions?.(film)}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Здесь пока ничего нет" description={emptyLabel} />
      )}
    </section>
  );
}
