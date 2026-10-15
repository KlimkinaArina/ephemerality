"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
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
import { supabase } from "@/lib/supabase";

const HALL_SELECT = "id, name, address, capacity, seat_map_url" as const;

type HallRow = {
  id: string;
  name: string;
  address: string | null;
  capacity: number;
  seat_map_url: string | null;
};

const schema = z.object({
  name: z.string().trim().min(1, "Укажите название"),
  address: z.string().trim().optional(),
  capacity: z.number().int().min(1, "Минимум 1 место"),
  seat_map_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "Укажите ссылку http(s) или оставьте пустым"
    ),
});

type Values = z.infer<typeof schema>;

export function ModeratorHalls() {
  const [halls, setHalls] = useState<HallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HallRow | null>(null);
  const [deleting, setDeleting] = useState<HallRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("halls")
        .select(HALL_SELECT)
        .order("name");
      if (error) {
        console.error(error.message);
        toast.error("Ошибка");
        return;
      }
      setHalls((data ?? []) as HallRow[]);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(hall: HallRow) {
    setEditing(hall);
    setFormOpen(true);
  }

  async function removeHall() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      const { error } = await supabase.from("halls").delete().eq("id", deleting.id);
      if (error) {
        console.error(error.message);
        toast.error(
          error.code === "23503"
            ? "Нельзя удалить зал, пока к нему привязаны сеансы"
            : error.message || "Ошибка"
        );
        return;
      }
      toast.success("Сохранено");
      setDeleting(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">Залы</h1>
        <Button
          type="button"
          onClick={openCreate}
          className="h-10 rounded-[var(--ef-radius-button)] font-light"
        >
          Добавить зал
        </Button>
      </div>

      {loading ? (
        <p className="mt-8 font-light text-muted-foreground">Загрузка…</p>
      ) : halls.length === 0 ? (
        <p className="mt-8 font-light text-muted-foreground">
          Залов пока нет. Добавьте хотя бы один, чтобы собрать расписание.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-[length:var(--ef-text-body)]">
            <thead>
              <tr className="border-b border-foreground/20 font-extralight text-muted-foreground">
                <th className="py-3 pr-4 font-extralight">Название</th>
                <th className="py-3 pr-4 font-extralight">Адрес</th>
                <th className="py-3 pr-4 font-extralight">Вместимость</th>
                <th className="py-3 font-extralight"> </th>
              </tr>
            </thead>
            <tbody>
              {halls.map((hall) => (
                <tr key={hall.id} className="border-b border-foreground/10">
                  <td className="py-3 pr-4 font-normal">{hall.name}</td>
                  <td className="py-3 pr-4 font-light">{hall.address || "—"}</td>
                  <td className="py-3 pr-4 font-light">{hall.capacity}</td>
                  <td className="py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openEdit(hall)}
                      className="font-extralight"
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDeleting(hall)}
                      className="font-extralight"
                    >
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <HallFormDialog
        open={formOpen}
        hall={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={load}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Удалить зал?"
        description={
          deleting
            ? `«${deleting.name}» исчезнет из расписания. Сеансы в этом зале нужно убрать заранее.`
            : ""
        }
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void removeHall()}
      />
    </div>
  );
}

function HallFormDialog({
  open,
  hall,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  hall: HallRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", address: "", capacity: 80, seat_map_url: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: hall?.name ?? "",
      address: hall?.address ?? "",
      capacity: hall?.capacity ?? 80,
      seat_map_url: hall?.seat_map_url ?? "",
    });
  }, [open, hall, reset]);

  async function onSubmit(values: Values) {
    const payload = {
      name: values.name,
      address: values.address?.trim() || null,
      capacity: values.capacity,
      seat_map_url: values.seat_map_url?.trim() || null,
    };
    try {
      const query = hall
        ? supabase.from("halls").update(payload).eq("id", hall.id)
        : supabase.from("halls").insert(payload);
      const { error } = await query;
      if (error) {
        console.error(error.message);
        toast.error(error.message || "Ошибка");
        return;
      }
      toast.success("Сохранено");
      onOpenChange(false);
      await onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hall ? "Изменить зал" : "Добавить зал"}</DialogTitle>
          <DialogDescription>
            Название и вместимость нужны для сетки сеансов.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="hall-name">Название</Label>
            <Input id="hall-name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hall-address">Адрес</Label>
            <Input id="hall-address" {...register("address")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hall-capacity">Вместимость</Label>
            <Input
              id="hall-capacity"
              type="number"
              min={1}
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity ? (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hall-map">Схема зала (URL, необязательно)</Label>
            <Input id="hall-map" type="url" placeholder="https://" {...register("seat_map_url")} />
            {errors.seat_map_url ? (
              <p className="text-sm text-red-500">{errors.seat_map_url.message}</p>
            ) : null}
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-light"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-light">
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
