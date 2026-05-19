"use client";

import { ReactNode } from "react";

export interface MetaPair {
  k: string;
  v: ReactNode;
}

/**
 * Dense key/value grid (Palantir "Object Properties" panel feel).
 * Drop into any entity sidebar.
 */
export default function MetaGrid({ pairs }: { pairs: MetaPair[] }) {
  return (
    <div className="meta-grid">
      {pairs.flatMap((p, i) => [
        <div key={`k-${i}`} className="k">{p.k}</div>,
        <div key={`v-${i}`} className="v">{p.v ?? <span className="text-ink-muted">—</span>}</div>,
      ])}
    </div>
  );
}
