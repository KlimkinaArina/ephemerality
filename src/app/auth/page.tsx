import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight">Войти</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Auth подключится со слоем Supabase. Форма пока без отправки.
      </p>
      <Input type="email" placeholder="Email" className="h-11" disabled />
      <Button type="button" disabled>
        Продолжить
      </Button>
    </section>
  );
}
