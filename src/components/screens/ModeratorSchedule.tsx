"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/film-card";
import { PosterImage } from "@/components/poster-image";
import { ModeratorNav } from "@/components/moderator-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const BUFFER_MINUTES = 15;
const OVERLAP_ERROR =
  "Сеанс пересекается с другим в этом зале (учтены длительность и буфер 15 мин).";

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

function durationMin(seconds: number) {
  return Math.max(1, Math.round(seconds / 60));
}

function sessionSpanMs(film: ApplicationRow) {
  return (film.duration_seconds + BUFFER_MINUTES * 60) * 1000;
}

export function ModeratorSchedule() {
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const [halls, setHalls] = useState<FestivalHall[]>([]);
  const [sessions, setSessions] = useState<FestivalSession[]>([]);
  const [accepted, setAccepted] = useState<ApplicationRow[]>([]);
  const [day, setDay] = useState("");
  const [publishedIds, setPublishedIds] = useState<string[] | null>(null);
  const [rollbackUntil, setRollbackUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [picked, setPicked] = useState<ApplicationRow | null>(null);

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
          .filter((row): row is FestivalSession => row != null)
      );
      setAccepted((filmRows ?? []) as ApplicationRow[]);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sessionCountByFilm = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) {
      counts.set(session.film_id, (counts.get(session.film_id) ?? 0) + 1);
    }
    return counts;
  }, [sessions]);

  const withoutSessions = accepted.filter(
    (film) => (sessionCountByFilm.get(film.id) ?? 0) === 0
  );
  const withSessions = accepted.filter(
    (film) => (sessionCountByFilm.get(film.id) ?? 0) > 0
  );

  const slots = useMemo(
    () => (day ? slotTimes(day, sessions) : []),
    [day, sessions]
  );
  const rollbackLeft = Math.max(0, Math.ceil((rollbackUntil - now) / 1000));

  function conflict(hallId: string, startMs: number, endMs: number, ignoreId?: string) {
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

  async function createSession(film: ApplicationRow, hallId: string, startMs: number) {
    const endMs = startMs + sessionSpanMs(film);
    if (conflict(hallId, startMs, endMs)) {
      return OVERLAP_ERROR;
    }
    const hall = halls.find((item) => item.id === hallId);
    try {
      const { error } = await supabase.from("sessions").insert({
        film_id: film.id,
        hall_id: hallId,
        starts_at: new Date(startMs).toISOString(),
        ends_at: new Date(endMs).toISOString(),
        ticket_price: DEFAULT_TICKET_PRICE,
        capacity: hall?.capacity || 100,
        is_published: true,
      });
      if (error) {
        console.error(error.message);
        toast.error(error.message || "Ошибка");
        return error.message || "Ошибка";
      }
      toast.success("Сохранено");
      setPicked(null);
      await load();
      return null;
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
      return "Ошибка";
    }
  }

  async function unpublishSession(id: string) {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ is_published: false })
        .eq("id", id);
      if (error) {
        console.error(error.message);
        toast.error("Ошибка");
        return;
      }
      toast.success("Сохранено");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
    }
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
            onClick={() => void publish()}
            className="h-10 rounded-[var(--ef-radius-button)] font-light"
          >
            Опубликовать расписание
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={rollbackLeft <= 0}
            onClick={() => void rollback()}
            className="h-10 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light hover:bg-transparent"
          >
            Откатить публикацию{rollbackLeft > 0 ? ` (${rollbackLeft}с)` : ""}
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border border-foreground/20 p-3">
          <h2 className="text-[length:var(--ef-text-meta)] font-extralight uppercase">
            Принятые без сеанса
          </h2>
          <ul className="mt-3 space-y-2">
            {withoutSessions.map((film) => (
              <AcceptedFilmCard
                key={film.id}
                film={film}
                sessionCount={0}
                onPick={() => setPicked(film)}
              />
            ))}
            {withoutSessions.length === 0 ? (
              <li className="font-light text-muted-foreground">Все принятые уже в сетке.</li>
            ) : null}
          </ul>
          {withSessions.length > 0 ? (
            <>
              <h3 className="mt-6 text-[length:var(--ef-text-meta)] font-extralight uppercase">
                С сеансами
              </h3>
              <ul className="mt-3 space-y-2">
                {withSessions.map((film) => (
                  <AcceptedFilmCard
                    key={film.id}
                    film={film}
                    sessionCount={sessionCountByFilm.get(film.id) ?? 0}
                    onPick={() => setPicked(film)}
                  />
                ))}
              </ul>
            </>
          ) : null}
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
          {halls.length === 0 ? (
            <EmptyHallsNotice className="mt-6" />
          ) : slots.length === 0 ? (
            <p className="mt-6 font-light text-muted-foreground">
              Добавьте даты фестиваля, чтобы собрать сетку.
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
                    onUnpublish={unpublishSession}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <CreateSessionDialog
        film={picked}
        halls={halls}
        defaultDay={day}
        onOpenChange={(open) => {
          if (!open) setPicked(null);
        }}
        onCreate={createSession}
      />
    </div>
  );
}

function EmptyHallsNotice({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-light text-muted-foreground">
        Сначала добавьте хотя бы один зал →{" "}
        <Link href="/moderator/halls" className="underline underline-offset-4">
          /moderator/halls
        </Link>
      </p>
      <Link
        href="/moderator/halls"
        className="mt-3 inline-flex h-10 items-center rounded-[var(--ef-radius-button)] border border-foreground/30 px-4 text-[length:var(--ef-text-meta)] font-light"
      >
        Добавить зал
      </Link>
    </div>
  );
}

function AcceptedFilmCard({
  film,
  sessionCount,
  onPick,
}: {
  film: ApplicationRow;
  sessionCount: number;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex w-full gap-2 border border-foreground/20 bg-background px-2 py-2 text-left hover:border-foreground/50"
      >
        <PosterImage
          src={film.thumbnail_url}
          title={film.title}
          className="h-16 w-11 shrink-0"
        />
        <span className="min-w-0">
          <span className="block truncate text-[length:var(--ef-text-meta)] font-normal">
            {film.title}
          </span>
          <span className="block font-extralight text-muted-foreground">
            {durationMin(film.duration_seconds)} мин
            <span className="sr-only"> ({formatDuration(film.duration_seconds)})</span>
          </span>
          {sessionCount > 0 ? (
            <span className="mt-1 inline-block border border-foreground/30 px-1 text-[10px] font-extralight uppercase">
              {sessionCount} сеансов
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function CreateSessionDialog({
  film,
  halls,
  defaultDay,
  onOpenChange,
  onCreate,
}: {
  film: ApplicationRow | null;
  halls: FestivalHall[];
  defaultDay: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    film: ApplicationRow,
    hallId: string,
    startMs: number
  ) => Promise<string | null>;
}) {
  const [hallId, setHallId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [overlap, setOverlap] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!film) return;
    setHallId((current) => current || halls[0]?.id || "");
    setDate(defaultDay || dateKey(new Date()));
    setTime("18:00");
    setOverlap(null);
  }, [film, halls, defaultDay]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!film || !hallId || !date || !time) return;
    const startMs = new Date(`${date}T${time}`).getTime();
    if (Number.isNaN(startMs)) {
      setOverlap("Укажите дату и время начала.");
      return;
    }
    setSaving(true);
    setOverlap(null);
    try {
      const error = await onCreate(film, hallId, startMs);
      if (error) setOverlap(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(film)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать сеанс</DialogTitle>
          <DialogDescription>
            {film
              ? `${film.title}, ${durationMin(film.duration_seconds)} мин + буфер ${BUFFER_MINUTES} мин`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="grid gap-3">
          {halls.length === 0 ? <EmptyHallsNotice /> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="session-hall">Зал</Label>
            <select
              id="session-hall"
              value={hallId}
              onChange={(event) => setHallId(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              required
              disabled={halls.length === 0}
            >
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} ({hall.capacity} мест)
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="session-date">Дата</Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="session-time">Время начала</Label>
            <Input
              id="session-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </div>
          {overlap ? <p className="text-sm text-red-500">{overlap}</p> : null}
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-light"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving || halls.length === 0} className="font-light">
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HallScheduleRow({
  hall,
  slots,
  sessions,
  onUnpublish,
}: {
  hall: FestivalHall;
  slots: number[];
  sessions: FestivalSession[];
  onUnpublish: (id: string) => void;
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
              {session.is_published ? (
                <button
                  type="button"
                  className="text-[10px] font-extralight underline"
                  onClick={() => onUnpublish(session.id)}
                >
                  Снять с публикации
                </button>
              ) : (
                <p className="text-[10px] font-extralight text-muted-foreground">Снят</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
