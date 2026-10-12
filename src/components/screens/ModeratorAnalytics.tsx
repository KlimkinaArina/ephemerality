"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModeratorNav } from "@/components/moderator-nav";
import { dateKey, SESSION_SELECT, mapFestivalSession, type FestivalSession } from "@/lib/festival";
import { supabase } from "@/lib/supabase";

type TicketRow = {
  id: string;
  status: string;
  created_at: string;
  session_id: string;
};

export function ModeratorAnalytics() {
  const [sessions, setSessions] = useState<FestivalSession[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ data: sessionRows, error: sessionError }, { data: ticketRows, error: ticketError }] =
          await Promise.all([
            supabase.from("sessions").select(SESSION_SELECT).order("starts_at"),
            supabase
              .from("tickets")
              .select("id, status, created_at, session_id")
              .neq("status", "cancelled"),
          ]);
        if (cancelled) return;
        if (sessionError || ticketError) {
          console.error(sessionError?.message || ticketError?.message);
          toast.error("Ошибка");
          return;
        }
        setSessions(
          (sessionRows ?? [])
            .map((row) => mapFestivalSession(row as Parameters<typeof mapFestivalSession>[0]))
            .filter((row): row is FestivalSession => Boolean(row))
        );
        setTickets((ticketRows ?? []) as TicketRow[]);
      } catch (error) {
        console.error(error);
        toast.error("Ошибка");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const salesByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const ticket of tickets) {
      const session = sessions.find((item) => item.id === ticket.session_id);
      const key = dateKey(new Date(session?.starts_at ?? ticket.created_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tickets, sessions]);

  const occupancy = useMemo(() => {
    const byHall = new Map<string, { name: string; sold: number; capacity: number }>();
    for (const session of sessions) {
      const current = byHall.get(session.hall_id) ?? {
        name: session.hall.name,
        sold: 0,
        capacity: 0,
      };
      current.capacity += session.capacity;
      current.sold += tickets.filter((ticket) => ticket.session_id === session.id).length;
      byHall.set(session.hall_id, current);
    }
    return [...byHall.values()];
  }, [sessions, tickets]);

  const topFilms = useMemo(() => {
    const map = new Map<string, { title: string; sold: number }>();
    for (const session of sessions) {
      const current = map.get(session.film_id) ?? { title: session.film.title, sold: 0 };
      current.sold += tickets.filter((ticket) => ticket.session_id === session.id).length;
      map.set(session.film_id, current);
    }
    return [...map.values()].sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [sessions, tickets]);

  const maxSales = Math.max(1, ...salesByDay.map(([, count]) => count));

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <h1 className="mt-8 text-[length:var(--ef-text-section)] font-normal uppercase">
        Аналитика
      </h1>
      <section className="mt-10">
        <h2 className="text-[length:var(--ef-text-body)] font-normal uppercase">
          Продажи билетов по дням
        </h2>
        {salesByDay.length === 0 ? (
          <p className="mt-4 font-light text-muted-foreground">Продаж пока нет.</p>
        ) : (
          <div className="mt-6 flex h-48 items-end gap-3">
            {salesByDay.map(([day, count]) => (
              <div key={day} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full bg-primary"
                  style={{ height: `${Math.max(8, (count / maxSales) * 100)}%` }}
                  title={`${count}`}
                />
                <span className="text-[length:var(--ef-text-meta)] font-extralight">
                  {new Date(`${day}T12:00:00`).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="text-[length:var(--ef-text-meta)]">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-[length:var(--ef-text-body)] font-normal uppercase">
          Заполняемость залов
        </h2>
        <table className="mt-4 w-full text-left text-[length:var(--ef-text-body)]">
          <thead className="border-b border-foreground/20 font-extralight text-muted-foreground">
            <tr>
              <th className="py-2 font-extralight">Зал</th>
              <th className="py-2 font-extralight">Продано</th>
              <th className="py-2 font-extralight">Вместимость</th>
              <th className="py-2 font-extralight">%</th>
            </tr>
          </thead>
          <tbody>
            {occupancy.map((row) => (
              <tr key={row.name} className="border-b border-foreground/10">
                <td className="py-2">{row.name}</td>
                <td className="py-2 font-light">{row.sold}</td>
                <td className="py-2 font-light">{row.capacity}</td>
                <td className="py-2 font-light">
                  {row.capacity ? Math.round((row.sold / row.capacity) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {occupancy.length === 0 ? (
          <p className="mt-4 font-light text-muted-foreground">Сеансов нет.</p>
        ) : null}
      </section>
      <section className="mt-12">
        <h2 className="text-[length:var(--ef-text-body)] font-normal uppercase">
          Топ-5 фильмов по продажам
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 font-light">
          {topFilms.map((film) => (
            <li key={film.title}>
              {film.title} — {film.sold}
            </li>
          ))}
        </ol>
        {topFilms.length === 0 ? (
          <p className="mt-4 font-light text-muted-foreground">Данных нет.</p>
        ) : null}
      </section>
    </div>
  );
}
