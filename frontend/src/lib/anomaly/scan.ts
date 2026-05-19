/**
 * babelForge — anomaly scan orchestrator.
 *
 * Runs the verified + (optionally) novice rule catalogues over a
 * {profile, derived} pair, dedupes by rule id, and groups by body
 * system. Also injects pharmacology hits from `safetyScan` (DDI,
 * serotonin, QT, pregnancy, allergy) so the UI has one funnel.
 */

import type { PatientProfile } from "@/lib/patient/profile";
import { deriveMetrics, type DerivedMetrics } from "@/lib/patient/derived";
import {
  VERIFIED_RULES,
  NOVICE_RULES,
  type AnomalyHit,
  type AnomalyMode,
  type AnomalySystem,
  type AnomalySeverity,
} from "./rules";
import { safetyScan } from "@/lib/patient/integrate";

export interface AnomalyScanResult {
  mode: AnomalyMode;
  derived: DerivedMetrics;
  hits: AnomalyHit[];
  bySystem: Record<AnomalySystem, AnomalyHit[]>;
  counts: Record<AnomalySeverity, number>;
  emptyReason?: string;
}

const SEVERITY_ORDER: Record<AnomalySeverity, number> = {
  urgent: 0,
  concern: 1,
  watch: 2,
  info: 3,
};

export function scanAnomalies(
  profile: PatientProfile,
  opts: { mode: AnomalyMode; stack?: Array<{ name?: string; class?: string; dose?: number }> } = {
    mode: "verified",
  },
): AnomalyScanResult {
  const derived = deriveMetrics(profile);
  const rules =
    opts.mode === "novice" ? [...VERIFIED_RULES, ...NOVICE_RULES] : VERIFIED_RULES;

  const hits: AnomalyHit[] = [];

  for (const r of rules) {
    if (!r.modes.includes(opts.mode)) continue;
    let result: ReturnType<typeof r.check> = null;
    try {
      result = r.check(profile, derived);
    } catch {
      result = null;
    }
    if (!result) continue;
    hits.push({
      id: r.id,
      system: r.system,
      mode: opts.mode,
      ...result,
    });
  }

  // Pharmacology — interactions, serotonin syndrome, QT, allergy, pregnancy.
  // Always include these (both modes) because they are guideline-anchored.
  const stack = opts.stack ?? [];
  for (const a of safetyScan(profile, stack)) {
    const severity: AnomalySeverity =
      a.severity === "crit" ? "urgent" : a.severity === "warn" ? "concern" : "info";
    hits.push({
      id: `pharma.${a.kind}.${hits.length}`,
      system: "Pharmacologic",
      mode: opts.mode,
      severity,
      title: pharmaTitle(a.kind),
      message: a.message,
      nextStep:
        a.kind === "allergy"
          ? "Stop the agent if active and contact a clinician."
          : a.kind === "pregnancy"
            ? "Contact a clinician before the next dose."
            : "Share with a clinician / pharmacist; many interactions have safer substitutes.",
      citations: a.refs,
    });
  }

  // Dedupe (same rule id appearing twice from overlapping catalogues).
  const seen = new Set<string>();
  const dedup = hits.filter((h) => (seen.has(h.id) ? false : (seen.add(h.id), true)));

  dedup.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.system.localeCompare(b.system),
  );

  const bySystem: Record<AnomalySystem, AnomalyHit[]> = {} as any;
  for (const h of dedup) {
    (bySystem[h.system] ??= []).push(h);
  }

  const counts: Record<AnomalySeverity, number> = { urgent: 0, concern: 0, watch: 0, info: 0 };
  for (const h of dedup) counts[h.severity] += 1;

  return {
    mode: opts.mode,
    derived,
    hits: dedup,
    bySystem,
    counts,
    emptyReason: dedup.length === 0 ? "No flags from the entered data." : undefined,
  };
}

function pharmaTitle(kind: string): string {
  switch (kind) {
    case "ddi":
      return "Possible drug–drug interaction";
    case "serotonin":
      return "Possible serotonin syndrome risk";
    case "qt":
      return "Possible QT-prolongation risk";
    case "pregnancy":
      return "Pregnancy contraindication";
    case "allergy":
      return "Possible allergy match";
    case "renal":
      return "Renal dose adjustment";
    case "hepatic":
      return "Hepatic dose adjustment";
    case "age":
      return "Age-related dosing caution";
    default:
      return "Medication safety flag";
  }
}
