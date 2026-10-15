"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/film-card";
import { PosterImage } from "@/components/poster-image";
import { ErrorState } from "@/components/film-grid";
import { ModeratorNav } from "@/components/moderator-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  COMMENT_TEMPLATES,
  MODERATION_SELECT,
  parseApplicationStatus,
  STATUS_CLASS,
  STATUS_LABEL,
  type ApplicationRow,
} from "@/lib/application";
import { embedOne } from "@/lib/festival";
import { supabase } from "@/lib/supabase";
import { videoEmbedUrl } from "@/lib/video-embed";

type Decision = "accepted" | "submitted" | "rejected" | "waitlisted";

const DECISIONS: { value: Decision; label: string }[] = [
  { value: "accepted", label: "Принять" },
  { value: "submitted", label: "На доработку" },
  { value: "rejected", label: "Отклонить" },
  { value: "waitlisted", label: "Лист ожидания" },
];

type FilmRow = ApplicationRow & {
  authors: { name: string } | { name: string }[] | null;
};

export function ModeratorFilm({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [row, setRow] = useState<FilmRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>("accepted");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("films")
          .select(MODERATION_SELECT)
          .eq("id", id)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) {
          console.error(queryError.message);
          toast.error("Ошибка");
          setError("Ошибка");
          return;
        }
        const film = (data as FilmRow | null) ?? null;
        setRow(film);
        if (film) setNotes(film.review_notes ?? "");
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error("Ошибка");
        setError("Ошибка");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (!user || !row) return;
    if (decision === "rejected" && notes.trim().length < 3) {
      toast.error("Для отклонения нужна заметка");
      return;
    }
    setPending(true);
    try {
      const { error: updateError } = await supabase
        .from("films")
        .update({
          status: decision,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes.trim() || null,
          visibility: decision === "accepted" ? "public" : row.visibility,
        })
        .eq("id", row.id);
      if (updateError) {
        console.error(updateError.message);
        toast.error("Ошибка");
        return;
      }
      toast.success("Сохранено");
      router.push("/moderator/queue");
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
        <ErrorState title="Заявка не найдена" description={error ?? ""} />
      </div>
    );
  }

  const status = parseApplicationStatus(row.status);
  const embed = videoEmbedUrl(row.video_url);
  const director = embedOne(row.authors)?.name || "—";

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <p className="mt-6 text-[length:var(--ef-text-meta)] font-extralight">
        <Link href="/moderator/queue" className="hover:opacity-80">
          Очередь
        </Link>
      </p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[length:var(--ef-text-section)] font-normal">{row.title}</h1>
            <Badge className={STATUS_CLASS[status]} variant="outline">
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          <PosterImage
            src={row.thumbnail_url}
            title={row.title}
            className="mt-6 max-h-72 min-h-40 w-full max-w-sm"
            imgClassName="max-h-72 w-full object-contain"
          />
          {embed ? (
            <iframe
              title="Видео заявки"
              src={embed}
              className="mt-6 aspect-video w-full border border-foreground/20"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : row.video_url ? (
            <p className="mt-6 font-light">
              <a href={row.video_url} className="underline" target="_blank" rel="noreferrer">
                {row.video_url}
              </a>
            </p>
          ) : (
            <p className="mt-6 font-light text-muted-foreground">Ссылка на видео не указана.</p>
          )}
          <dl className="mt-8 grid gap-4 text-[length:var(--ef-text-body)] sm:grid-cols-2">
            <div>
              <dt className="font-extralight text-muted-foreground">Режиссёр</dt>
              <dd>{director}</dd>
            </div>
            <div>
              <dt className="font-extralight text-muted-foreground">Жанр</dt>
              <dd>{row.genre?.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="font-extralight text-muted-foreground">Страна</dt>
              <dd>{row.themes?.[0] || "—"}</dd>
            </div>
            <div>
              <dt className="font-extralight text-muted-foreground">Год</dt>
              <dd>{row.release_date?.slice(0, 4) || "—"}</dd>
            </div>
            <div>
              <dt className="font-extralight text-muted-foreground">Язык</dt>
              <dd>{row.moods?.[0] || "—"}</dd>
            </div>
            <div>
              <dt className="font-extralight text-muted-foreground">Длительность</dt>
              <dd>{formatDuration(row.duration_seconds)}</dd>
            </div>
          </dl>
          <h2 className="mt-8 text-[length:var(--ef-text-body)] font-normal uppercase">Синопсис</h2>
          <p className="mt-2 whitespace-pre-wrap font-light leading-normal">
            {row.description || "—"}
          </p>
        </article>
        <aside className="border border-foreground/20 p-4">
          <h2 className="text-[length:var(--ef-text-body)] font-normal uppercase">Решение</h2>
          <fieldset className="mt-4 space-y-2">
            {DECISIONS.map((item) => (
              <label key={item.value} className="flex cursor-pointer items-center gap-2 font-light">
                <input
                  type="radio"
                  name="decision"
                  value={item.value}
                  checked={decision === item.value}
                  onChange={() => setDecision(item.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <div className="mt-4 space-y-1">
            <Label htmlFor="template">Шаблон комментария</Label>
            <select
              id="template"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) setNotes(event.target.value);
              }}
            >
              <option value="">Выбрать шаблон</option>
              {COMMENT_TEMPLATES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 space-y-1">
            <Label htmlFor="notes">Заметка режиссёру</Label>
            <Textarea
              id="notes"
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
            />
            {decision === "rejected" ? (
              <p className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
                Обязательно при отклонении.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={save}
            className="mt-6 h-11 w-full rounded-[var(--ef-radius-button)] font-light"
          >
            {pending ? "Сохранение…" : "Сохранить решение"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
