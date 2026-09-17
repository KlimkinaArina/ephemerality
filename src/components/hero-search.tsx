"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const durations = ["5", "10", "15", "30"];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [minutes, setMinutes] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (minutes) params.set("minutes", minutes);
    const suffix = params.toString();
    router.push(suffix ? `/search?${suffix}` : "/search");
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">
          Короткий метр под ваше время
        </p>
        <h1 className="text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
          Есть 10 минут? Посмотрите кино на 10 минут.
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          Выберите, сколько у вас есть — мы подберём короткометражный фильм,
          который можно посмотреть прямо сейчас.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название, автор, настроение"
          className="h-12 rounded-md border-border bg-card px-4 text-base"
          aria-label="Поиск по каталогу"
        />
        <div className="flex flex-wrap items-center gap-2">
          {durations.map((value) => (
            <Button
              key={value}
              type="button"
              variant={minutes === value ? "default" : "outline"}
              onClick={() =>
                setMinutes((current) => (current === value ? null : value))
              }
            >
              {value} мин
            </Button>
          ))}
          <Button type="submit" className="ml-auto">
            Искать
          </Button>
        </div>
      </form>
    </section>
  );
}
