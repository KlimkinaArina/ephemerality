"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  FILM_SELECT,
  isFilmOwner,
  toCatalogFilm,
  type CatalogFilm,
} from "@/components/film-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/slug";
import { supabase } from "@/lib/supabase";

const filmSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  slug: z.string().trim().min(1, "Укажите slug"),
  authorName: z.string().trim().min(1, "Укажите автора"),
  durationMinutes: z.number().int().min(1, "Минимум 1 минута").max(180),
  description: z.string().optional(),
  moods: z.string().optional(),
  themes: z.string().optional(),
  thumbnailUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.string().url().safeParse(value).success,
      "Нужен полный URL"
    ),
});

type FilmFormValues = z.infer<typeof filmSchema>;

function splitTags(value?: string) {
  return (value ?? "")
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const emptyValues: FilmFormValues = {
  title: "",
  slug: "",
  authorName: "",
  durationMinutes: 10,
  description: "",
  moods: "",
  themes: "",
  thumbnailUrl: "",
};

export function FilmFormSheet({
  open,
  film,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  film: CatalogFilm | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (film: CatalogFilm) => void;
}) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FilmFormValues>({
    resolver: zodResolver(filmSchema),
    defaultValues: emptyValues,
  });

  const title = watch("title");

  useEffect(() => {
    if (!open) return;
    if (film) {
      reset({
        title: film.title,
        slug: film.slug,
        authorName: film.author === "Автор неизвестен" ? "" : film.author,
        durationMinutes: Math.max(1, Math.round(film.durationSeconds / 60)),
        description: film.synopsis,
        moods: film.moods.join(", "),
        themes: film.themes.join(", "),
        thumbnailUrl: film.thumbnailUrl ?? "",
      });
      return;
    }
    reset(emptyValues);
  }, [open, film, reset]);

  useEffect(() => {
    if (!open || film) return;
    setValue("slug", slugify(title));
  }, [open, film, title, setValue]);

  async function onSubmit(values: FilmFormValues) {
    if (!user) {
      toast.error("Ошибка");
      return;
    }
    if (film && !isFilmOwner(film, user.id)) {
      toast.error("Ошибка");
      return;
    }

    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        last_platform: "web",
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error(profileError);
      toast.error(profileError.message || "Ошибка");
      return;
    }

    const authorSlug = slugify(values.authorName);
    const { data: existingAuthor, error: authorLookupError } = await supabase
      .from("authors")
      .select("id, name")
      .eq("slug", authorSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (authorLookupError) {
      console.error(authorLookupError);
      toast.error("Ошибка");
      return;
    }

    let authorId = existingAuthor?.id;
    let authorName = existingAuthor?.name ?? values.authorName;

    if (!authorId) {
      const insertAuthor = (slug: string) =>
        supabase
          .from("authors")
          .insert({ name: values.authorName, slug, user_id: user.id })
          .select("id, name")
          .single();

      let { data: createdAuthor, error: authorInsertError } =
        await insertAuthor(authorSlug);
      if (authorInsertError) {
        const retry = await insertAuthor(`${authorSlug}-${user.id.slice(0, 8)}`);
        createdAuthor = retry.data;
        authorInsertError = retry.error;
      }

      if (authorInsertError || !createdAuthor) {
        console.error(authorInsertError);
        toast.error(authorInsertError?.message || "Ошибка");
        return;
      }
      authorId = createdAuthor.id;
      authorName = createdAuthor.name;
    }

    const payload = {
      author_id: authorId,
      user_id: user.id,
      title: values.title,
      slug: values.slug,
      description: values.description?.trim() || null,
      duration_seconds: values.durationMinutes * 60,
      moods: splitTags(values.moods),
      themes: splitTags(values.themes),
      thumbnail_url: values.thumbnailUrl?.trim() || null,
      status: "published",
      visibility: "public",
    };

    const query = film
      ? supabase
          .from("films")
          .update(payload)
          .eq("id", film.id)
          .eq("user_id", user.id)
      : supabase.from("films").insert(payload);

    const { data, error } = await query.select(FILM_SELECT).single();

    if (error || !data) {
      console.error(error);
      toast.error(error?.message || "Ошибка");
      return;
    }

    toast.success("Сохранено");
    onSaved(
      toCatalogFilm({
        ...data,
        authors: { id: authorId, name: authorName, user_id: user.id },
      })
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{film ? "Редактировать фильм" : "Новый фильм"}</SheetTitle>
          <SheetDescription>
            Фильм принадлежит только вашему аккаунту. Другие пользователи его не изменят.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 px-4"
        >
          <div className="space-y-1">
            <Label htmlFor="film-title">Название</Label>
            <Input id="film-title" {...register("title")} />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-slug">Slug</Label>
            <Input id="film-slug" {...register("slug")} />
            {errors.slug ? (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-author">Автор / режиссёр</Label>
            <Input id="film-author" {...register("authorName")} />
            {errors.authorName ? (
              <p className="text-sm text-destructive">
                {errors.authorName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-duration">Длительность, мин</Label>
            <Input
              id="film-duration"
              type="number"
              min={1}
              max={180}
              {...register("durationMinutes", { valueAsNumber: true })}
            />
            {errors.durationMinutes ? (
              <p className="text-sm text-destructive">
                {errors.durationMinutes.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-moods">Настроения через запятую</Label>
            <Input id="film-moods" {...register("moods")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-themes">Темы через запятую</Label>
            <Input id="film-themes" {...register("themes")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-thumb">Постер (URL)</Label>
            <Input id="film-thumb" {...register("thumbnailUrl")} />
            {errors.thumbnailUrl ? (
              <p className="text-sm text-destructive">
                {errors.thumbnailUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="film-body">Описание</Label>
            <Textarea id="film-body" rows={5} {...register("description")} />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение…" : "Сохранить"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
