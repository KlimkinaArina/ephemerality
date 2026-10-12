"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  APPLICATION_GENRES,
  APPLICATION_SELECT,
  applicationDraftSchema,
  applicationSubmitSchema,
  emptyApplicationValues,
  formToPayload,
  isEditableStatus,
  rowToFormValues,
  type ApplicationFormValues,
  type ApplicationRow,
} from "@/lib/application";
import { ensureAuthor } from "@/lib/ensure-author";
import { slugify } from "@/lib/slug";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fieldClass =
  "h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent";

export function DirectorApplicationForm({
  filmId,
}: {
  filmId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(Boolean(filmId));
  const [existing, setExisting] = useState<ApplicationRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<"draft" | "submitted" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationDraftSchema),
    defaultValues: emptyApplicationValues,
  });

  const posterUrl = watch("poster_url");
  const synopsis = watch("synopsis");
  const readOnly = existing ? !isEditableStatus(existing.status) : false;

  useEffect(() => {
    if (!filmId || !user) return;
    const id = filmId;
    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("films")
          .select(APPLICATION_SELECT)
          .eq("id", id)
          .or(`director_id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error(error.message);
          toast.error("Ошибка");
          return;
        }
        if (!data) {
          toast.error("Заявка не найдена");
          return;
        }
        const row = data as ApplicationRow;
        setExisting(row);
        reset(rowToFormValues(row));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error("Ошибка");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filmId, user, reset]);

  async function uploadPoster(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("posters").upload(path, file, {
        upsert: false,
        contentType: file.type || "image/jpeg",
      });
      if (error) {
        console.error(error.message);
        toast.error("Не удалось загрузить постер. Проверьте bucket posters.");
        return;
      }
      const { data } = supabase.storage.from("posters").getPublicUrl(path);
      setValue("poster_url", data.publicUrl, { shouldDirty: true });
      toast.success("Сохранено");
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
    } finally {
      setUploading(false);
    }
  }

  async function save(values: ApplicationFormValues, status: "draft" | "submitted") {
    if (!user) {
      toast.error("Ошибка");
      return;
    }
    if (existing && !isEditableStatus(existing.status)) {
      toast.error("Заявку уже нельзя менять");
      return;
    }
    if (status === "submitted") {
      const parsed = applicationSubmitSchema.safeParse(values);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string") {
            setError(field as keyof ApplicationFormValues, { message: issue.message });
          }
        }
        toast.error("Заполните обязательные поля");
        return;
      }
    }

    setPending(status);
    try {
      const directorName =
        user.user_metadata?.name || user.email?.split("@")[0] || "Режиссёр";
      const { authorId, error: authorError } = await ensureAuthor(user.id, directorName);
      if (authorError || !authorId) {
        console.error(authorError?.message);
        toast.error("Ошибка");
        return;
      }

      const slug = existing?.slug ?? `${slugify(values.title)}-${user.id.slice(0, 6)}`;
      const payload = {
        ...formToPayload(values),
        author_id: authorId,
        user_id: user.id,
        director_id: user.id,
        slug,
        status,
        visibility: status === "draft" ? "private" : "unlisted",
        submitted_at:
          status === "submitted"
            ? new Date().toISOString()
            : existing?.submitted_at ?? null,
      };

      const query = existing
        ? supabase
            .from("films")
            .update(payload)
            .eq("id", existing.id)
            .or(`director_id.eq.${user.id},user_id.eq.${user.id}`)
        : supabase.from("films").insert(payload);

      const { data, error } = await query.select("id").maybeSingle();
      if (error || !data) {
        console.error(error?.message);
        toast.error(error?.message || "Ошибка");
        return;
      }

      if (status === "submitted") {
        toast.success("Письмо отправлено: заявка принята к рассмотрению");
        router.replace("/director/my");
        return;
      }

      toast.success("Сохранено");
      if (!existing) router.replace(`/director/my/${data.id}`);
      else setExisting({ ...existing, ...payload, id: existing.id } as ApplicationRow);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка");
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <p className="text-[length:var(--ef-text-body)] font-light text-muted-foreground">
        Загрузка…
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => save(values, "submitted"))}
    >
      <div className="space-y-1">
        <Label htmlFor="app-title">Название</Label>
        <Input id="app-title" className={fieldClass} disabled={readOnly} {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="app-synopsis">Синопсис</Label>
        <Textarea
          id="app-synopsis"
          rows={6}
          disabled={readOnly}
          className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
          {...register("synopsis")}
        />
        <p className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
          {synopsis.trim().length} / 100
        </p>
        {errors.synopsis ? (
          <p className="text-sm text-destructive">{errors.synopsis.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="app-duration">Длительность, мин</Label>
          <Input
            id="app-duration"
            type="number"
            min={1}
            max={30}
            className={fieldClass}
            disabled={readOnly}
            {...register("duration_min", { valueAsNumber: true })}
          />
          {errors.duration_min ? (
            <p className="text-sm text-destructive">{errors.duration_min.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="app-genre">Жанр</Label>
          <select
            id="app-genre"
            disabled={readOnly}
            className={`${fieldClass} w-full px-2.5 text-sm text-foreground`}
            {...register("genre")}
          >
            <option value="">Выберите жанр</option>
            {APPLICATION_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          {errors.genre ? <p className="text-sm text-destructive">{errors.genre.message}</p> : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="app-country">Страна</Label>
          <Input id="app-country" className={fieldClass} disabled={readOnly} {...register("country")} />
          {errors.country ? (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="app-year">Год</Label>
          <Input
            id="app-year"
            type="number"
            className={fieldClass}
            disabled={readOnly}
            {...register("year", { valueAsNumber: true })}
          />
          {errors.year ? <p className="text-sm text-destructive">{errors.year.message}</p> : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="app-language">Язык</Label>
          <Input id="app-language" className={fieldClass} disabled={readOnly} {...register("language")} />
          {errors.language ? (
            <p className="text-sm text-destructive">{errors.language.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="app-video">Ссылка на видео</Label>
          <Input
            id="app-video"
            className={fieldClass}
            disabled={readOnly}
            placeholder="YouTube, Vimeo или Google Drive"
            {...register("video_url")}
          />
          {errors.video_url ? (
            <p className="text-sm text-destructive">{errors.video_url.message}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="app-poster">Постер</Label>
        <Input
          id="app-poster"
          type="file"
          accept="image/*"
          disabled={readOnly || uploading}
          className={fieldClass}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadPoster(file);
          }}
        />
        {posterUrl ? (
          <img src={posterUrl} alt="Постер" className="mt-2 max-h-48 object-contain" />
        ) : null}
      </div>

      {readOnly ? (
        <p className="text-[length:var(--ef-text-body)] font-light text-muted-foreground">
          Заявка на рассмотрении или уже решена — правки закрыты.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(pending) || uploading}
            onClick={handleSubmit((values) => save(values, "draft"))}
            className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light hover:bg-transparent"
          >
            {pending === "draft" ? "Сохранение…" : "Сохранить черновик"}
          </Button>
          <Button
            type="submit"
            disabled={Boolean(pending) || uploading}
            className="h-12 rounded-[var(--ef-radius-button)] font-light"
          >
            {pending === "submitted" ? "Отправка…" : "Отправить заявку"}
          </Button>
        </div>
      )}
    </form>
  );
}
