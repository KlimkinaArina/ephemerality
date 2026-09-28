"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilmCard, FILM_SELECT, isFilmOwner, toCatalogFilm, type CatalogFilm } from "@/components/film-card";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FilmFormSheet } from "@/components/film-form-sheet";
import { EmptyState, ErrorState, ListRowSkeleton } from "@/components/film-grid";
import { FilmRowActions } from "@/components/film-row-actions";
import {
  durationFilters,
  filmMatchesFilters,
  moodFilters,
  themeFilters,
} from "@/components/screens/Catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

export function Search({
  initialQuery,
  initialMinutes,
}: {
  initialQuery: string;
  initialMinutes: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [minutes, setMinutes] = useState<string | null>(
    initialMinutes && durationFilters.some((item) => item.value === initialMinutes)
      ? initialMinutes
      : null
  );
  const [moods, setMoods] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [films, setFilms] = useState<CatalogFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogFilm | null>(null);
  const [deleting, setDeleting] = useState<CatalogFilm | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("films")
          .select(FILM_SELECT)
          .eq("status", "published")
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (queryError) {
          console.error(queryError);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          setFilms([]);
          return;
        }
        setFilms((data ?? []).map(toCatalogFilm));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(LOAD_ERROR);
        setError(LOAD_ERROR);
        setFilms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (minutes) params.set("minutes", minutes);
    const suffix = params.toString();
    router.replace(suffix ? `/search?${suffix}` : "/search", { scroll: false });
  }, [query, minutes, router]);

  const moodChips = useMemo(() => {
    return [...new Set([...moodFilters, ...films.flatMap((film) => film.moods)])].filter(
      Boolean
    );
  }, [films]);

  const themeChips = useMemo(() => {
    return [
      ...new Set([...themeFilters, ...films.flatMap((film) => film.themes)]),
    ].filter(Boolean);
  }, [films]);

  const visible = useMemo(
    () =>
      films.filter((film) =>
        filmMatchesFilters(film, { query, minutes, moods, themes })
      ),
    [films, query, minutes, moods, themes]
  );

  function filmCountLabel(count: number) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} фильм`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
      return `${count} фильма`;
    return `${count} фильмов`;
  }

  function toggleValue(current: string[], value: string) {
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
  }

  return (
    <>
      <section className="relative bg-hero">
        <div className="mx-auto grid min-h-[510px] w-full max-w-[var(--ef-content-width)] lg:grid-cols-[minmax(0,1fr)_42%]">
          <div className="relative z-10 flex flex-col justify-center gap-8 px-4 py-16 sm:px-6">
            <h1 className="font-medium uppercase leading-none tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(2rem,6vw,var(--ef-text-display))]">
              Поиск
            </h1>
            <p className="max-w-[36rem] text-[length:var(--ef-text-body)] font-normal leading-normal text-foreground">
              По названию, автору, настроению и теме.
              <br />
              Ограничьте выдачу по времени, если его мало.
            </p>
          </div>
          <div className="relative hidden min-h-[320px] lg:block">
            <img
              src="/brand/program-hero.png"
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-hero from-[60%] to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-8 sm:px-6">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название, автор, настроение, тема"
          className="h-12 max-w-xl rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent text-[length:var(--ef-text-body)]"
          aria-label="Поисковый запрос"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[length:var(--ef-text-meta)] font-extralight uppercase text-sage-muted">
            Время
          </span>
          {durationFilters.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={minutes === item.value ? "default" : "outline"}
              onClick={() =>
                setMinutes((current) =>
                  current === item.value ? null : item.value
                )
              }
              className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] font-light"
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[length:var(--ef-text-meta)] font-extralight uppercase text-sage-muted">
            Настроение
          </span>
          {moodChips.map((mood) => (
            <Button
              key={mood}
              type="button"
              variant={moods.includes(mood) ? "default" : "outline"}
              onClick={() => setMoods((current) => toggleValue(current, mood))}
              className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] font-light"
            >
              {mood}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[length:var(--ef-text-meta)] font-extralight uppercase text-sage-muted">
            Тема
          </span>
          {themeChips.map((theme) => (
            <Button
              key={theme}
              type="button"
              variant={themes.includes(theme) ? "default" : "outline"}
              onClick={() =>
                setThemes((current) => toggleValue(current, theme))
              }
              className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] font-light"
            >
              {theme}
            </Button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 pb-16 sm:px-6">
        <p className="mb-4 text-[length:var(--ef-text-section)] font-normal text-foreground">
          {loading ? "…" : filmCountLabel(visible.length)}
        </p>
        {loading ? (
          <ListRowSkeleton />
        ) : error ? (
          <ErrorState description={error} />
        ) : visible.length > 0 ? (
          <div>
            {visible.map((film) => (
              <div key={film.id} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <FilmCard film={film} variant="schedule" />
                </div>
                {isFilmOwner(film, user?.id) ? (
                  <FilmRowActions
                    onEdit={() => {
                      setEditing(film);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(film)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Здесь пока ничего нет"
            description="Измените запрос или фильтры."
          />
        )}
      </section>
      <FilmFormSheet
        open={formOpen}
        film={editing}
        onOpenChange={setFormOpen}
        onSaved={(saved) => {
          setFilms((current) => {
            const exists = current.some((item) => item.id === saved.id);
            return exists
              ? current.map((item) => (item.id === saved.id ? saved : item))
              : [saved, ...current];
          });
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Удалить фильм?"
        description="Фильм исчезнет из выдачи и из базы."
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting || !user || !isFilmOwner(deleting, user.id)) return;
          setDeletePending(true);
          const { data: deleted, error: deleteError } = await supabase
            .from("films")
            .delete()
            .eq("id", deleting.id)
            .eq("user_id", user.id)
            .select("id");
          setDeletePending(false);
          if (deleteError || !deleted?.length) {
            console.error(deleteError);
            toast.error("Ошибка");
            return;
          }
          toast.success("Сохранено");
          setFilms((current) =>
            current.filter((item) => item.id !== deleting.id)
          );
          setDeleting(null);
        }}
      />
    </>
  );
}
