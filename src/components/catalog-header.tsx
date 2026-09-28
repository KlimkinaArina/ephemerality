"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const nav = [
  { href: "/#about", label: "О фестивале" },
  { href: "/catalog", label: "Программа" },
  { href: "/search", label: "Приглашенные гости" },
  { href: "/#footer", label: "Контакты" },
];

const accountNav = [
  { href: "/favorites", label: "Избранное" },
  { href: "/history", label: "История" },
  { href: "/profile", label: "Профиль" },
];

export function CatalogHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function onLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      toast.error("Ошибка");
      return;
    }
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[var(--ef-content-width)] items-center justify-between gap-4 px-4 sm:h-[var(--ef-header-height)] sm:px-6">
        <Link href="/" className="shrink-0">
          <img
            src="/brand/logo.png"
            alt="Эфемерность"
            className="h-12 w-auto object-contain sm:h-[105px]"
          />
        </Link>

        <nav className="hidden flex-wrap items-center justify-end gap-3 font-light text-[length:var(--ef-text-body)] text-foreground sm:flex lg:gap-8">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:opacity-80">
              {item.label}
            </Link>
          ))}
          {user
            ? accountNav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:opacity-80">
                  {item.label}
                </Link>
              ))
            : null}
          {user ? (
            <Button
              type="button"
              variant="outline"
              onClick={onLogout}
              className="h-[38px] rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-5 font-light text-[length:var(--ef-text-body)] hover:bg-transparent"
            >
              Logout
            </Button>
          ) : (
            <>
              <Button
                nativeButton={false}
                variant="ghost"
                render={<Link href="/login" />}
                className="font-light text-[length:var(--ef-text-body)]"
              >
                Войти
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/auth" />}
                className="h-[38px] rounded-[var(--ef-radius-button)] border-[length:var(--ef-border-width)] bg-transparent px-5 font-light text-[length:var(--ef-text-body)] hover:bg-transparent"
              >
                Купить билеты
              </Button>
            </>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-[length:var(--ef-border-width)] bg-transparent sm:hidden"
                aria-label="Открыть меню"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Навигация</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {nav.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      href={item.href}
                      className="rounded-[var(--ef-radius-button)] px-2 py-2 text-[length:var(--ef-text-body)] font-light text-foreground hover:bg-muted"
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}
              {user
                ? accountNav.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          className="rounded-[var(--ef-radius-button)] px-2 py-2 text-[length:var(--ef-text-body)] font-light text-foreground hover:bg-muted"
                        />
                      }
                    >
                      {item.label}
                    </SheetClose>
                  ))
                : null}
              {user ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </Button>
              ) : (
                <>
                  <SheetClose
                    render={
                      <Link
                        href="/login"
                        className="mt-2 rounded-[var(--ef-radius-button)] px-2 py-2 text-center font-light"
                      />
                    }
                  >
                    Войти
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link
                        href="/auth"
                        className="rounded-[var(--ef-radius-button)] border border-border px-2 py-2 text-center font-light"
                      />
                    }
                  >
                    Купить билеты
                  </SheetClose>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
