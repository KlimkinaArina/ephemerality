"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/film-grid";
import { TicketQr } from "@/components/ticket-qr";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  formatClock,
  formatDay,
  formatPrice,
  type FestivalSession,
  mapFestivalSession,
  SESSION_SELECT,
} from "@/lib/festival";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

type TicketRow = {
  id: string;
  seat_row: string | null;
  seat_number: string | null;
  status: string;
  session: FestivalSession | null;
};

export function Tickets() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("tickets")
          .select(`id, seat_row, seat_number, status, sessions(${SESSION_SELECT})`)
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (queryError) {
          console.error(queryError);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          return;
        }

        setTickets(
          (data ?? []).map((row) => {
            const nested = (row as { sessions?: unknown }).sessions;
            const sessionRow = Array.isArray(nested) ? nested[0] : nested;
            return {
              id: row.id,
              seat_row: row.seat_row,
              seat_number: row.seat_number,
              status: row.status,
              session: sessionRow
                ? mapFestivalSession(sessionRow as Parameters<typeof mapFestivalSession>[0])
                : null,
            };
          })
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
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
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
        Мои билеты
      </h1>
      {tickets.length === 0 ? (
        <p className="mt-8 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
          Билетов пока нет. Выберите сеанс в{" "}
          <Link href="/program" className="underline">
            программе
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-col gap-4 border border-foreground/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[length:var(--ef-text-body)] font-normal">
                  {ticket.session?.film.title ?? "Сеанс"}
                </p>
                {ticket.session ? (
                  <p className="mt-1 text-[length:var(--ef-text-meta)] font-light text-muted-foreground">
                    {formatDay(ticket.session.starts_at)} · {formatClock(ticket.session.starts_at)} ·{" "}
                    {ticket.session.hall.name}
                  </p>
                ) : null}
                <p className="mt-1 text-[length:var(--ef-text-meta)] font-light">
                  Место: ряд {ticket.seat_row}, место {ticket.seat_number}
                </p>
                <p className="mt-1 text-[length:var(--ef-text-meta)] font-light">
                  {ticket.session ? formatPrice(ticket.session.ticket_price) : null}
                  {ticket.session ? " · " : ""}
                  {ticket.status}
                </p>
                <p className="mt-1 text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
                  № {ticket.id}
                </p>
              </div>
              <TicketQr value={ticket.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
