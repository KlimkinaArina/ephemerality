"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { supabase } from "@/lib/supabase";

const collectionSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  slug: z.string().trim().min(1, "Укажите slug"),
  curatorName: z.string().optional(),
  description: z.string().optional(),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "collection";
}

export type CollectionDraft = {
  id: string;
  slug: string;
  title: string;
  description: string;
  curator: string;
  curatorUserId: string;
};

export function CollectionFormSheet({
  open,
  collection,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  collection: CollectionDraft | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (collection: CollectionDraft) => void;
}) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: "",
      slug: "",
      curatorName: "",
      description: "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (!open) return;
    if (collection) {
      reset({
        title: collection.title,
        slug: collection.slug,
        curatorName: collection.curator,
        description: collection.description,
      });
      return;
    }
    reset({ title: "", slug: "", curatorName: "", description: "" });
  }, [open, collection, reset]);

  useEffect(() => {
    if (!open || collection) return;
    setValue("slug", slugify(title));
  }, [open, collection, title, setValue]);

  async function onSubmit(values: CollectionFormValues) {
    if (!user) {
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

    const payload = {
      title: values.title,
      slug: values.slug,
      curator_name: values.curatorName?.trim() || null,
      description: values.description?.trim() || null,
      status: "published",
      visibility: "public",
      ...(collection ? {} : { curator_user_id: user.id }),
    };

    if (collection && collection.curatorUserId !== user.id) {
      toast.error("Ошибка");
      return;
    }

    const query = collection
      ? supabase
          .from("collections")
          .update(payload)
          .eq("id", collection.id)
          .eq("curator_user_id", user.id)
      : supabase.from("collections").insert(payload);

    const { data, error } = await query
      .select("id, slug, title, description, curator_name, curator_user_id")
      .single();

    if (error || !data) {
      console.error(error);
      toast.error("Ошибка");
      return;
    }

    toast.success("Сохранено");
    onSaved({
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description ?? "",
      curator: data.curator_name ?? "Команда фестиваля",
      curatorUserId: data.curator_user_id ?? user.id,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {collection ? "Редактировать подборку" : "Новая подборка"}
          </SheetTitle>
          <SheetDescription>
            Подборка привязывается к вашему аккаунту (curator_user_id).
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 px-4"
        >
          <div className="space-y-1">
            <Label htmlFor="collection-title">Название</Label>
            <Input id="collection-title" {...register("title")} />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="collection-slug">Slug</Label>
            <Input id="collection-slug" {...register("slug")} />
            {errors.slug ? (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="collection-curator">Куратор</Label>
            <Input id="collection-curator" {...register("curatorName")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="collection-body">Описание</Label>
            <Textarea id="collection-body" rows={5} {...register("description")} />
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
