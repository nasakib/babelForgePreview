/**
 * Command + entity registry feeding the ⌘K palette, left rail, and
 * breadcrumb component. Single source of truth so adding a new module
 * means adding one entry here.
 */

import type { ReactNode } from "react";

export interface AppRoute {
  href: string;
  /** Short label used in rail tooltip and breadcrumbs. */
  label: string;
  /** Palantir-style ontology category. */
  kind: "console" | "ops" | "analyzer" | "library" | "patient" | "docs";
  /** Function key shortcut, displayed in palette. */
  shortcut?: string;
  /** Brief subtitle for command palette row. */
  description: string;
  /** Inline SVG path data for the rail icon (24x24 viewbox). */
  icon: string;
}

export const APP_ROUTES: AppRoute[] = [
  {
    href: "/",
    label: "Console",
    kind: "console",
    shortcut: "F1",
    description: "Mission control — integrity score, active stack, topology.",
    icon: "M3 12h4l3-8 4 16 3-8h4",
  },
  {
    href: "/stack-simulator",
    label: "Stack Builder",
    kind: "ops",
    shortcut: "F2",
    description: "Compose and simulate a multi-compound regimen.",
    icon: "M4 6h16M4 12h16M4 18h10",
  },
  {
    href: "/compounds",
    label: "Compound Library",
    kind: "library",
    shortcut: "F3",
    description: "Browse compounds with mechanism + effect-basis projection.",
    icon: "M12 2l3 6 6 .9-4.5 4.4 1 6.4L12 16l-5.5 3.7 1-6.4L3 8.9 9 8z",
  },
  {
    href: "/signal-analyzer",
    label: "Signal Analyzer",
    kind: "analyzer",
    shortcut: "F4",
    description: "Stack or compress δθαβγ bands under a stimulus.",
    icon: "M3 12h3l2-7 4 14 2-7h7",
  },
  {
    href: "/fmri-analysis",
    label: "fMRI Ingest",
    kind: "ops",
    shortcut: "F5",
    description: "Upload NIfTI; project onto Schaefer parcellation.",
    icon: "M4 4h16v6H4zM4 14h7v6H4zM13 14h7v6h-7z",
  },
  {
    href: "/11d-projection",
    label: "11D Topology",
    kind: "analyzer",
    shortcut: "F6",
    description: "Project clique structure to a 3-axis embedding.",
    icon: "M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  },
  {
    href: "/pharma-projection",
    label: "Pharma Projection",
    kind: "analyzer",
    shortcut: "F7",
    description: "Place compounds on the 4-axis effect basis.",
    icon: "M12 2v20M2 12h20",
  },
  {
    href: "/studies",
    label: "Validation",
    kind: "library",
    shortcut: "F8",
    description: "Per-pathology validation studies + fingerprints.",
    icon: "M4 6h16M4 10h12M4 14h16M4 18h8",
  },
  {
    href: "/fourier",
    label: "Fourier",
    kind: "analyzer",
    shortcut: "F10",
    description: "Spectral analysis across EEG, Kuramoto coherence, BOLD, and compound resonance.",
    icon: "M3 12c2 0 2-8 4-8s2 16 4 16 2-8 4-8 2 4 6 0",
  },
  {
    href: "/procedures",
    label: "Procedures",
    kind: "library",
    shortcut: "F11",
    description: "Taxonomy of advanced neuromodulatory & pharmacological procedures.",
    icon: "M4 6h16M4 12h8M4 18h16",
  },
  {
    href: "/docs",
    label: "Docs",
    kind: "docs",
    shortcut: "F9",
    description: "API reference, clinical workflow, methodology.",
    icon: "M6 4h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm9 0v5h5",
  },
];

export interface Command {
  id: string;
  title: string;
  hint?: string;
  group: "Navigate" | "Action" | "View";
  run: (router: { push: (href: string) => void }) => void;
}

export function buildCommands(): Command[] {
  const navCommands: Command[] = APP_ROUTES.map((r) => ({
    id: `go:${r.href}`,
    title: `Go to ${r.label}`,
    hint: r.shortcut,
    group: "Navigate",
    run: (router) => router.push(r.href),
  }));
  // Reserve action/view slots for future palette extensions.
  return navCommands;
}

/** Used by Breadcrumbs/Header to look up the kind label for a route. */
export function routeForPath(pathname: string): AppRoute | undefined {
  if (!pathname) return undefined;
  if (pathname === "/") return APP_ROUTES[0];
  return APP_ROUTES.find((r) => r.href !== "/" && pathname.startsWith(r.href));
}

export const KIND_LABEL: Record<AppRoute["kind"], string> = {
  console:  "console",
  ops:      "ops",
  analyzer: "analyzer",
  library:  "library",
  patient:  "patient",
  docs:     "docs",
};

// Re-export ReactNode type for downstream consumers that compose icons
// alongside command entries.
export type { ReactNode };
