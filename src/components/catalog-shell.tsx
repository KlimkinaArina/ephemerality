"use client";

import type { ReactNode } from "react";
import { CatalogHeader } from "@/components/catalog-header";
import { FilmGridSkeleton } from "@/components/film-grid";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/useAuth";

export function CatalogShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <div className="h-16 sm:h-[var(--ef-header-height)]" />
        <div className="mx-auto w-full max-w-[var(--ef-content-width)] flex-1 px-4 py-16 sm:px-6">
          <FilmGridSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <CatalogHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
