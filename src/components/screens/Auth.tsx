"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const tickets = [
  {
    id: "regular",
    title: "Обычный",
    description: "Доступ ко всем показам",
    price: "1 200",
  },
  {
    id: "student",
    title: "Студенческий",
    description: "При предъявлении студенческого билета",
    price: "800",
  },
  {
    id: "concession",
    title: "Льготный",
    description: "Для школьников, пенсионеров и других",
    price: "600",
  },
  {
    id: "vip",
    title: "VIP",
    description: "Доступ к закрытым показам и встречам с режисерами",
    price: "2 500",
  },
];

export function Auth() {
  const router = useRouter();
  const [ticket, setTicket] = useState("student");

  return (
    <section className="flex justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="relative w-full max-w-[996px] overflow-hidden rounded-[var(--ef-radius-modal)] border border-foreground bg-auth">
        <Link
          href="/"
          className="absolute right-5 top-5 flex size-8 items-center justify-center"
          aria-label="Закрыть"
        >
          <img
            src="/brand/close.svg"
            alt=""
            width={17.7071}
            height={17.7071}
          />
        </Link>

        <div className="grid gap-10 p-8 lg:grid-cols-[425px_auto_minmax(0,1fr)] lg:gap-8 lg:p-8">
          <div>
            <img
              src="/brand/ticket-still.png"
              alt=""
              className="h-[287px] w-full object-cover object-bottom"
            />
            <h1 className="mt-8 font-medium uppercase leading-normal tracking-[var(--ef-tracking-ticket)] text-[length:var(--ef-text-ticket)] text-foreground">
              Билеты
              <br />
              на фестиваль
            </h1>
            <p className="mt-10 text-[length:var(--ef-text-body)] font-normal leading-normal text-foreground">
              Фестиваль “Эфемерность” - это 4 дня короткометражных фильмов,
              встреч с звездами и обсуждений.
            </p>
            <p className="mt-8 flex items-center gap-4 text-[length:var(--ef-text-body)]">
              <img
                src="/brand/icon-calendar.png"
                alt=""
                className="h-[27px] w-6 object-contain"
              />
              10 - 13 июля
            </p>
            <p className="mt-6 flex items-center gap-4 text-[length:var(--ef-text-body)]">
              <img
                src="/brand/icon-pin.png"
                alt=""
                className="h-[27px] w-[19px] object-contain"
              />
              Москва
            </p>
          </div>

          <div className="hidden flex-col items-center lg:flex">
            <img
              src="/brand/diamond.png"
              alt=""
              className="size-6 object-contain"
            />
            <div className="min-h-[640px] w-px flex-1 bg-foreground" />
            <img
              src="/brand/diamond.png"
              alt=""
              className="size-6 object-contain"
            />
          </div>

          <div className="lg:pt-2">
            <h2 className="text-[length:var(--ef-text-cta)] font-normal uppercase text-foreground">
              Выберите билет
            </h2>
            <fieldset className="mt-8 space-y-8">
              <legend className="sr-only">Тип билета</legend>
              {tickets.map((item) => {
                const selected = ticket === item.id;
                return (
                  <label
                    key={item.id}
                    className="flex h-[100px] cursor-pointer items-center gap-4 rounded-[var(--ef-radius-button)] border border-foreground px-7"
                  >
                    <input
                      type="radio"
                      name="ticket"
                      value={item.id}
                      checked={selected}
                      onChange={() => setTicket(item.id)}
                      className="sr-only"
                    />
                    <span className="relative flex size-12 shrink-0 items-center justify-center">
                      <img
                        src="/brand/radio.svg"
                        alt=""
                        width={48}
                        height={48}
                        className="pointer-events-none"
                      />
                      {selected ? (
                        <img
                          src="/brand/radio-on.svg"
                          alt=""
                          width={30}
                          height={30}
                          className="pointer-events-none absolute"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-[length:var(--ef-text-body)]">
                        {item.title}
                      </span>
                      <span className="mt-1 block font-light leading-normal text-[length:var(--ef-text-caption)]">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 font-normal text-[length:var(--ef-text-body)]">
                      {item.price}
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <Button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-8 h-16 w-full rounded-[var(--ef-radius-button)] bg-foreground text-[length:var(--ef-text-body)] font-medium text-background hover:bg-foreground/90"
            >
              Продолжить
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 font-light text-[length:var(--ef-text-caption)]">
              <img
                src="/brand/icon-lock.png"
                alt=""
                className="h-[10px] w-2 object-contain"
              />
              безопасная оплата
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
