"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  FILM_SELECT,
  formatDuration,
  isFilmOwner,
  toCatalogFilm,
  type CatalogFilm,
} from "@/components/film-card";
import { FilmFormSheet } from "@/components/film-form-sheet";
import { ErrorState } from "@/components/film-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FilmDetail = CatalogFilm & {
  body: string;
  heroUrl: string;
};

function toDetail(film: CatalogFilm): FilmDetail {
  return {
    ...film,
    body: film.synopsis,
    heroUrl: film.shareImageUrl || film.thumbnailUrl || "",
  };
}

function titleLines(title: string) {
  const parts = title.split(" ");
  if (parts.length < 2) return [title];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

function DayRule() {
  return (
    <div className="flex items-center gap-3">
      <img src="/brand/diamond.png" alt="" className="size-[19px] object-contain" />
      <img
        src="/brand/divider.svg"
        alt=""
        className="h-px min-w-0 flex-1 object-fill"
      />
      <img src="/brand/diamond.png" alt="" className="size-[19px] object-contain" />
    </div>
  );
}

export function Film({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [shared, setShared] = useState(false);
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const column = uuidPattern.test(id) ? "id" : "slug";
        const { data, error: queryError } = await supabase
          .from("films")
          .select(FILM_SELECT)
          .eq(column, id)
          .maybeSingle();

        if (cancelled) return;
        if (queryError) {
          console.error(queryError);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          setFilm(null);
          return;
        }
        if (!data) {
          setFilm(null);
          return;
        }
        setFilm(toDetail(toCatalogFilm(data)));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(LOAD_ERROR);
        setError(LOAD_ERROR);
        setFilm(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onShare = async () => {
    if (!film) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: film.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 2500);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось поделиться ссылкой");
    }
  };

  if (loading) {
    return (
      <div className="bg-film">
        <Skeleton className="h-[615px] rounded-none" />
        <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-6 px-4 py-10 sm:px-6">
          <Skeleton className="h-40 rounded-none" />
          <Skeleton className="h-64 rounded-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
        <ErrorState description={error} />
      </div>
    );
  }

  if (!film) {
    notFound();
  }

  const [line1, line2] = titleLines(film.title);
  const stills = [film.heroUrl, film.thumbnailUrl].filter(
    (src, index, list): src is string => Boolean(src) && list.indexOf(src) === index
  );

  return (
    <article>
      <section className="relative bg-film">
        <div className="mx-auto grid min-h-[615px] w-full max-w-[var(--ef-content-width)] lg:grid-cols-[minmax(0,1fr)_42%]">
          <div className="relative z-10 flex flex-col justify-center gap-6 px-4 py-16 sm:px-6">
            <h1 className="font-medium leading-[0.93] tracking-[var(--ef-tracking-film)] text-foreground text-[clamp(2rem,6vw,var(--ef-text-display))]">
              {line1}
              {line2 ? (
                <>
                  <br />
                  {line2}
                </>
              ) : null}
            </h1>
            <p className="text-[length:var(--ef-text-cta)] font-normal text-foreground">
              Реж. {film.author}
            </p>
            <p className="text-[length:var(--ef-text-body)] font-normal text-foreground">
              {formatDuration(film.durationSeconds)}
              {film.year ? (
                <>
                  <span className="mx-3">/</span>
                  {film.year}
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlaying((current) => !current)}
                className="h-16 w-full max-w-[353px] rounded-[var(--ef-radius-trailer)] border-[length:var(--ef-border-width)] bg-transparent px-6 text-[length:var(--ef-text-cta)] font-normal hover:bg-transparent"
                aria-pressed={playing}
              >
                <img src="/brand/play.svg" alt="" width={12.5588} height={16.2339} />
                {playing ? "пауза" : "смотреть трейлер"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onShare}
                className="font-extralight text-[length:var(--ef-text-meta)]"
              >
                {shared ? <Check /> : null}
                {shared ? "Ссылка скопирована" : "Поделиться"}
              </Button>
              {isFilmOwner(film, user?.id) ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormOpen(true)}
                    className="font-extralight text-[length:var(--ef-text-meta)]"
                  >
                    Изменить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    className="font-extralight text-[length:var(--ef-text-meta)]"
                  >
                    Удалить
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/login?next=/favorites")}
                  className="font-extralight text-[length:var(--ef-text-meta)]"
                >
                  Сохранить
                </Button>
              )}
            </div>
          </div>
          <div className="relative hidden min-h-[420px] lg:block">
            {playing ? (
              <div
                className="absolute inset-0 flex items-center justify-center bg-film-panel"
                role="region"
                aria-label="Плеер фильма"
              >
                {film.heroUrl ? (
                  <img
                    src={film.heroUrl}
                    alt=""
                    className="size-full object-cover object-bottom opacity-40"
                  />
                ) : null}
                <p className="absolute text-[length:var(--ef-text-body)] font-light">
                  Идёт показ
                </p>
              </div>
            ) : (
              <>
                {film.heroUrl ? (
                  <img
                    src={film.heroUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-bottom"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-film from-[20%] to-transparent" />
                <div className="absolute inset-y-0 right-0 w-[28%] bg-gradient-to-l from-film to-transparent" />
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-8 sm:px-6">
        <DayRule />

        {playing ? (
          <div
            className="relative mt-8 aspect-video overflow-hidden bg-film-panel lg:hidden"
            role="region"
            aria-label="Плеер фильма"
          >
            {film.heroUrl ? (
              <img
                src={film.heroUrl}
                alt=""
                className="size-full object-cover object-bottom opacity-40"
              />
            ) : null}
            <p className="absolute inset-0 flex items-center justify-center text-[length:var(--ef-text-body)] font-light">
              Идёт показ
            </p>
          </div>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(16rem,20rem)]">
          <p className="max-w-[749px] text-[length:var(--ef-text-cta)] font-normal leading-normal text-foreground">
            {film.body || "Описание появится позже."}
          </p>
          <div className="hidden w-px bg-foreground lg:block" aria-hidden />
          <dl className="space-y-6 text-[length:var(--ef-text-cta)] text-foreground">
            <div>
              <dt className="font-extralight">Режисер</dt>
              <dd className="font-normal">{film.author}</dd>
            </div>
            <div>
              <dt className="font-extralight">Сценарий</dt>
              <dd className="font-normal">{film.author}</dd>
            </div>
            <div>
              <dt className="font-extralight">Оператор</dt>
              <dd className="font-normal">{film.author}</dd>
            </div>
            <div>
              <dt className="font-extralight">В ролях</dt>
              <dd className="font-normal">{film.author}</dd>
            </div>
          </dl>
        </div>

        {stills.length > 0 ? (
          <div className="mt-16 grid gap-2 lg:grid-cols-[minmax(0,1fr)_267px]">
            <div className="relative aspect-[936/466] overflow-hidden bg-film-panel">
              <img
                src={stills[0]}
                alt=""
                className="size-full object-cover object-bottom"
              />
            </div>
            <div className="grid gap-2">
              {stills.slice(1).map((src) => (
                <div
                  key={src}
                  className="relative aspect-[267/148] overflow-hidden bg-film-panel"
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-16">
          <DayRule />
        </div>
      </div>
      <FilmFormSheet
        open={formOpen}
        film={film}
        onOpenChange={setFormOpen}
        onSaved={(saved) => setFilm(toDetail(saved))}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Удалить фильм?"
        description="Карточка пропадёт из каталога и из базы."
        pending={deletePending}
        onOpenChange={setDeleteOpen}
        onConfirm={async () => {
          if (!user || !isFilmOwner(film, user.id)) return;
          setDeletePending(true);
          const { data: deleted, error: deleteError } = await supabase
            .from("films")
            .delete()
            .eq("id", film.id)
            .eq("user_id", user.id)
            .select("id");
          setDeletePending(false);
          if (deleteError || !deleted?.length) {
            console.error(deleteError);
            toast.error("Ошибка");
            return;
          }
          toast.success("Сохранено");
          router.push("/catalog");
        }}
      />
    </article>
  );
}
