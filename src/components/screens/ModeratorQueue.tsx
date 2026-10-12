"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/film-card";
import { ErrorState } from "@/components/film-grid";
import { ModeratorNav } from "@/components/moderator-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APPLICATION_GENRES,
  MODERATION_SELECT,
  parseApplicationStatus,
  STATUS_CLASS,
  STATUS_LABEL,
  type ApplicationRow,
} from "@/lib/application";
import { embedOne } from "@/lib/festival";
import { supabase } from "@/lib/supabase";

type QueueRow = ApplicationRow & {
  authors: { name: string } | { name: string }[] | null;
};

function directorOf(row: QueueRow) {
  return embedOne(row.authors)?.name || "—";
}

export function ModeratorQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("all");
  const [genre, setGenre] = useState("all");
  const [duration, setDuration] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("films")
        .select(MODERATION_SELECT)
        .in("status", ["submitted", "under_review"])
        .order("submitted_at", { ascending: true });
      if (queryError) {
        console.error(queryError.message);
        toast.error("Ошибка");
        setError("Ошибка");
        return;
      }
      setRows((data ?? []) as QueueRow[]);
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
      setError("Ошибка");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (genre !== "all" && !(row.genre ?? []).includes(genre)) return false;
      const minutes = Math.round((row.duration_seconds || 0) / 60);
      if (duration === "lte10" && minutes > 10) return false;
      if (duration === "11-20" && (minutes < 11 || minutes > 20)) return false;
      if (duration === "21-30" && (minutes < 21 || minutes > 30)) return false;
      const submitted = row.submitted_at || row.created_at;
      if (from && submitted < `${from}T00:00:00`) return false;
      if (to && submitted > `${to}T23:59:59`) return false;
      return true;
    });
  }, [rows, status, genre, duration, from, to]);

  async function markUnderReview() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setPending(true);
    try {
      const { error: updateError } = await supabase
        .from("films")
        .update({ status: "under_review" })
        .in("id", ids);
      if (updateError) {
        console.error(updateError.message);
        toast.error("Ошибка");
        return;
      }
      toast.success("Сохранено");
      await load();
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
        <Skeleton className="h-10 w-48" />
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

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <h1 className="mt-8 text-[length:var(--ef-text-section)] font-normal uppercase">
        Очередь заявок
      </h1>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-[length:var(--ef-text-meta)] font-extralight">
          Статус
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">Все</option>
            <option value="submitted">На рассмотрении</option>
            <option value="under_review">На рецензии</option>
          </select>
        </label>
        <label className="text-[length:var(--ef-text-meta)] font-extralight">
          Жанр
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">Все</option>
            {APPLICATION_GENRES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[length:var(--ef-text-meta)] font-extralight">
          Длительность
          <select
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="mt-1 block h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">Все</option>
            <option value="lte10">до 10 мин</option>
            <option value="11-20">11–20 мин</option>
            <option value="21-30">21–30 мин</option>
          </select>
        </label>
        <label className="text-[length:var(--ef-text-meta)] font-extralight">
          С
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1" />
        </label>
        <label className="text-[length:var(--ef-text-meta)] font-extralight">
          По
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1" />
        </label>
        <Button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={markUnderReview}
          className="h-10 rounded-[var(--ef-radius-button)] font-light"
        >
          Пометить под рассмотрение
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[64rem] text-left text-[length:var(--ef-text-meta)]">
          <thead className="border-b border-foreground/20 font-extralight text-muted-foreground">
            <tr>
              <th className="py-2 pr-2"> </th>
              <th className="py-2 pr-3">Постер</th>
              <th className="py-2 pr-3">Название</th>
              <th className="py-2 pr-3">Режиссёр</th>
              <th className="py-2 pr-3">Страна/год</th>
              <th className="py-2 pr-3">Длительность</th>
              <th className="py-2 pr-3">Дата подачи</th>
              <th className="py-2 pr-3">Статус</th>
              <th className="py-2">Действие</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const parsed = parseApplicationStatus(row.status);
              const year = row.release_date?.slice(0, 4) || "—";
              const country = row.themes?.[0] || "—";
              return (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-foreground/10 hover:bg-muted/30"
                  onClick={() => router.push(`/moderator/film/${row.id}`)}
                >
                  <td className="py-2 pr-2" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={(event) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        });
                      }}
                      aria-label={`Выбрать ${row.title}`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    {row.thumbnail_url ? (
                      <img src={row.thumbnail_url} alt="" className="h-14 w-10 object-cover" />
                    ) : (
                      <div className="h-14 w-10 bg-muted" />
                    )}
                  </td>
                  <td className="py-2 pr-3 font-normal">{row.title}</td>
                  <td className="py-2 pr-3 font-light">{directorOf(row)}</td>
                  <td className="py-2 pr-3 font-light">
                    {country} / {year}
                  </td>
                  <td className="py-2 pr-3 font-light">{formatDuration(row.duration_seconds)}</td>
                  <td className="py-2 pr-3 font-light">
                    {new Date(row.submitted_at || row.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge className={STATUS_CLASS[parsed]} variant="outline">
                      {STATUS_LABEL[parsed]}
                    </Badge>
                  </td>
                  <td className="py-2 font-light">Открыть</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="mt-6 font-light text-muted-foreground">В очереди пусто.</p>
        ) : null}
      </div>
    </div>
  );
}
