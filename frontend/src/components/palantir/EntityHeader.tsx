"use client";

import { ReactNode } from "react";

export interface EntityHeaderProps {
  /** Ontology label, e.g. "PATIENT", "REGIMEN", "TOPOLOGY_RUN". */
  kind: string;
  /** Stable opaque id surfaced in a hash pill. */
  id?: string;
  /** Primary display name. */
  name: string;
  /** Optional version label or revision. */
  version?: string;
  /** Optional owner / clinician initials. */
  owner?: string;
  /** Optional ISO timestamp — rendered humanly. */
  updatedAt?: string;
  /** Status tone for the leading dot. */
  status?: "ok" | "warn" | "crit" | "accent" | "neutral";
  /** Right-side action buttons. */
  actions?: ReactNode;
}

/**
 * Palantir Object Explorer-style header.
 * Use as the first child of any entity-detail page.
 */
export default function EntityHeader({
  kind, id, name, version, owner, updatedAt, status = "accent", actions,
}: EntityHeaderProps) {
  const updated = updatedAt
    ? new Date(updatedAt).toISOString().replace("T", " ").replace(/\..+/, "Z")
    : null;

  const dotTone =
    status === "ok"   ? "ok"
    : status === "warn" ? "warn"
    : status === "crit" ? "crit"
    : status === "neutral" ? "" : "accent";

  return (
    <header className="border-b border-line bg-surface-0/60 px-4 py-3 flex flex-wrap items-center gap-3">
      <span className={`entity-pill ${dotTone}`}>
        <span className="dot" />
        {kind}
      </span>
      <h1 className="text-[15px] font-medium text-ink tracking-tight">
        {name}
      </h1>
      {id && <span className="hash-id">{id}</span>}
      {version && (
        <span className="entity-pill">
          v{version}
        </span>
      )}
      <div className="flex items-center gap-3 ml-auto text-[10.5px] font-mono uppercase tracking-widest text-ink-muted">
        {owner && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-ink-subtle/70">owner</span>
            <span className="text-ink-subtle">{owner}</span>
          </span>
        )}
        {updated && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-ink-subtle/70">updated</span>
            <span className="text-ink-subtle">{updated}</span>
          </span>
        )}
        {actions && <span className="flex items-center gap-2 ml-1">{actions}</span>}
      </div>
    </header>
  );
}
