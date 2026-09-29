"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/saju", label: "사주" },
  { href: "/today", label: "오늘의 운세" },
  { href: "/gunghap", label: "궁합" },
  { href: "/manse", label: "만세력" },
];

export default function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold whitespace-nowrap">
          <span className="text-accent">命</span> 나의 운명
        </Link>
        <nav className="flex gap-0.5 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-2.5 py-1.5 whitespace-nowrap ${
                path.startsWith(n.href) ? "bg-accent-soft font-bold text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
