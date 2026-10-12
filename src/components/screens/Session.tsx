"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/film-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatClock,
  formatDay,
  formatPrice,
  mapFestivalSession,
  SEAT_COLS,
  SEAT_ROWS,
  seatKey,
  SESSION_SELECT,
  type FestivalSession,
} from "@/lib/festival";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

export function Session({ id }: { id: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<FestivalSession | null>(null);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: sessionError }, { data: ticketRows, error: ticketError }] =
        await Promise.all([
          supabase.from("sessions").select(SESSION_SELECT).eq("id", id).maybeSingle(),
          supabase
            .from("tickets")
            .select("seat_row, seat_number, status")
            .eq("session_id", id)
            .neq("status", "cancelled"),
        ]);

      if (sessionError || ticketError) {
        console.error(sessionError?.message || ticketError?.message);
        toast.error(LOAD_ERROR);
        setError(LOAD_ERROR);
        setSession(null);
        return;
      }
      if (!data) {
        setSession(null);
        return;
      }
      const mapped = mapFestivalSession(data as Parameters<typeof mapFestivalSession>[0]);
      setSession(mapped);
      const next = new Set<string>();
      for (const ticket of ticketRows ?? []) {
        if (ticket.seat_row && ticket.seat_number) {
          next.add(`${ticket.seat_row}:${ticket.seat_number}`);
        }
      }
      setTaken(next);
    } catch (err) {
      console.error(err);
      toast.error(LOAD_ERROR);
      setError(LOAD_ERROR);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const capacity = session?.capacity ?? 0;
  const seatLimit = Math.min(Math.max(capacity, 0), SEAT_ROWS * SEAT_COLS);
  const freeCount = useMemo(() => {
    let free = 0;
    for (let row = 1; row <= SEAT_ROWS; row += 1) {
      for (let seat = 1; seat <= SEAT_COLS; seat += 1) {
        const index = (row - 1) * SEAT_COLS + seat;
        if (index > seatLimit) continue;
        if (!taken.has(seatKey(row, seat))) free += 1;
      }
    }
    return free;
  }, [seatLimit, taken]);

  async function onReserve() {
    if (!session || !selected) return;
    const [row, seat] = selected.split(":");
    setPending(true);
    try {
      const { data, error: insertError } = await supabase
        .from("tickets")
        .insert({
          session_id: session.id,
          user_id: user?.id ?? null,
          seat_row: row,
          seat_number: seat,
          status: "reserved",
        })
        .select("id")
        .single();

      if (insertError || !data) {
        console.error(insertError);
        toast.error("Ошибка");
        await load();
        return;
      }
      toast.success("Сохранено");
      setBookedId(data.id);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-64 w-full" />
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

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
        <ErrorState title="Сеанс не найден" description="Проверьте ссылку или вернитесь в программу." />
      </div>
    );
  }

  if (bookedId) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
        <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">
          Спасибо
        </h1>
        <p className="mt-4 text-[length:var(--ef-text-body)] font-light">
          Билет забронирован. Номер билета: {bookedId}
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/tickets" />}
          className="mt-8 h-12 rounded-[var(--ef-radius-button)] px-6 font-light"
        >
          Мои билеты
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <p className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
        <Link href="/program" className="hover:opacity-80">
          Программа
        </Link>
      </p>
      <h1 className="mt-2 text-[length:var(--ef-text-section)] font-normal">
        {session.film.title}
      </h1>
      <dl className="mt-6 grid gap-3 text-[length:var(--ef-text-body)] font-light sm:grid-cols-2">
        <div>
          <dt className="font-extralight text-muted-foreground">Дата</dt>
          <dd>{formatDay(session.starts_at)}</dd>
        </div>
        <div>
          <dt className="font-extralight text-muted-foreground">Время</dt>
          <dd>
            {formatClock(session.starts_at)}–{formatClock(session.ends_at)}
          </dd>
        </div>
        <div>
          <dt className="font-extralight text-muted-foreground">Зал</dt>
          <dd>{session.hall.name}</dd>
        </div>
        <div>
          <dt className="font-extralight text-muted-foreground">Адрес</dt>
          <dd>{session.hall.address || "—"}</dd>
        </div>
      </dl>

      <h2 className="mt-10 text-[length:var(--ef-text-body)] font-normal uppercase">
        Схема зала
      </h2>
      {freeCount === 0 ? (
        <p className="mt-6 text-[length:var(--ef-text-body)] font-light">Мест нет</p>
      ) : (
        <>
          <div className="mt-6 inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${SEAT_COLS}, 2rem)` }}>
            {Array.from({ length: SEAT_ROWS * SEAT_COLS }, (_, index) => {
              const row = Math.floor(index / SEAT_COLS) + 1;
              const seat = (index % SEAT_COLS) + 1;
              const key = seatKey(row, seat);
                  const beyond = (row - 1) * SEAT_COLS + seat > seatLimit;
              const disabled = beyond || taken.has(key);
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(key)}
                  aria-pressed={active}
                  aria-label={`Ряд ${row}, место ${seat}`}
                  className={`size-8 rounded-[4px] border text-[10px] ${
                    disabled
                      ? "cursor-not-allowed border-foreground/10 bg-muted text-muted-foreground"
                      : active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/40 bg-background hover:bg-muted"
                  }`}
                >
                  {seat}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
            Ряды сверху вниз, места 1–{SEAT_COLS} слева направо.
          </p>
          <Button
            type="button"
            disabled={!selected || pending}
            onClick={onReserve}
            className="mt-8 h-12 rounded-[var(--ef-radius-button)] px-6 font-light"
          >
            {pending
              ? "Бронирование…"
              : `Забронировать за ${formatPrice(session.ticket_price)}`}
          </Button>
        </>
      )}
    </div>
  );
}
