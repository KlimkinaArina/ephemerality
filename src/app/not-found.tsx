import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-4 py-24 sm:px-6">
      <Card className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent">
        <CardHeader className="text-center">
          <p className="text-[length:var(--ef-text-caption)] font-medium uppercase tracking-[var(--ef-tracking-footer)] text-foreground">
            404
          </p>
          <CardTitle className="mt-2 text-[length:var(--ef-text-cta)] font-medium">
            Страница не найдена
          </CardTitle>
          <CardDescription>Здесь пока ничего нет</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/" />}
            className="rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent font-light"
          >
            На главную
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
