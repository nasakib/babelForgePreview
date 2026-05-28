/**
 * babelForge — Clinical Council orchestrator.
 *
 * Maps anomaly-scan hits onto the council of specialists. Each agent
 * "watches" a set of body systems and any pharmacologic flags get
 * funneled to the Clinical Pharmacologist by default.  The orchestrator
 * produces a CouncilOpinion per relevant agent containing:
 *   - the hits that triggered them
 *   - a one-paragraph framing (their lens applied)
 *   - recommended next steps (deduped, ordered by hit severity)
 *
 * NOTE: This is *not* medical advice. The council is a research /
 * education layer on top of guideline-anchored rule output.
 */

import type { AnomalyScanResult } from "@/lib/anomaly/scan";
import type {
  AnomalyHit,
  AnomalySeverity,
  AnomalySystem,
} from "@/lib/anomaly/rules";
import { COUNCIL, type CouncilAgent, type DisciplineKey } from "./agents";

export interface CouncilOpinion {
  agent: CouncilAgent;
  /** Hits this agent finds relevant. */
  hits: AnomalyHit[];
  /** Highest-severity hit they responded to (drives card border color). */
  severity: AnomalySeverity;
  /** One-paragraph narrative framed through the agent's lens. */
  framing: string;
  /** Ordered next-step bullets (deduped across hits). */
  recommendations: string[];
}

const SEV_ORDER: Record<AnomalySeverity, number> = {
  urgent: 0,
  concern: 1,
  watch: 2,
  info: 3,
};

/** Always-on routing rules: certain systems map to a discipline directly. */
const SYSTEM_TO_AGENT: Partial<Record<AnomalySystem, DisciplineKey[]>> = {
  Cardiovascular: ["Cardiology", "InternalMedicine"],
  Respiratory: ["Pulmonology", "SleepMedicine"],
  Neurological: ["Neurology", "Psychiatry"],
  Endocrine: ["Endocrinology", "InternalMedicine"],
  Renal: ["Nephrology", "InternalMedicine"],
  Hepatic: ["Hepatology", "Pharmacology"],
  Hematologic: ["Hematology", "Nutrition"],
  Immune: ["Immunology"],
  Gastrointestinal: ["Gastroenterology", "Nutrition"],
  Musculoskeletal: ["SportsMedicine", "PainMedicine"],
  Reproductive: ["WomensHealth"],
  Metabolic: ["Endocrinology", "Nutrition", "InternalMedicine"],
  Autonomic: ["Neurology", "Cardiology"],
  Behavioral: ["Psychiatry"],
  Pharmacologic: ["Pharmacology", "InternalMedicine"],
  Integumentary: ["InternalMedicine"],
};

function highestSeverity(hits: AnomalyHit[]): AnomalySeverity {
  return hits.reduce<AnomalySeverity>(
    (acc, h) => (SEV_ORDER[h.severity] < SEV_ORDER[acc] ? h.severity : acc),
    "info",
  );
}

function uniqueOrdered<T>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = JSON.stringify(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function frame(agent: CouncilAgent, hits: AnomalyHit[]): string {
  if (hits.length === 0) {
    return `${agent.title} (${agent.name}): nothing in this case crosses my thresholds. I would defer to the team unless new data appears.`;
  }
  const urgent = hits.filter((h) => h.severity === "urgent").length;
  const concern = hits.filter((h) => h.severity === "concern").length;
  const head = urgent
    ? `URGENT from a ${agent.title.toLowerCase()} lens: ${hits[0].title}.`
    : concern
      ? `On concern: ${hits[0].title}.`
      : `Worth watching: ${hits[0].title}.`;
  return `${head} ${agent.lens}`;
}

export function convene(scan: AnomalyScanResult): CouncilOpinion[] {
  const buckets = new Map<DisciplineKey, AnomalyHit[]>();

  for (const hit of scan.hits) {
    const targets = SYSTEM_TO_AGENT[hit.system] ?? ["InternalMedicine"];
    for (const id of targets) {
      const list = buckets.get(id) ?? [];
      list.push(hit);
      buckets.set(id, list);
    }
  }

  // Internist always speaks if any hit exists, to provide synthesis.
  if (scan.hits.length > 0 && !buckets.has("InternalMedicine")) {
    buckets.set("InternalMedicine", [...scan.hits]);
  }

  const opinions: CouncilOpinion[] = [];
  for (const [id, hits] of Array.from(buckets.entries())) {
    const agent = COUNCIL.find((a) => a.id === id);
    if (!agent) continue;
    hits.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    const recs = uniqueOrdered(
      hits.flatMap((h) => (h.nextStep ? [h.nextStep] : [])),
    );
    opinions.push({
      agent,
      hits,
      severity: highestSeverity(hits),
      framing: frame(agent, hits),
      recommendations: recs,
    });
  }

  opinions.sort(
    (a, b) =>
      SEV_ORDER[a.severity] - SEV_ORDER[b.severity] ||
      b.hits.length - a.hits.length,
  );

  return opinions;
}
