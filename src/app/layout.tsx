import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import { CatalogShell } from "@/components/catalog-shell";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["200", "300", "400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-quote",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Эфемерность",
  description:
    "Платформа короткометражного кино: выберите время и получите историю.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`dark ${manrope.variable} ${geistMono.variable} ${cormorant.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <CatalogShell>{children}</CatalogShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
