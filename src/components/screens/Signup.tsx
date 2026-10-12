"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

const schema = z
  .object({
    email: z.string().email("Укажите email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirm: z.string().min(6, "Подтвердите пароль"),
    role: z.enum(["visitor", "director"]),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

export function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading } = useAuth();
  const next = searchParams.get("next");
  const [checkEmail, setCheckEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirm: "", role: "visitor" },
  });

  useEffect(() => {
    if (!loading && user) router.replace(postLoginPath(role, next));
  }, [loading, user, role, next, router]);

  async function onSubmit(values: Values) {
    let response: Response;
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          role: values.role,
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
      toast.error(authApiMessage(payload, "Ошибка"));
      return;
    }

    const signedIn = await applyAuthSession(payload);
    if (signedIn) {
      toast.success("Сохранено");
      const sessionRole = await loadSessionRole();
      router.replace(postLoginPath(sessionRole ?? values.role, next));
      return;
    }
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-medium uppercase tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(1.5rem,4vw,2.5rem)]">
          Проверьте почту
        </h1>
        <p className="mt-4 text-[length:var(--ef-text-body)] font-light leading-normal text-muted-foreground">
          Мы отправили письмо со ссылкой подтверждения. После этого можно войти.
        </p>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/login" />}
          className="mt-8 rounded-[var(--ef-radius-button)]"
        >
          К входу
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-medium uppercase tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(1.5rem,4vw,2.5rem)]">
        Регистрация
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
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
          <Label htmlFor="signup-password">Пароль</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-confirm">Подтверждение пароля</Label>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            className="h-12 rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent"
            {...register("confirm")}
          />
          {errors.confirm ? (
            <p className="text-sm text-destructive">{errors.confirm.message}</p>
          ) : null}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Кто вы</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--ef-radius-button)] border border-border px-3 py-3">
            <input
              type="radio"
              value="visitor"
              className="mt-1"
              {...register("role")}
            />
            <span className="text-[length:var(--ef-text-body)] font-light">
              Хочу смотреть фильмы
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--ef-radius-button)] border border-border px-3 py-3">
            <input
              type="radio"
              value="director"
              className="mt-1"
              {...register("role")}
            />
            <span className="text-[length:var(--ef-text-body)] font-light">
              Хочу подать фильм
            </span>
          </label>
          {errors.role ? (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          ) : null}
        </fieldset>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-[var(--ef-radius-button)]"
        >
          {isSubmitting ? "Создание…" : "Зарегистрироваться"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Войти
        </Link>
      </p>
    </section>
  );
}
