"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/film-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  APPLICATION_SELECT,
  parseApplicationStatus,
  STATUS_CLASS,
  STATUS_LABEL,
  type ApplicationRow,
} from "@/lib/application";
import { supabase } from "@/lib/supabase";

const LOAD_ERROR =
  "Не удалось загрузить данные. Проверьте соединение и обновите страницу.";

export function DirectorMy() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ApplicationRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("films")
          .select(APPLICATION_SELECT)
          .or(`director_id.eq.${userId},user_id.eq.${userId}`)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (queryError) {
          console.error(queryError.message);
          toast.error(LOAD_ERROR);
          setError(LOAD_ERROR);
          return;
        }
        setRows((data ?? []) as ApplicationRow[]);
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">
          Мои заявки
        </h1>
        <Button
          nativeButton={false}
          render={<Link href="/director/apply" />}
          className="h-10 rounded-[var(--ef-radius-button)] px-5 font-light"
        >
          Подать заявку
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
          Заявок пока нет.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-[length:var(--ef-text-body)]">
            <thead className="border-b border-foreground/20 font-extralight text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-extralight">Название</th>
                <th className="py-3 pr-4 font-extralight">Дата подачи</th>
                <th className="py-3 font-extralight">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = parseApplicationStatus(row.status);
                const submitted = row.submitted_at || row.created_at;
                return (
                  <tr key={row.id} className="border-b border-foreground/10">
                    <td className="py-3 pr-4">
                      <Link href={`/director/my/${row.id}`} className="hover:opacity-80">
                        {row.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-light">
                      {new Date(submitted).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3">
                      <Badge className={STATUS_CLASS[status]} variant="outline">
                        {STATUS_LABEL[status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
