import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { CatalogShell } from "@/components/catalog-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`dark ${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <CatalogShell>{children}</CatalogShell>
      </body>
    </html>
  );
}
