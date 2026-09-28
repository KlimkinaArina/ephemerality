import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const durations = ["5", "10", "15", "30"] as const;

const steps = [
  {
    n: "01",
    title: "Выберите время",
    body: "Сколько у вас есть — 5, 10, 15 или 30 минут?",
  },
  {
    n: "02",
    title: "Получите фильм",
    body: "«Эфемерность» подберёт короткометражку под ваш доступный момент.",
  },
  {
    n: "03",
    title: "Смотрите и делитесь",
    body: "Посмотрите фильм, сохраните впечатление или поделитесь им с кем-то.",
  },
];

export function Landing() {
  return (
    <>
      <section className="relative bg-hero">
        <div className="mx-auto grid w-full max-w-[var(--ef-content-width)] lg:grid-cols-[minmax(0,1fr)_42%]">
          <div className="relative z-10 flex flex-col justify-center gap-6 px-4 py-12 sm:gap-8 sm:px-6 sm:py-16">
            <p className="text-[length:var(--ef-text-caption)] font-medium uppercase tracking-[var(--ef-tracking-footer)] text-foreground">
              Эфемерность
            </p>
            <h1 className="max-w-xl font-medium leading-none text-foreground text-[clamp(1.75rem,6vw,var(--ef-text-display))]">
              Есть 10 минут? Посмотрите кино.
            </h1>
            <p className="max-w-lg text-[length:var(--ef-text-body)] font-light leading-normal text-foreground">
              Выберите, сколько у вас есть времени — «Эфемерность» подберёт
              короткометражный фильм, который можно посмотреть прямо сейчас.
            </p>
            <div className="flex flex-wrap gap-2">
              {durations.map((value) => (
                <Button
                  key={value}
                  nativeButton={false}
                  variant="outline"
                  render={<Link href={`/app?minutes=${value}`} />}
                  className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light hover:bg-transparent"
                >
                  {value} мин
                </Button>
              ))}
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/app" />}
              className="h-12 w-fit rounded-[var(--ef-radius-button)] px-6 text-[length:var(--ef-text-body)] font-light sm:h-14 sm:text-[length:var(--ef-text-cta)]"
            >
              Попробовать
            </Button>
          </div>
          <div className="relative min-h-[220px] sm:min-h-[320px] lg:min-h-[520px]">
            <img
              src="/brand/hero.png"
              alt=""
              className="absolute inset-0 size-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-hero from-10% to-transparent lg:bg-gradient-to-r lg:from-hero lg:from-20%" />
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[var(--ef-content-width)] bg-section px-5 py-10 sm:px-12 sm:py-14">
          <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
            Проблема
          </h2>
          <p className="mt-6 max-w-3xl text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground">
            Не всегда есть время на полнометражное кино — иногда свободно всего
            5–30 минут. Но найти за это время качественный короткометражный
            фильм сложно: независимое кино разбросано по разным площадкам, а
            поиск отнимает больше времени, чем сам просмотр.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 pb-12 sm:px-6 sm:pb-16">
        <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
          Решение
        </h2>
        <p className="mt-4 max-w-2xl text-[length:var(--ef-text-cta)] font-light leading-snug text-foreground">
          «Эфемерность» подбирает кино под ваш момент.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          <li className="border-b border-foreground/20 pb-4 text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            Выберите время — 5, 10, 15 или 30 минут.
          </li>
          <li className="border-b border-foreground/20 pb-4 text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            Получите подходящую историю — по длительности, настроению и
            интересам.
          </li>
          <li className="text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground">
            Смотрите сразу — без обязательной регистрации на первом просмотре.
          </li>
        </ul>
      </section>

      <section className="bg-hero px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[var(--ef-content-width)]">
          <h2 className="text-[length:var(--ef-text-section)] font-normal uppercase text-foreground">
            Как работает
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <Card
                key={step.n}
                className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-section ring-0"
              >
                <CardHeader>
                  <p className="text-[length:var(--ef-text-caption)] font-medium uppercase tracking-[var(--ef-tracking-footer)] text-muted-foreground">
                    {step.n}
                  </p>
                  <CardTitle className="text-[length:var(--ef-text-section)] font-normal">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground">
                    {step.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[length:var(--ef-text-cta)] font-light leading-snug text-foreground sm:text-[length:var(--ef-text-display)]">
          Зрители уже используют «Эфемерность»
        </p>
        <p className="mt-4 max-w-xl text-[length:var(--ef-text-body)] font-light leading-relaxed text-muted-foreground">
          Короткое кино для тех моментов, когда времени мало, а впечатлений
          хочется.
        </p>
      </section>

      <section className="bg-section px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[var(--ef-content-width)]">
          <h2 className="max-w-2xl font-medium leading-none text-foreground text-[clamp(1.75rem,5vw,var(--ef-text-cta))]">
            Ваши 10 минут могут стать историей.
          </h2>
          <p className="mt-6 max-w-xl text-[length:var(--ef-text-body)] font-light leading-relaxed text-foreground">
            Выберите время и найдите фильм, который можно посмотреть прямо
            сейчас.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              nativeButton={false}
              render={<Link href="/app" />}
              className="h-12 rounded-[var(--ef-radius-button)] px-6 text-[length:var(--ef-text-body)] font-light sm:h-14"
            >
              Попробовать «Эфемерность»
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/app" />}
              className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-6 text-[length:var(--ef-text-body)] font-light hover:bg-transparent sm:h-14"
            >
              Открыть приложение →
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
