"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  CollectionFormSheet,
  type CollectionDraft,
} from "@/components/collection-form-sheet";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FILM_SELECT, toCatalogFilm, type CatalogFilm } from "@/components/film-card";
import { ErrorState, FilmGrid } from "@/components/film-grid";
import { FilmRowActions } from "@/components/film-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

const addFilmSchema = z.object({
  filmId: z.string().min(1, "Выберите фильм"),
});

type CollectionRecord = CollectionDraft & {
  films: CatalogFilm[];
};

export function Collection({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [collection, setCollection] = useState<CollectionRecord | null>(null);
  const [catalog, setCatalog] = useState<CatalogFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [removing, setRemoving] = useState<CatalogFilm | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ filmId: string }>({
    resolver: zodResolver(addFilmSchema),
    defaultValues: { filmId: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [{ data, error: queryError }, { data: filmsData, error: filmsError }] =
          await Promise.all([
            supabase
              .from("collections")
              .select(
                `
            id,
            slug,
            title,
            description,
            curator_name,
            curator_user_id,
            collection_films (
              position,
              films (
                ${FILM_SELECT}
              )
            )
          `
              )
              .eq("slug", slug)
              .maybeSingle(),
            supabase
              .from("films")
              .select(FILM_SELECT)
              .eq("status", "published")
              .eq("visibility", "public")
              .order("title"),
          ]);

        if (cancelled) return;
        if (queryError || filmsError) {
          console.error(queryError ?? filmsError);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          setCollection(null);
          return;
        }
        setCatalog((filmsData ?? []).map(toCatalogFilm));
        if (!data) {
          setCollection(null);
          return;
        }

        const links = [...(data.collection_films ?? [])].sort(
          (a, b) => a.position - b.position
        );
        const films = links.flatMap((link) => {
          const row = link.films;
          const filmRow = Array.isArray(row) ? row[0] : row;
          if (!filmRow) return [];
          return [toCatalogFilm(filmRow)];
        });

        setCollection({
          id: data.id,
          slug: data.slug,
          title: data.title,
          description: data.description ?? "",
          curator: data.curator_name ?? "Команда фестиваля",
          curatorUserId: data.curator_user_id ?? "",
          films,
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(LOAD_ERROR);
        setError(LOAD_ERROR);
        setCollection(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const availableFilms = useMemo(() => {
    const used = new Set(collection?.films.map((film) => film.id) ?? []);
    return catalog.filter((film) => !used.has(film.id));
  }, [catalog, collection]);

  const isCurator = Boolean(
    user && collection?.curatorUserId && collection.curatorUserId === user.id
  );

  async function onAddFilm(values: { filmId: string }) {
    if (!collection || !user || !isCurator) return;
    const { error: insertError } = await supabase.from("collection_films").insert({
      collection_id: collection.id,
      film_id: values.filmId,
      position: collection.films.length,
    });
    if (insertError) {
      console.error(insertError);
      toast.error("Ошибка");
      return;
    }
    const added = catalog.find((film) => film.id === values.filmId);
    if (added) {
      setCollection({ ...collection, films: [...collection.films, added] });
    }
    toast.success("Сохранено");
    reset({ filmId: "" });
    setAddOpen(false);
  }

  if (loading) {
    return (
      <div className="pt-10">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 sm:px-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-16 w-full max-w-2xl" />
        </div>
        <div className="mt-10">
          <FilmGrid title="Программа" films={[]} loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <ErrorState description={error} />
      </div>
    );
  }

  if (!collection) {
    notFound();
  }

  return (
    <div className="pt-10">
      <header className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Badge variant="outline">Подборка</Badge>
        <h1 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {collection.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          {collection.description}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Куратор — {collection.curator}
        </p>
        {isCurator ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setEditOpen(true)}>
              Изменить
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
              Добавить фильм
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(true)}>
              Удалить подборку
            </Button>
          </div>
        ) : null}
      </header>
      <div className="mt-10">
        <FilmGrid
          title="Программа"
          films={collection.films}
          emptyLabel="В этой подборке пока нет фильмов"
          action={{ href: "/catalog", label: "Весь каталог" }}
          renderActions={
            isCurator
              ? (film) => (
                  <FilmRowActions
                    deleteLabel="Убрать"
                    onDelete={() => setRemoving(film)}
                  />
                )
              : undefined
          }
        />
      </div>
      <CollectionFormSheet
        open={editOpen}
        collection={collection}
        onOpenChange={setEditOpen}
        onSaved={(saved) => {
          setCollection({ ...collection, ...saved });
          if (saved.slug !== slug) router.replace(`/collection/${saved.slug}`);
        }}
      />
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Фильм в подборку</SheetTitle>
            <SheetDescription>
              Связь collection_films, без удаления самого фильма.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onAddFilm)}
            className="flex flex-col gap-4 px-4"
          >
            <div className="space-y-1">
              <Label htmlFor="collection-film">Фильм</Label>
              <select
                id="collection-film"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                {...register("filmId")}
              >
                <option value="">Выберите фильм</option>
                {availableFilms.map((film) => (
                  <option key={film.id} value={film.id}>
                    {film.title}
                  </option>
                ))}
              </select>
              {errors.filmId ? (
                <p className="text-sm text-destructive">{errors.filmId.message}</p>
              ) : null}
            </div>
            <SheetFooter className="px-0">
              <Button type="submit" disabled={isSubmitting || availableFilms.length === 0}>
                {isSubmitting ? "Сохранение…" : "Сохранить"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Удалить подборку?"
        description="Программа исчезнет. Фильмы в каталоге останутся."
        pending={deletePending}
        onOpenChange={setDeleteOpen}
        onConfirm={async () => {
          if (!user || !isCurator) return;
          setDeletePending(true);
          const { data: deleted, error: deleteError } = await supabase
            .from("collections")
            .delete()
            .eq("id", collection.id)
            .eq("curator_user_id", user.id)
            .select("id");
          setDeletePending(false);
          if (deleteError || !deleted?.length) {
            console.error(deleteError);
            toast.error("Ошибка");
            return;
          }
          toast.success("Сохранено");
          router.push("/catalog");
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(removing)}
        title="Убрать фильм из подборки?"
        description="Сам фильм в каталоге останется."
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        onConfirm={async () => {
          if (!removing || !user || !isCurator) return;
          const { data: deleted, error: deleteError } = await supabase
            .from("collection_films")
            .delete()
            .eq("collection_id", collection.id)
            .eq("film_id", removing.id)
            .select("film_id");
          if (deleteError || !deleted?.length) {
            console.error(deleteError);
            toast.error("Ошибка");
            return;
          }
          toast.success("Сохранено");
          setCollection({
            ...collection,
            films: collection.films.filter((item) => item.id !== removing.id),
          });
          setRemoving(null);
        }}
      />
    </div>
  );
}
