"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard",              label: "Главная",    match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/transactions", label: "Транзакции", match: (p: string) => p.startsWith("/dashboard/transactions") },
  { href: "/dashboard/categories",   label: "Категории",  match: (p: string) => p.startsWith("/dashboard/categories") },
  { href: "/dashboard/goals",        label: "Цели",       match: (p: string) => p.startsWith("/dashboard/goals") },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-[15px]">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          data-active={l.match(pathname) ? "true" : "false"}
          className="nav-link"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
