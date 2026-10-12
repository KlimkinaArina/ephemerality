"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ModeratorNav } from "@/components/moderator-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { supabase } from "@/lib/supabase";

type Metrics = {
  queue: number;
  accepted: number;
  rejected: number;
  sessions: number;
  tickets: number;
};

const LINKS = [
  { href: "/moderator/queue", label: "Очередь" },
  { href: "/moderator/schedule", label: "Расписание" },
  { href: "/moderator/analytics", label: "Аналитика" },
];

export function ModeratorDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          { count: queue },
          { count: accepted },
          { count: rejected },
          { count: sessions },
          { count: tickets },
        ] = await Promise.all([
          supabase
            .from("films")
            .select("id", { count: "exact", head: true })
            .in("status", ["submitted", "under_review"]),
          supabase
            .from("films")
            .select("id", { count: "exact", head: true })
            .eq("status", "accepted"),
          supabase
            .from("films")
            .select("id", { count: "exact", head: true })
            .eq("status", "rejected"),
          supabase.from("sessions").select("id", { count: "exact", head: true }),
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .neq("status", "cancelled"),
        ]);
        if (cancelled) return;
        setMetrics({
          queue: queue ?? 0,
          accepted: accepted ?? 0,
          rejected: rejected ?? 0,
          sessions: sessions ?? 0,
          tickets: tickets ?? 0,
        });
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

  const cards = [
    { label: "Новых заявок", value: metrics?.queue },
    { label: "Принято", value: metrics?.accepted },
    { label: "Отклонено", value: metrics?.rejected },
    { label: "Сеансов в расписании", value: metrics?.sessions },
    { label: "Продано билетов", value: metrics?.tickets },
  ];

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-10 sm:px-6">
      <ModeratorNav />
      <h1 className="mt-8 text-[length:var(--ef-text-section)] font-normal uppercase">
        Модерация
      </h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="border border-foreground/20 p-4">
            <p className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-[length:var(--ef-text-section)] font-normal">
              {card.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-5 font-light"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
