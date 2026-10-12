"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DirectorApplicationForm } from "@/components/director-application-form";
import { ErrorState } from "@/components/film-grid";
import { Badge } from "@/components/ui/badge";
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

export function DirectorApplication({ id }: { id: string }) {
  const { user } = useAuth();
  const [row, setRow] = useState<ApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .eq("id", id)
          .or(`director_id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) {
          console.error(queryError.message);
          toast.error("Ошибка");
          setError("Ошибка");
          return;
        }
        setRow((data as ApplicationRow | null) ?? null);
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
  }, [id, user]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState description={error} />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState title="Заявка не найдена" description="Чужие заявки недоступны." />
      </div>
    );
  }

  const status = parseApplicationStatus(row.status);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-[length:var(--ef-text-meta)] font-extralight">
        <Link href="/director/my" className="hover:opacity-80">
          Мои заявки
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[length:var(--ef-text-section)] font-normal">{row.title}</h1>
        <Badge className={STATUS_CLASS[status]} variant="outline">
          {STATUS_LABEL[status]}
        </Badge>
      </div>
      {row.review_notes ? (
        <section className="mt-6 border border-foreground/20 p-4">
          <h2 className="text-[length:var(--ef-text-meta)] font-extralight uppercase">
            Заметка модератора
          </h2>
          <p className="mt-2 text-[length:var(--ef-text-body)] font-light whitespace-pre-wrap">
            {row.review_notes}
          </p>
        </section>
      ) : null}
      <div className="mt-8">
        <DirectorApplicationForm filmId={row.id} />
      </div>
    </div>
  );
}
