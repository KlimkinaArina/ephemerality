import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-20 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-[var(--ef-content-width)] items-center justify-between gap-4 px-4 sm:h-[var(--ef-header-height)] sm:px-6">
          <Link href="/" className="shrink-0">
            <img
              src="/brand/logo.png"
              alt="Эфемерность"
              className="h-12 w-auto object-contain sm:h-[105px]"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              nativeButton={false}
              variant="ghost"
              render={<Link href="/login?next=/app" />}
              className="hidden font-light text-[length:var(--ef-text-body)] sm:inline-flex"
            >
              Войти
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/app" />}
              className="h-[38px] rounded-[var(--ef-radius-button)] px-5 font-light text-[length:var(--ef-text-body)]"
            >
              Попробовать
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
