"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/film-card";
import { ModeratorNav } from "@/components/moderator-nav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  APPLICATION_SELECT,
  type ApplicationRow,
} from "@/lib/application";
import {
  dateKey,
  DEFAULT_TICKET_PRICE,
  festivalDayKeys,
  formatClock,
  mapFestivalSession,
  SESSION_SELECT,
  SLOT_MINUTES,
  slotTimes,
  type FestivalHall,
  type FestivalSession,
} from "@/lib/festival";
import { supabase } from "@/lib/supabase";

const FILM_DRAG = "application/x-ef-film";

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

export function ModeratorSchedule() {
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const [halls, setHalls] = useState<FestivalHall[]>([]);
  const [sessions, setSessions] = useState<FestivalSession[]>([]);
  const [accepted, setAccepted] = useState<ApplicationRow[]>([]);
  const [day, setDay] = useState("");
  const [hover, setHover] = useState<{ hallId: string; start: number } | null>(null);
  const [dragFilmId, setDragFilmId] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<string[] | null>(null);
  const [rollbackUntil, setRollbackUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const days = useMemo(() => festivalDayKeys(startsOn), [startsOn]);

  useEffect(() => {
    if (days.length > 0 && !days.some((item) => item.key === day)) {
      setDay(days[0].key);
    }
  }, [day, days]);

  useEffect(() => {
    if (!rollbackUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [rollbackUntil]);

  async function load() {
    try {
      const [
        { data: festival },
        { data: hallRows, error: hallError },
        { data: sessionRows, error: sessionError },
        { data: filmRows, error: filmError },
      ] = await Promise.all([
        supabase.from("festival_info").select("starts_on").eq("id", 1).maybeSingle(),
        supabase.from("halls").select("id, name, address, capacity").order("name"),
        supabase.from("sessions").select(SESSION_SELECT).order("starts_at"),
        supabase
          .from("films")
          .select(APPLICATION_SELECT)
          .eq("status", "accepted")
          .order("title"),
      ]);
      if (hallError || sessionError || filmError) {
        console.error(hallError?.message || sessionError?.message || filmError?.message);
        toast.error("Ошибка");
        return;
      }
      setStartsOn(festival?.starts_on ?? dateKey(new Date()));
      setHalls((hallRows ?? []) as FestivalHall[]);
      setSessions(
        (sessionRows ?? [])
          .map((row) => mapFestivalSession(row as Parameters<typeof mapFestivalSession>[0]))
          .filter((row): row is FestivalSession => Boolean(row))
      );
      setAccepted((filmRows ?? []) as ApplicationRow[]);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const scheduledIds = useMemo(
    () => new Set(sessions.map((session) => session.film_id)),
    [sessions]
  );
  const unscheduled = accepted.filter((film) => !scheduledIds.has(film.id));
  const slots = useMemo(
    () => (day ? slotTimes(day, sessions) : []),
    [day, sessions]
  );
  const dragFilm = accepted.find((film) => film.id === dragFilmId) ?? null;
  const rollbackLeft = Math.max(0, Math.ceil((rollbackUntil - now) / 1000));

  function conflict(hallId: string, startMs: number, durationSeconds: number, ignoreId?: string) {
    const endMs = startMs + durationSeconds * 1000;
    const dayEnd = slots.length
      ? slots[slots.length - 1] + SLOT_MINUTES * 60 * 1000
      : endMs;
    if (endMs > dayEnd) return true;
    return sessions.some((session) => {
      if (session.hall_id !== hallId) return false;
      if (ignoreId && session.id === ignoreId) return false;
      return overlaps(
        startMs,
        endMs,
        new Date(session.starts_at).getTime(),
        new Date(session.ends_at).getTime()
      );
    });
  }

  async function createSession(hallId: string, startMs: number, film: ApplicationRow) {
    if (conflict(hallId, startMs, film.duration_seconds)) {
      toast.error("Конфликт слота или длительности");
      return;
    }
    const hall = halls.find((item) => item.id === hallId);
    const starts = new Date(startMs).toISOString();
    const ends = new Date(startMs + film.duration_seconds * 1000).toISOString();
    try {
      const { error } = await supabase.from("sessions").insert({
        film_id: film.id,
        hall_id: hallId,
        starts_at: starts,
        ends_at: ends,
        ticket_price: DEFAULT_TICKET_PRICE,
        capacity: hall?.capacity || 100,
        is_published: false,
      });
      if (error) {
        console.error(error.message);
        toast.error(error.message || "Ошибка");
        return;
      }
      toast.success("Сохранено");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
    }
  }

  async function removeSession(id: string) {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) {
      console.error(error.message);
      toast.error("Ошибка");
      return;
    }
    toast.success("Сохранено");
    await load();
  }

  async function publish() {
    const ids = sessions.filter((session) => !session.is_published).map((session) => session.id);
    if (ids.length === 0) {
      toast.success("Сохранено");
      return;
    }
    const { error } = await supabase.from("sessions").update({ is_published: true }).in("id", ids);
    if (error) {
      console.error(error.message);
      toast.error("Ошибка");
      return;
    }
    setPublishedIds(ids);
    setRollbackUntil(Date.now() + 60_000);
    toast.success("Сохранено");
    await load();
  }

  async function rollback() {
    if (!publishedIds?.length || rollbackLeft <= 0) return;
    const { error } = await supabase
      .from("sessions")
      .update({ is_published: false })
      .in("id", publishedIds);
    if (error) {
      console.error(error.message);
      toast.error("Ошибка");
      return;
    }
    setPublishedIds(null);
    setRollbackUntil(0);
    toast.success("Сохранено");
    await load();
  }

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">
          Расписание
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={publish}
            className="h-10 rounded-[var(--ef-radius-button)] font-light"
          >
            Опубликовать расписание
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={rollbackLeft <= 0}
            onClick={rollback}
            className="h-10 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light hover:bg-transparent"
          >
            Откатить публикацию{rollbackLeft > 0 ? ` (${rollbackLeft}с)` : ""}
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="border border-foreground/20 p-3">
          <h2 className="text-[length:var(--ef-text-meta)] font-extralight uppercase">
            Принятые без сеанса
          </h2>
          <ul className="mt-3 space-y-2">
            {unscheduled.map((film) => (
              <li
                key={film.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(FILM_DRAG, film.id);
                  event.dataTransfer.effectAllowed = "copy";
                  setDragFilmId(film.id);
                }}
                onDragEnd={() => {
                  window.setTimeout(() => {
                    setDragFilmId(null);
                    setHover(null);
                  }, 0);
                }}
                className="cursor-grab border border-foreground/20 bg-background px-2 py-2 active:cursor-grabbing"
              >
                <p className="text-[length:var(--ef-text-meta)] font-normal">{film.title}</p>
                <p className="font-extralight text-muted-foreground">
                  {formatDuration(film.duration_seconds)}
                </p>
              </li>
            ))}
            {unscheduled.length === 0 ? (
              <li className="font-light text-muted-foreground">Все принятые уже в сетке.</li>
            ) : null}
          </ul>
        </aside>
        <div>
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
          {halls.length === 0 || slots.length === 0 ? (
            <p className="mt-6 font-light text-muted-foreground">
              Добавьте залы и даты фестиваля, чтобы собрать сетку.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <div
                className="grid min-w-[40rem] gap-px"
                style={{
                  gridTemplateColumns: `7rem repeat(${slots.length}, minmax(4.5rem, 1fr))`,
                }}
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
                {halls.map((hall) => (
                  <HallScheduleRow
                    key={hall.id}
                    hall={hall}
                    slots={slots}
                    sessions={sessions.filter(
                      (session) =>
                        session.hall_id === hall.id &&
                        dateKey(new Date(session.starts_at)) === day
                    )}
                    dragFilm={dragFilm}
                    hover={hover}
                    conflictAt={(start) =>
                      dragFilm ? conflict(hall.id, start, dragFilm.duration_seconds) : false
                    }
                    onHover={(start) => setHover(start === null ? null : { hallId: hall.id, start })}
                    onDropSlot={(start) => {
                      if (!dragFilm) return;
                      void createSession(hall.id, start, dragFilm);
                    }}
                    onRemove={removeSession}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HallScheduleRow({
  hall,
  slots,
  sessions,
  dragFilm,
  hover,
  conflictAt,
  onHover,
  onDropSlot,
  onRemove,
}: {
  hall: FestivalHall;
  slots: number[];
  sessions: FestivalSession[];
  dragFilm: ApplicationRow | null;
  hover: { hallId: string; start: number } | null;
  conflictAt: (start: number) => boolean;
  onHover: (start: number | null) => void;
  onDropSlot: (start: number) => void;
  onRemove: (id: string) => void;
}) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const start = slots[0] ?? 0;

  return (
    <>
      <div className="sticky left-0 z-10 flex items-center bg-background pr-2 text-[length:var(--ef-text-meta)] font-light">
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
          {slots.map((time) => {
            const active = hover?.hallId === hall.id && hover.start === time;
            const bad = active && dragFilm && conflictAt(time);
            return (
              <div
                key={time}
                onDragOver={(event) => {
                  event.preventDefault();
                  onHover(time);
                }}
                onDragLeave={() => onHover(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  onHover(null);
                  onDropSlot(time);
                }}
                className={`border-l border-foreground/10 ${
                  bad ? "bg-red-500/40" : active ? "bg-emerald-500/20" : ""
                }`}
              />
            );
          })}
        </div>
        {sessions.map((session) => {
          const from = new Date(session.starts_at).getTime();
          const to = new Date(session.ends_at).getTime();
          const col = Math.max(0, Math.round((from - start) / slotMs));
          const span = Math.max(1, Math.round((to - from) / slotMs));
          const left = (col / slots.length) * 100;
          const width = (Math.min(span, slots.length - col) / slots.length) * 100;
          return (
            <div
              key={session.id}
              className={`absolute top-1 bottom-1 overflow-hidden border px-1 py-1 ${
                session.is_published
                  ? "border-emerald-400/50 bg-background"
                  : "border-foreground/40 bg-background"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <p className="text-[10px] font-medium tabular-nums">{formatClock(session.starts_at)}</p>
              <p className="truncate text-[length:var(--ef-text-meta)]">{session.film.title}</p>
              <button
                type="button"
                className="text-[10px] font-extralight underline"
                onClick={() => onRemove(session.id)}
              >
                Убрать
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
