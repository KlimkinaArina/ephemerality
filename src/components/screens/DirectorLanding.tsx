"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const FAQ = [
  {
    q: "Кто может подать заявку?",
    a: "Режиссёр с аккаунтом роли director. Посетитель заявку не подаёт.",
  },
  {
    q: "Какой формат видео?",
    a: "Ссылка на YouTube, Vimeo или Google Drive. Файл на сервер фестиваля не загружается.",
  },
  {
    q: "Какая длительность?",
    a: "Короткий метр до 30 минут.",
  },
  {
    q: "Когда ответ?",
    a: "Статус и заметка модератора появятся в «Мои заявки». Отдельное письмо на MVP — заглушка.",
  },
];

export function DirectorLanding() {
  const { user } = useAuth();
  const [deadline, setDeadline] = useState("старта фестиваля");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await supabase
          .from("festival_info")
          .select("starts_on")
          .eq("id", 1)
          .maybeSingle();
        if (cancelled || !data?.starts_on) return;
        setDeadline(
          new Date(`${data.starts_on}T12:00:00`).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        );
      } catch (error) {
        console.error(error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ctaHref = user
    ? "/director/apply"
    : "/signup?role=director&next=/director/apply";

  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[length:var(--ef-text-meta)] font-extralight uppercase tracking-[var(--ef-tracking-footer)]">
        Режиссёрам
      </p>
      <h1 className="mt-2 font-medium uppercase leading-none tracking-[var(--ef-tracking-display)] text-[clamp(2rem,6vw,var(--ef-text-display))]">
        Подать заявку
      </h1>
      <p className="mt-8 text-[length:var(--ef-text-section)] font-normal">
        Дедлайн приёма заявок
      </p>
      <p className="mt-2 font-medium leading-none tracking-[var(--ef-tracking-display)] text-[clamp(1.75rem,4vw,3.5rem)]">
        {deadline}
      </p>

      <section className="mt-12 space-y-4 text-[length:var(--ef-text-body)] font-light">
        <h2 className="text-[length:var(--ef-text-cta)] font-normal uppercase">
          Требования к заявке
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Жанр: игровое, документальное, анимация, эксперимент.</li>
          <li>Длительность: до 30 минут.</li>
          <li>Формат видео: ссылка YouTube / Vimeo / Google Drive.</li>
          <li>Дедлайн: до {deadline} включительно.</li>
        </ul>
      </section>

      <div className="mt-10">
        <Link
          href={ctaHref}
          className={cn(
            buttonVariants(),
            "h-12 rounded-[var(--ef-radius-button)] px-8 font-light sm:h-14"
          )}
        >
          Подать заявку
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="text-[length:var(--ef-text-cta)] font-normal uppercase">FAQ</h2>
        <div className="mt-4 divide-y divide-foreground/15 border-y border-foreground/15">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none text-[length:var(--ef-text-body)] font-normal [&::-webkit-details-marker]:hidden">
                {item.q}
              </summary>
              <p className="mt-2 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
