"use client";

import type { ReactNode } from "react";
import { CatalogHeader } from "@/components/catalog-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/useAuth";

export function CatalogShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  return (
    <div className="flex min-h-full flex-col bg-background">
      {loading ? (
        <div className="h-16 sm:h-[var(--ef-header-height)]" />
      ) : (
        <CatalogHeader />
      )}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
