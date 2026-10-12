"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadSessionRole, useAuth } from "@/hooks/useAuth";
import { applyAuthSession, authApiMessage } from "@/lib/auth-session";
import { postLoginPath } from "@/lib/roles";

const schema = z.object({
  email: z.string().email("Укажите email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type Values = z.infer<typeof schema>;

export function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading } = useAuth();
  const next = searchParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user) router.replace(postLoginPath(role, next));
  }, [loading, user, role, next, router]);

  async function onSubmit(values: Values) {
    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
    } catch (error) {
      console.error(error);
      toast.error("Не удалось связаться с сервером");
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    > & {
      access_token?: string;
      refresh_token?: string;
      session?: { access_token?: string; refresh_token?: string } | null;
    };

    if (!response.ok) {
      console.error(payload);
      toast.error(authApiMessage(payload, "Неверный email или пароль"));
      return;
    }

    const signedIn = await applyAuthSession(payload);
    if (!signedIn) {
      toast.error("Не удалось сохранить сессию. Проверьте ключ Supabase и обновите страницу.");
      return;
    }
    toast.success("Сохранено");
    const sessionRole = await loadSessionRole();
    router.replace(postLoginPath(sessionRole, next));
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-medium uppercase tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(1.5rem,4vw,2.5rem)]">
        Вход
      </h1>
      <p className="mt-3 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
        Программа открыта без аккаунта. Войдите, чтобы оформить билет или открыть кабинет.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="login-password">Пароль</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-[var(--ef-radius-button)]"
        >
          {isSubmitting ? "Вход…" : "Войти"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Регистрация
        </Link>
      </p>
    </section>
  );
}
