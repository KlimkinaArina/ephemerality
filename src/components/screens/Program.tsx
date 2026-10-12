"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/film-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dateKey,
  festivalDayKeys,
  formatClock,
  formatPrice,
  mapFestivalSession,
  matchesQuery,
  SESSION_SELECT,
  slotTimes,
  type FestivalHall,
  type FestivalSession,
} from "@/lib/festival";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

export function Program() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const [halls, setHalls] = useState<FestivalHall[]>([]);
  const [sessions, setSessions] = useState<FestivalSession[]>([]);
  const [day, setDay] = useState(() => festivalDayKeys(null)[0].key);
  const [hallId, setHallId] = useState("all");
  const [genres, setGenres] = useState<string[]>([]);
  const [query, setQuery] = useState("");

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
        const [
          { data: festival, error: festivalError },
          { data: hallRows, error: hallError },
          { data: sessionRows, error: sessionError },
        ] = await Promise.all([
          supabase.from("festival_info").select("*").eq("id", 1).maybeSingle(),
          supabase.from("halls").select("id, name, address, capacity").order("name"),
          supabase
            .from("sessions")
            .select(SESSION_SELECT)
            .eq("is_published", true)
            .order("starts_at"),
        ]);

        if (cancelled) return;
        const queryError = festivalError || hallError || sessionError;
        if (queryError && queryError.code !== "PGRST205" && queryError.code !== "PGRST204") {
          console.error(queryError.message);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          return;
        }

        setStartsOn(festival?.starts_on ?? dateKey(new Date()));
        setHalls((hallRows ?? []) as FestivalHall[]);
        setSessions(
          (sessionRows ?? [])
            .map((row) => mapFestivalSession(row as Parameters<typeof mapFestivalSession>[0]))
            .filter((row): row is FestivalSession => Boolean(row))
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

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    for (const session of sessions) {
      for (const genre of session.film.genre) {
        if (genre.trim()) set.add(genre.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      if (day && dateKey(new Date(session.starts_at)) !== day) return false;
      if (hallId !== "all" && session.hall_id !== hallId) return false;
      if (genres.length > 0) {
        const filmGenres = session.film.genre.map((item) => item.trim());
        if (!genres.some((genre) => filmGenres.includes(genre))) return false;
      }
      return matchesQuery(session, query);
    });
  }, [sessions, day, hallId, genres, query]);

  const gridHalls = useMemo(() => {
    if (hallId !== "all") {
      return halls.filter((hall) => hall.id === hallId);
    }
    const used = new Set(filtered.map((session) => session.hall_id));
    const fromSessions = halls.filter((hall) => used.has(hall.id));
    if (fromSessions.length > 0) return fromSessions;
    return halls;
  }, [halls, hallId, filtered]);

  const slots = useMemo(
    () => (day ? slotTimes(day, filtered.length ? filtered : sessions) : []),
    [day, filtered, sessions]
  );

  function toggleGenre(genre: string) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-64" />
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
        Программа
      </h1>

      <div className="mt-8 flex flex-col gap-4">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-48 flex-col gap-1 text-[length:var(--ef-text-meta)] font-extralight">
            Зал
            <select
              value={hallId}
              onChange={(event) => setHallId(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground"
            >
              <option value="all">Все залы</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск: название, режиссёр, жанр, страна"
            className="h-10 max-w-md"
            aria-label="Поиск по программе"
          />
        </div>

        {genreOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => {
              const active = genres.includes(genre);
              return (
                <Button
                  key={genre}
                  type="button"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleGenre(genre)}
                  className="h-8 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] px-3 font-light"
                  aria-pressed={active}
                >
                  {genre}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>

      {gridHalls.length === 0 || slots.length === 0 ? (
        <p className="mt-10 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
          Расписание появится, когда модератор добавит сеансы.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <div
            className="grid min-w-[40rem] gap-px"
            style={{ gridTemplateColumns: `8rem repeat(${slots.length}, minmax(5.5rem, 1fr))` }}
          >
            <div />
            {slots.map((time) => (
              <div
                key={time}
                className="px-1 pb-2 text-center text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground"
              >
                {new Date(time).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ))}
            {gridHalls.map((hall) => (
              <HallRow
                key={hall.id}
                hall={hall}
                slots={slots}
                sessions={filtered.filter((session) => session.hall_id === hall.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && gridHalls.length > 0 ? (
        <p className="mt-6 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
          Ничего не найдено. Снимите фильтры или измените запрос.
        </p>
      ) : null}
    </div>
  );
}

function HallRow({
  hall,
  slots,
  sessions,
}: {
  hall: FestivalHall;
  slots: number[];
  sessions: FestivalSession[];
}) {
  const slotMs = 30 * 60 * 1000;
  const start = slots[0] ?? 0;

  return (
    <>
      <div className="sticky left-0 z-10 flex items-center bg-background pr-2 text-[length:var(--ef-text-body)] font-light">
        {hall.name}
      </div>
      <div
        className="relative min-h-24 border-t border-foreground/10"
        style={{ gridColumn: `2 / span ${slots.length}` }}
      >
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
        >
          {slots.map((time) => (
            <div key={time} className="border-l border-foreground/10" />
          ))}
        </div>
        {sessions.map((session) => {
          const from = new Date(session.starts_at).getTime();
          const to = new Date(session.ends_at).getTime();
          const col = Math.max(0, Math.round((from - start) / slotMs));
          const span = Math.max(1, Math.round((to - from) / slotMs));
          const left = (col / slots.length) * 100;
          const width = (Math.min(span, slots.length - col) / slots.length) * 100;
          return (
            <Link
              key={session.id}
              href={`/session/${session.id}`}
              className="absolute top-1 bottom-1 overflow-hidden border border-foreground/40 bg-background px-2 py-1 hover:bg-muted"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <p className="text-[length:var(--ef-text-meta)] font-medium tabular-nums">
                {formatClock(session.starts_at)}
              </p>
              <p className="truncate text-[length:var(--ef-text-meta)] font-light">
                {session.film.title}
              </p>
              <p className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
                {formatPrice(session.ticket_price)}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
