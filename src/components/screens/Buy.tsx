"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/film-card";
import { ErrorState } from "@/components/film-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dateKey,
  festivalDayKeys,
  formatClock,
  formatPrice,
  mapFestivalSession,
  SESSION_SELECT,
  type FestivalFilm,
  type FestivalSession,
} from "@/lib/festival";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

type DayFilm = {
  film: FestivalFilm;
  sessions: FestivalSession[];
};

export function Buy() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FestivalSession[]>([]);
  const [day, setDay] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [filmId, setFilmId] = useState<string | null>(null);

  const days = useMemo(() => festivalDayKeys(startsOn), [startsOn]);

  useEffect(() => {
    if (days.length > 0 && !days.some((item) => item.key === day)) {
      setDay(days[0].key);
    }
  }, [day, days]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [{ data: festival, error: festivalError }, { data: sessionRows, error: sessionError }] =
          await Promise.all([
            supabase.from("festival_info").select("starts_on").eq("id", 1).maybeSingle(),
            supabase.from("sessions").select(SESSION_SELECT).order("starts_at"),
          ]);
        if (cancelled) return;
        const queryError = festivalError || sessionError;
        if (queryError && queryError.code !== "PGRST205" && queryError.code !== "PGRST204") {
          console.error(queryError.message);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          return;
        }
        setStartsOn(festival?.starts_on ?? dateKey(new Date()));
        setSessions(
          (sessionRows ?? [])
            .map((row) => mapFestivalSession(row as Parameters<typeof mapFestivalSession>[0]))
            .filter((row): row is FestivalSession => row != null && row.is_published !== false)
        );
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(LOAD_ERROR);
        setError(LOAD_ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filmsOfDay = useMemo(() => {
    const map = new Map<string, DayFilm>();
    for (const session of sessions) {
      if (dateKey(new Date(session.starts_at)) !== day) continue;
      const current = map.get(session.film_id);
      if (current) current.sessions.push(session);
      else map.set(session.film_id, { film: session.film, sessions: [session] });
    }
    return [...map.values()].sort((a, b) => a.film.title.localeCompare(b.film.title, "ru"));
  }, [sessions, day]);

  const selectedFilm = filmsOfDay.find((item) => item.film.id === filmId) ?? null;
  const activeDay = days.find((item) => item.key === day);

  function goBack() {
    if (step === 2 && filmId) {
      setFilmId(null);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-80 w-full" />
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

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">
        Покупка билета
      </h1>

      <nav aria-label="Шаги покупки" className="mt-6 flex flex-wrap items-center gap-2 text-[length:var(--ef-text-meta)] font-light">
        <button
          type="button"
          className={step === 1 ? "font-normal" : "text-muted-foreground underline-offset-4 hover:underline"}
          onClick={() => {
            setStep(1);
            setFilmId(null);
          }}
        >
          {activeDay ? `${activeDay.label} ${activeDay.dateLabel}` : "День"}
        </button>
        <span className="text-muted-foreground">→</span>
        <button
          type="button"
          disabled={step === 1}
          className={
            step === 2
              ? "font-normal disabled:opacity-40"
              : "text-muted-foreground disabled:opacity-40"
          }
          onClick={() => setFilmId(null)}
        >
          {selectedFilm?.film.title ?? "Фильм"}
        </button>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">Сеанс</span>
      </nav>

      <Button
        type="button"
        variant="ghost"
        onClick={goBack}
        className="mt-4 px-0 font-light"
      >
        Назад
      </Button>

      {step === 1 ? (
        <div className="mt-8">
          <p className="mb-4 font-light text-muted-foreground">Шаг 1. Выберите день.</p>
          <Tabs
            value={day}
            onValueChange={(value) => {
              if (value) setDay(value);
            }}
          >
            <TabsList variant="line" className="h-auto gap-2 bg-transparent p-0">
              {days.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="h-10 min-w-16 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] px-4 font-light"
                >
                  {item.label}
                  <span className="ml-2 text-muted-foreground">{item.dateLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            type="button"
            className="mt-8 h-11 rounded-[var(--ef-radius-button)] font-light"
            disabled={!day}
            onClick={() => setStep(2)}
          >
            Далее
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-4 font-light text-muted-foreground">
            Шаг 2. Выберите фильм. Шаг 3 — конкретный сеанс.
          </p>
          {filmsOfDay.length === 0 ? (
            <p className="font-light text-muted-foreground">
              На этот день сеансов пока нет. Откройте{" "}
              <Link href="/program" className="underline underline-offset-4">
                программу
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filmsOfDay
                .filter((item) => !filmId || item.film.id === filmId)
                .map((item) => (
                  <li
                    key={item.film.id}
                    className="border border-foreground/20 p-3"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setFilmId(item.film.id)}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-hero">
                        {item.film.thumbnail_url ? (
                          <img
                            src={item.film.thumbnail_url}
                            alt=""
                            className="size-full object-cover object-bottom"
                          />
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-[length:var(--ef-text-body)] font-normal">
                        {item.film.title}
                      </h2>
                      <p className="mt-1 font-extralight text-muted-foreground">
                        {item.film.director}
                        {item.film.duration_seconds
                          ? ` · ${formatDuration(item.film.duration_seconds)}`
                          : ""}
                      </p>
                    </button>
                    <ul className="mt-3 space-y-2">
                      {item.sessions.map((session) => (
                        <li key={session.id}>
                          <Link
                            href={`/session/${session.id}`}
                            className="flex flex-wrap items-baseline justify-between gap-2 border border-foreground/15 px-3 py-2 text-[length:var(--ef-text-meta)] hover:border-foreground/50"
                          >
                            <span className="tabular-nums">{formatClock(session.starts_at)}</span>
                            <span className="font-light">{session.hall.name}</span>
                            <span className="font-extralight">{formatPrice(session.ticket_price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
