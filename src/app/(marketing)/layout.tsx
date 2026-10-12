import type { ReactNode } from "react";
import { CatalogHeader } from "@/components/catalog-header";
import { SiteFooter } from "@/components/site-footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <CatalogHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
