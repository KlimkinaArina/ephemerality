import Link from "next/link";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/search", label: "Поиск" },
  { href: "/auth", label: "Войти" },
];

export function CatalogHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium tracking-[0.22em] uppercase text-foreground"
        >
          Эфемерность
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
