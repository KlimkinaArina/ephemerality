"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FILM_SELECT, FilmCard, toCatalogFilm, type CatalogFilm } from "@/components/film-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

type FestivalInfo = {
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  hero_image: string | null;
};

type SessionRow = {
  id: string;
  starts_at: string;
  film_id: string;
  films: { title: string } | { title: string }[] | null;
  halls: { name: string } | { name: string }[] | null;
};

const FALLBACK: FestivalInfo = {
  name: "Эфемерность",
  starts_on: "2026-07-10",
  ends_on: "2026-07-12",
  city: "Москва",
  address: "Москва",
  description:
    "Фестиваль короткометражного кино: три дня программы, залы и билеты на сеанс.",
  hero_image: "/brand/hero.png",
};

function firstSentence(text: string | null | undefined) {
  const raw = (text ?? FALLBACK.description ?? "").trim();
  const match = raw.match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() || raw;
}

function formatRange(start: string | null, end: string | null) {
  const from = start ? new Date(`${start}T12:00:00`) : null;
  const to = end ? new Date(`${end}T12:00:00`) : from;
  if (!from) return "";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const a = from.toLocaleDateString("ru-RU", opts);
  if (!to || from.toDateString() === to.toDateString()) return a;
  if (from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${to.toLocaleDateString("ru-RU", opts)}`;
  }
  return `${a} — ${to.toLocaleDateString("ru-RU", opts)}`;
}

function dateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

function embedName(value: { name: string } | { name: string }[] | null) {
  if (!value) return "";
  return (Array.isArray(value) ? value[0] : value)?.name ?? "";
}

function mapUrl(query: string) {
  return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(query)}&z=14`;
}

export function Landing() {
  const [info, setInfo] = useState<FestivalInfo>(FALLBACK);
  const [films, setFilms] = useState<CatalogFilm[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: festival }, { data: filmRows }, { data: sessionRows }] =
        await Promise.all([
          supabase.from("festival_info").select("*").eq("id", 1).maybeSingle(),
          supabase
            .from("films")
            .select(FILM_SELECT)
            .in("status", ["accepted", "published"])
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("sessions")
            .select("id, starts_at, film_id, films(title), halls(name)")
            .order("starts_at")
            .limit(40),
        ]);

      if (cancelled) return;
      if (festival) {
        setInfo({
          name: festival.name ?? FALLBACK.name,
          starts_on: festival.starts_on ?? FALLBACK.starts_on,
          ends_on: festival.ends_on ?? FALLBACK.ends_on,
          city: festival.city ?? FALLBACK.city,
          address: festival.address ?? festival.city ?? FALLBACK.address,
          description: festival.description ?? FALLBACK.description,
          hero_image: festival.hero_image ?? FALLBACK.hero_image,
        });
      }
      setFilms((filmRows ?? []).map(toCatalogFilm));
      setSessions((sessionRows ?? []) as SessionRow[]);
    }

    load().catch((error) => console.error(error));
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => {
    const start = info.starts_on ?? FALLBACK.starts_on ?? "2026-07-10";
    return [0, 1, 2].map((offset) => {
      const date = addDays(start, offset);
      const key = dateKey(date);
      const items = sessions
        .filter((session) => dateKey(new Date(session.starts_at)) === key)
        .slice(0, 4)
        .map((session) => ({
          id: session.id,
          time: new Date(session.starts_at).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          title: embedName(session.films) || "Фильм",
          hall: embedName(session.halls) || "Зал",
        }));
      return {
        key,
        label: `Д${offset + 1}`,
        date: date.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        }),
        items,
      };
    });
  }, [info.starts_on, sessions]);

  const todayKey = dateKey(new Date());
  const defaultDay =
    days.find((day) => day.key === todayKey)?.key ?? days[0]?.key ?? "";
  const [activeDay, setActiveDay] = useState(defaultDay);

  useEffect(() => {
    setActiveDay(defaultDay);
  }, [defaultDay]);
  const place = [info.address, info.city].filter(Boolean).join(", ") || "Москва";
  const hero = info.hero_image || "/brand/hero.png";
  const applyUntil = info.starts_on
    ? new Date(`${info.starts_on}T12:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      })
    : "старта фестиваля";

  return (
    <>
      <section className="relative bg-hero">
        <div className="mx-auto grid w-full max-w-[var(--ef-content-width)] lg:grid-cols-[minmax(0,1fr)_42%]">
          <div className="relative z-10 flex flex-col justify-center gap-5 px-4 py-12 sm:gap-6 sm:px-6 sm:py-16">
            <h1 className="font-medium uppercase leading-none tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(2rem,6vw,var(--ef-text-display))]">
              {info.name}
            </h1>
            <p className="text-[length:var(--ef-text-section)] font-normal text-foreground">
              {formatRange(info.starts_on, info.ends_on)}
              {info.city ? ` · ${info.city}` : ""}
            </p>
            <p className="max-w-lg text-[length:var(--ef-text-body)] font-light leading-normal text-foreground">
              {firstSentence(info.description)}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                render={<Link href="/program" />}
                className="h-12 rounded-[var(--ef-radius-button)] px-6 font-light sm:h-14"
              >
                Программа
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/program" />}
                className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-6 font-light hover:bg-transparent sm:h-14"
              >
                Купить билет
              </Button>
            </div>
          </div>
          <div className="relative min-h-[220px] sm:min-h-[320px] lg:min-h-[520px]">
            <img
              src={hero}
              alt=""
              className="absolute inset-0 size-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-hero from-10% to-transparent lg:bg-gradient-to-r lg:from-hero lg:from-20%" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
            Что показываем
          </h2>
          <Button
            nativeButton={false}
            variant="ghost"
            render={<Link href="/program" />}
            className="font-light"
          >
            Вся программа →
          </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {films.slice(0, 6).map((film) => (
            <FilmCard key={film.id} film={film} variant="poster" />
          ))}
        </div>
        {films.length === 0 ? (
          <p className="mt-6 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
            Программа появится здесь, как только модератор примет фильмы.
          </p>
        ) : null}
      </section>

      <section className="bg-section px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[var(--ef-content-width)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
              Расписание
            </h2>
            <Button
              nativeButton={false}
              variant="ghost"
              render={<Link href="/program" />}
              className="font-light"
            >
              Полное расписание →
            </Button>
          </div>
          <Tabs
            value={activeDay}
            onValueChange={(value) => {
              if (value) setActiveDay(value);
            }}
            className="mt-8"
          >
            <TabsList variant="line" className="h-auto gap-2 bg-transparent p-0">
              {days.map((day) => (
                <TabsTrigger
                  key={day.key}
                  value={day.key}
                  className="h-10 min-w-16 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] px-4 font-light"
                >
                  {day.label}
                  <span className="ml-2 text-muted-foreground">{day.date}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {days.map((day) => (
              <TabsContent key={day.key} value={day.key} className="mt-6">
                {day.items.length > 0 ? (
                  <ul className="divide-y divide-foreground/15">
                    {day.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/session/${item.id}`}
                          className="grid gap-1 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
                        >
                          <span className="font-medium tabular-nums">
                            {item.time}
                          </span>
                          <span className="text-[length:var(--ef-text-body)] font-light">
                            {item.title}
                          </span>
                          <span className="text-[length:var(--ef-text-meta)] font-extralight text-muted-foreground">
                            {item.hall}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
                    Сеансы на этот день появятся в полном расписании.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
          Где
        </h2>
        <p className="mt-4 text-[length:var(--ef-text-cta)] font-light">
          {info.name}
        </p>
        <p className="mt-2 max-w-xl text-[length:var(--ef-text-body)] font-light text-foreground">
          {place}
        </p>
        <div className="mt-6 overflow-hidden border border-foreground/20">
          <iframe
            title="Карта площадки"
            src={mapUrl(place)}
            className="h-[240px] w-full sm:h-[360px]"
            loading="lazy"
          />
        </div>
        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link href="/venues" />}
          className="mt-4 px-0 font-light"
        >
          Как добраться →
        </Button>
      </section>

      <section className="bg-hero px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[var(--ef-content-width)] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[length:var(--ef-text-body)] font-light">
            Приём заявок до {applyUntil}. Подать заявку может режиссёр.
          </p>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/director" />}
            className="h-11 w-fit rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light hover:bg-transparent"
          >
            Кабинет режиссёра
          </Button>
        </div>
      </section>
    </>
  );
}
