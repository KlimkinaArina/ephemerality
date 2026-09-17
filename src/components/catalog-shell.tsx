import type { ReactNode } from "react";
import { CatalogHeader } from "@/components/catalog-header";

export function CatalogShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <CatalogHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
