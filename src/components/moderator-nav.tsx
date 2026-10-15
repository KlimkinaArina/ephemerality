"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/moderator", label: "Кабинет" },
  { href: "/moderator/queue", label: "Очередь" },
  { href: "/moderator/schedule", label: "Расписание" },
  { href: "/moderator/halls", label: "Залы" },
  { href: "/moderator/analytics", label: "Аналитика" },
];

export function ModeratorNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-3 border-b border-foreground/15 pb-3 text-[length:var(--ef-text-body)] font-light">
      {LINKS.map((link) => {
        const active =
          link.href === "/moderator"
            ? pathname === "/moderator"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "font-normal" : "text-muted-foreground hover:text-foreground"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
