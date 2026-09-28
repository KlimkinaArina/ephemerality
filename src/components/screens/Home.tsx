"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  FILM_SELECT,
  FilmCard,
  isFilmOwner,
  toCatalogFilm,
  type CatalogFilm,
} from "@/components/film-card";
import { FilmFormSheet } from "@/components/film-form-sheet";
import { EmptyState, ErrorState } from "@/components/film-grid";
import { FilmRowActions } from "@/components/film-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const timeFilters = ["5", "10", "15", "30"];
const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

export function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [minutes, setMinutes] = useState<string | null>(
    searchParams.get("minutes")
  );
  const [query, setQuery] = useState("");
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

  const limit = minutes ? Number(minutes) * 60 : null;
  const visible = films.filter((film) => {
    if (limit !== null && film.durationSeconds > limit) return false;
    return true;
  });

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (minutes) params.set("minutes", minutes);
    const suffix = params.toString();
    router.push(suffix ? `/search?${suffix}` : "/search");
  }

  return (
    <>
      <section className="relative bg-hero">
        <div className="mx-auto grid min-h-[min(774px,90vh)] w-full max-w-[var(--ef-content-width)] lg:grid-cols-[minmax(0,1fr)_42%]">
          <div className="relative z-10 flex flex-col justify-center gap-8 px-4 py-16 sm:px-6">
            <p className="max-w-[14rem] text-[length:var(--ef-text-body)] font-normal leading-normal text-foreground">
              Фестиваль короткометражных фильмов
            </p>
            <h1 className="font-medium uppercase leading-none tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(2rem,6vw,var(--ef-text-display))]">
              Эфемерность
            </h1>
            <p className="text-[length:var(--ef-text-body)] font-normal leading-normal text-foreground">
              Короткие истории
              <br />
              Которые вы не забудете
            </p>
            <form onSubmit={onSearch} className="flex max-w-md flex-col gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название, автор, настроение"
                className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent text-[length:var(--ef-text-body)]"
                aria-label="Поиск по каталогу"
              />
              <div className="flex flex-wrap gap-2">
                {timeFilters.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={minutes === value ? "default" : "outline"}
                    onClick={() =>
                      setMinutes((current) =>
                        current === value ? null : value
                      )
                    }
                    className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] font-light"
                  >
                    {value} мин
                  </Button>
                ))}
              </div>
            </form>
            <p className="text-[length:var(--ef-text-section)] font-normal text-foreground">
              10 - 13 июля 2026
              <br />
              Москва
            </p>
          </div>
          <div className="relative hidden min-h-[420px] lg:block">
            <img
              src="/brand/hero.png"
              alt=""
              className="absolute inset-0 size-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-hero from-20% to-transparent" />
          </div>
        </div>
      </section>

      <section id="about" className="bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-[var(--ef-content-width)] gap-10 bg-section px-6 py-12 lg:grid-cols-[1fr_612px] lg:px-12">
          <div className="flex flex-col justify-center">
            <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
              О фестивале
            </h2>
            <p className="mt-8 max-w-xl text-[length:var(--ef-text-section)] font-normal leading-normal text-foreground">
              «Эфемерность» — это фестиваль короткометражных фильмов, где время
              сжимается, а истории становятся острее. Мы показываем работы
              авторов, для которых важны не только сюжеты, но и ощущение
              момента.
            </p>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/auth" />}
              className="mt-10 h-14 w-fit rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-6 text-[length:var(--ef-text-cta)] font-light hover:bg-transparent"
            >
              Купить билеты
            </Button>
          </div>
          <img
            src="/brand/about.png"
            alt=""
            className="hidden h-[383px] w-full object-cover object-bottom lg:block"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 pb-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
            Ближайшие показы
          </h2>
          {user ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] font-light"
            >
              Добавить фильм
            </Button>
          ) : null}
        </div>
        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[385/216] rounded-none" />
                <Skeleton className="mt-3 h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState description={error} />
        ) : visible.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-3">
            {visible.map((film) => (
              <div key={film.id}>
                <FilmCard film={film} variant="landscape" />
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
          <EmptyState title="Здесь пока ничего нет" />
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
          setError(null);
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Удалить фильм?"
        description="Фильм исчезнет с главной и из базы."
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
