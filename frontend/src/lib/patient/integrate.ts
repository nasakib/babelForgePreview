/**
 * babelForge — engine integration of patient state.
 *
 * Adjusts engine outputs in light of the Full Body Context. Pure functions
 * so the engines themselves stay context-free; callers compose.
 *
 * Citation anchors:
 *   - Hilmer SN et al., Arch Intern Med 2007 (Drug Burden Index).
 *   - Boyer EW, Shannon M, NEJM 2005 (serotonin syndrome criteria).
 *   - Levey AS et al., Ann Intern Med 2009 / Inker 2021 (renal dose adj).
 *   - Spina E, Hiemke C, de Leon J, Clin Pharmacokinet 2008 (CYP-mediated PK).
 *   - Roden DM, NEJM 2004 (QT prolongation classes).
 */

import type { PatientProfile } from "./profile";
import type { DerivedMetrics } from "./derived";
import {
  CYP_PROFILES,
  detectCYPInteractions,
  serotoninSyndromeRisk,
} from "@/lib/engines/chemistry";

export interface SafetyAlert {
  kind: "ddi" | "renal" | "hepatic" | "serotonin" | "qt" | "pregnancy" | "age" | "allergy";
  severity: "info" | "warn" | "crit";
  message: string;
  refs: string[];
}

/**
 * Pull every safety concern that can be derived from {profile + stack}.
 * Stack items use the same shape as the simulator: { name, class, dose }.
 */
export function safetyScan(
  profile: PatientProfile,
  stack: Array<{ name?: string; class?: string; dose?: number }>,
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const meds = profile.medications.map((m) => (m.name ?? "").toLowerCase());
  const stackNames = stack.map((s) => (s.name ?? "").toLowerCase());
  const allNames = [...meds, ...stackNames].filter(Boolean);

  // Drug–drug interactions via CYP profile overlap.
  const ddi = detectCYPInteractions(allNames);
  for (const w of ddi) {
    alerts.push({
      kind: "ddi",
      severity:
        w.severity === "major" ? "crit" : w.severity === "moderate" ? "warn" : "info",
      message: `${w.inhibitor} inhibits ${w.enzyme}, raising exposure of ${w.substrate}.`,
      refs: ["Spina 2008", "Hiemke 2018", "Flockhart Table"],
    });
  }

  // Serotonin syndrome risk if multiple serotonergic agents stack up.
  const ss = serotoninSyndromeRisk(allNames);
  if (ss.band !== "low" && ss.combinations.length) {
    const involved = Array.from(
      new Set(ss.combinations.flatMap((c) => [c.a, c.b])),
    );
    alerts.push({
      kind: "serotonin",
      severity: ss.band === "critical" ? "crit" : ss.band === "high" ? "crit" : "warn",
      message: `Serotonergic risk ${ss.band} (score ${ss.score.toFixed(2)}). Agents: ${involved.join(", ")}.`,
      refs: ["Boyer & Shannon NEJM 2005", "Hunter Criteria 2003"],
    });
  }

  // QT prolongation flag — flagged classes that overlap with known offenders.
  const QT_OFFENDERS = new Set([
    "citalopram",
    "escitalopram",
    "amiodarone",
    "haloperidol",
    "ondansetron",
    "azithromycin",
    "ciprofloxacin",
    "moxifloxacin",
    "methadone",
    "quetiapine",
    "ziprasidone",
  ]);
  const qtHits = allNames.filter((n) => QT_OFFENDERS.has(n));
  if (qtHits.length >= 1) {
    alerts.push({
      kind: "qt",
      severity: qtHits.length >= 2 ? "crit" : "warn",
      message: `QT-prolonging agents present: ${qtHits.join(", ")}. Consider ECG and electrolytes.`,
      refs: ["Roden 2004", "CredibleMeds.org"],
    });
  }

  // Pregnancy / breastfeeding contraindications (very conservative shortlist).
  if (profile.demographics.pregnant) {
    const TERATOGENIC = new Set([
      "valproate",
      "valproic acid",
      "warfarin",
      "isotretinoin",
      "methotrexate",
      "lithium",
      "ace inhibitor",
      "lisinopril",
      "enalapril",
      "atorvastatin",
      "simvastatin",
    ]);
    const hits = allNames.filter((n) => TERATOGENIC.has(n));
    if (hits.length) {
      alerts.push({
        kind: "pregnancy",
        severity: "crit",
        message: `Known/suspected teratogen present: ${hits.join(", ")}.`,
        refs: ["FDA Pregnancy and Lactation Labeling Rule 2015"],
      });
    }
  }

  // Allergy cross-check (very simple substring match).
  for (const a of profile.allergies) {
    const tag = a.agent.toLowerCase();
    const hit = allNames.find((n) => n.includes(tag) || tag.includes(n));
    if (hit) {
      alerts.push({
        kind: "allergy",
        severity: a.severity === "anaphylaxis" || a.severity === "severe" ? "crit" : "warn",
        message: `Possible match against documented allergy "${a.agent}" → ${hit}.`,
        refs: [],
      });
    }
  }
  return alerts;
}

/**
 * Renal / hepatic dose-modifier factor for a given drug. Returns a
 * multiplicative factor (e.g. 0.5 = halve dose); 1 means no change
 * suggested by the available labs. Strictly an advisory hint — real
 * dose adjustments require clinical judgement and full PK references.
 */
export function doseAdjustmentFactor(
  drugName: string,
  derived: DerivedMetrics,
  profile: PatientProfile,
): { factor: number; reasons: string[] } {
  const reasons: string[] = [];
  let factor = 1;

  const drug = drugName.toLowerCase();
  const cyp = (CYP_PROFILES as Record<string, any>)[drug];

  // Renal adjustment — mostly for drugs that are renally cleared.
  const RENALLY_CLEARED = new Set([
    "metformin",
    "gabapentin",
    "pregabalin",
    "lithium",
    "ranitidine",
    "atenolol",
    "digoxin",
    "allopurinol",
    "vancomycin",
  ]);
  if (RENALLY_CLEARED.has(drug) && derived.egfr != null) {
    if (derived.egfr < 30) {
      factor *= 0.5;
      reasons.push(`eGFR ${derived.egfr} → halve dose for renally cleared drug.`);
    } else if (derived.egfr < 60) {
      factor *= 0.75;
      reasons.push(`eGFR ${derived.egfr} → consider 25% dose reduction.`);
    }
  }

  // Hepatic adjustment — broad heuristic via AST/ALT for CYP substrates.
  const ast = profile.labs.ast ?? 0;
  const alt = profile.labs.alt ?? 0;
  if (cyp && (cyp.substrateOf?.length ?? 0) > 0 && (ast > 100 || alt > 100)) {
    factor *= 0.75;
    reasons.push(
      `Elevated AST/ALT — consider 25% dose reduction for hepatic CYP substrates.`,
    );
  }

  // Age modifier — geriatric (Beers / start-low-go-slow).
  if ((profile.demographics.ageYears ?? 0) >= 75) {
    factor *= 0.75;
    reasons.push(`Age ≥ 75: start at ~25% lower dose; titrate (Beers 2023).`);
  }

  // PGx phenotype modifier (very conservative).
  if (cyp?.substrateOf?.includes("CYP2D6") && profile.pgx.cyp2d6 === "PM") {
    factor *= 0.5;
    reasons.push(`CYP2D6 poor metabolizer → reduce dose (CPIC).`);
  }
  if (cyp?.substrateOf?.includes("CYP2C19") && profile.pgx.cyp2c19 === "PM") {
    factor *= 0.5;
    reasons.push(`CYP2C19 poor metabolizer → reduce dose (CPIC).`);
  }

  return { factor: Math.max(0.25, factor), reasons };
}

/**
 * Patient-aware modifier for the antidepressant response heuristic in
 * the clinical engine. Returns a `weightAdj` that callers can fold into
 * the baseline probResponse.
 */
export function antidepressantPriorAdjust(
  profile: PatientProfile,
  derived: DerivedMetrics,
): { weightAdj: number; reasons: string[] } {
  const reasons: string[] = [];
  let w = 0;
  if (derived.allostaticLoad != null && derived.allostaticLoad >= 6) {
    w -= 0.1;
    reasons.push("High allostatic load lowers expected SSRI responder probability.");
  }
  if (derived.diabetesStatus === "diabetes") {
    w -= 0.05;
    reasons.push("Comorbid diabetes modestly lowers MDD remission rates (STAR*D subgroup).");
  }
  if ((profile.lifestyle.exerciseMinutesPerWeek ?? 0) >= 150) {
    w += 0.07;
    reasons.push("Regular exercise raises antidepressant augmentation effect (Schuch 2016).");
  }
  if ((profile.lifestyle.drinksPerWeek ?? 0) >= 14) {
    w -= 0.08;
    reasons.push("Heavy alcohol use lowers antidepressant response (PMID 23337531).");
  }
  return { weightAdj: w, reasons };
}
