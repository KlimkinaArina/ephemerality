import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Forbidden() {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-24 sm:px-6">
      <p className="text-[length:var(--ef-text-caption)] font-medium uppercase tracking-[var(--ef-tracking-footer)]">
        403
      </p>
      <h1 className="mt-2 text-[length:var(--ef-text-cta)] font-medium">
        Нет доступа
      </h1>
      <p className="mt-3 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
        Этот раздел доступен только для другой роли.
      </p>
      <Button
        nativeButton={false}
        variant="outline"
        render={<Link href="/" />}
        className="mt-8 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light"
      >
        На главную
      </Button>
    </section>
  );
}
