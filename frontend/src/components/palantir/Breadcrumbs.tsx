"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routeForPath, KIND_LABEL } from "@/lib/palantir/registry";

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Optional trailing crumbs (e.g., the selected entity id). */
  trail?: Crumb[];
  className?: string;
}

/**
 * Typed breadcrumb header (Palantir-style):  kind / module / sub-entity.
 * Derives the prefix automatically from the current route.
 */
export default function Breadcrumbs({ trail, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const route = routeForPath(pathname);

  return (
    <nav className={`crumb ${className ?? ""}`} aria-label="Breadcrumb">
      <span className="text-ink-muted">babelforge</span>
      <span className="sep">/</span>
      {route ? (
        <>
          <span>{KIND_LABEL[route.kind]}</span>
          <span className="sep">/</span>
          <Link href={route.href} className="cur">{route.label}</Link>
        </>
      ) : (
        <span className="cur">unknown</span>
      )}
      {trail?.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-[0.35rem]">
          <span className="sep">/</span>
          {c.href ? (
            <Link href={c.href} className="hover:text-ink">{c.label}</Link>
          ) : (
            <span className="cur">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
