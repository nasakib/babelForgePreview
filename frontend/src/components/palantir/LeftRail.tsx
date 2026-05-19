"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES } from "@/lib/palantir/registry";

/**
 * Narrow icon rail (Palantir Foundry style). Visible only on lg+ —
 * mobile users get the existing hamburger menu in the Navbar.
 */
export default function LeftRail() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="app-rail" role="navigation" aria-label="Module rail">
      {APP_ROUTES.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className={isActive(r.href) ? "active" : ""}
          title={`${r.label} · ${r.shortcut ?? ""}`}
          aria-label={r.label}
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={r.icon} />
          </svg>
        </Link>
      ))}
    </aside>
  );
}
