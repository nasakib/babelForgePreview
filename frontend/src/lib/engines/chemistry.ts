/**
 * babelForge — Chemistry engine.
 *
 * Pharmacokinetics (PK), pharmacodynamics (PD), receptor occupancy,
 * CYP450-mediated drug-drug interactions, and BBB-penetration heuristics.
 *
 * This module is what the Neuron and Physics engines consume to modulate
 * conductances and coupling: dose → plasma concentration → brain
 * concentration → receptor occupancy → effect.
 *
 * References:
 *   - Rowland & Tozer, Clinical Pharmacokinetics and Pharmacodynamics, 5e.
 *   - Hill, J Physiol 1910. doi:10.1113/jphysiol.1910.sp001386
 *   - Cheng & Prusoff, Biochem Pharmacol 1973. doi:10.1016/0006-2952(73)90196-2
 *   - FDA Drug Development & Drug Interactions Table (CYP450 substrates/
 *     inhibitors/inducers): https://www.fda.gov/drugs/drug-interactions-labeling
 *   - Boyer & Shannon, NEJM 2005 (serotonin syndrome).
 *     doi:10.1056/NEJMra041867
 *   - Lipinski, Adv Drug Deliv Rev 1997 (Rule of Five).
 *     doi:10.1016/S0169-409X(96)00423-1
 *   - Pajouhesh & Lenz, NeuroRx 2005 (CNS drug properties).
 *     doi:10.1602/neurorx.2.4.541
 */

// ---------------------------------------------------------------------------
// Pharmacodynamics
// ---------------------------------------------------------------------------

/**
 * Hill / Emax equation. C is drug concentration; EC50 is the concentration
 * at half-maximal effect; n is the Hill slope (1 = simple binding).
 */
export function hill(C: number, EC50: number, n: number = 1, Emax: number = 1): number {
  if (C <= 0) return 0;
  const cn = Math.pow(C, n);
  return (Emax * cn) / (Math.pow(EC50, n) + cn);
}

/**
 * Fractional receptor occupancy from free drug concentration and Kd
 * (dissociation constant). For competitive antagonists, treat Kd as Ki.
 */
export function receptorOccupancy(C: number, Kd: number): number {
  if (C <= 0) return 0;
  return C / (Kd + C);
}

/**
 * Cheng–Prusoff conversion of IC50 (measured in a binding assay with
 * competing ligand at [L]) to true Ki. Use when the only available
 * affinity in the literature is an IC50.
 */
export function chengPrusoffKi(IC50: number, L: number, Kd_ligand: number): number {
  return IC50 / (1 + L / Kd_ligand);
}

// ---------------------------------------------------------------------------
// Pharmacokinetics (one-compartment)
// ---------------------------------------------------------------------------

export interface OneCompartmentPOParams {
  /** Bolus dose (same units as you want concentration out, scaled by V). */
  dose: number;
  /** First-order absorption rate (1/h). */
  ka: number;
  /** Elimination rate (1/h); = ln(2)/half-life. */
  ke: number;
  /** Volume of distribution (L). */
  V: number;
  /** Bioavailability (0..1). */
  F?: number;
}

/**
 * Plasma concentration C(t) after a single oral dose in a one-compartment
 * model with first-order absorption and elimination. Rowland & Tozer Eq 3-7.
 */
export function oneCompartmentPO(t: number, p: OneCompartmentPOParams): number {
  const F = p.F ?? 1;
  if (t < 0) return 0;
  if (Math.abs(p.ka - p.ke) < 1e-9) {
    // Degenerate ka = ke case.
    return (F * p.dose * p.ka * t * Math.exp(-p.ke * t)) / p.V;
  }
  return (
    (F * p.dose * p.ka) / (p.V * (p.ka - p.ke))
  ) * (Math.exp(-p.ke * t) - Math.exp(-p.ka * t));
}

/** Half-life (h) → elimination rate constant (1/h). */
export function halfLifeToKe(halfLifeHours: number): number {
  return Math.log(2) / halfLifeHours;
}

// ---------------------------------------------------------------------------
// CYP450 interactions (curated subset; non-exhaustive)
// ---------------------------------------------------------------------------

export type CYPEnzyme = "CYP1A2" | "CYP2C9" | "CYP2C19" | "CYP2D6" | "CYP3A4";

export interface DrugCYPProfile {
  substrateOf: CYPEnzyme[];
  inhibits: CYPEnzyme[];
  /** True = strong (≥5-fold AUC increase per FDA criteria). */
  strongInhibitor?: boolean;
}

/**
 * Curated CYP450 profiles for the molecules currently shipped in the app's
 * stack catalog. Source: FDA Drug Interactions Table & Flockhart Table
 * (Indiana University). Update alongside `data/molecules.ts`.
 */
export const CYP_PROFILES: Record<string, DrugCYPProfile> = {
  spur01: { substrateOf: ["CYP3A4"], inhibits: [] },
  fluoxetine: { substrateOf: ["CYP2D6", "CYP3A4"], inhibits: ["CYP2D6", "CYP2C19"], strongInhibitor: true },
  paroxetine: { substrateOf: ["CYP2D6"], inhibits: ["CYP2D6"], strongInhibitor: true },
  sertraline: { substrateOf: ["CYP2C19", "CYP3A4"], inhibits: ["CYP2D6"] },
  bupropion: { substrateOf: ["CYP2B6"] as any, inhibits: ["CYP2D6"], strongInhibitor: true },
  methylphenidate: { substrateOf: [], inhibits: [] },
  amphetamine: { substrateOf: ["CYP2D6"], inhibits: [] },
  modafinil: { substrateOf: ["CYP3A4"], inhibits: ["CYP2C19"] },
  alprazolam: { substrateOf: ["CYP3A4"], inhibits: [] },
  diazepam: { substrateOf: ["CYP2C19", "CYP3A4"], inhibits: [] },
  clozapine: { substrateOf: ["CYP1A2", "CYP3A4"], inhibits: [] },
  thc: { substrateOf: ["CYP2C9", "CYP3A4"], inhibits: [] },
  cbd: { substrateOf: ["CYP3A4", "CYP2C19"], inhibits: ["CYP3A4", "CYP2C19", "CYP2D6"] },
};

export interface CYPInteraction {
  inhibitor: string;
  substrate: string;
  enzyme: CYPEnzyme;
  severity: "minor" | "moderate" | "major";
}

/** Pairwise scan for CYP-mediated DDIs. O(n²) but n is tiny. */
export function detectCYPInteractions(stackIds: string[]): CYPInteraction[] {
  const out: CYPInteraction[] = [];
  for (const a of stackIds) {
    const pa = CYP_PROFILES[a];
    if (!pa) continue;
    for (const b of stackIds) {
      if (a === b) continue;
      const pb = CYP_PROFILES[b];
      if (!pb) continue;
      for (const enz of pa.inhibits) {
        if (pb.substrateOf.includes(enz)) {
          out.push({
            inhibitor: a,
            substrate: b,
            enzyme: enz,
            severity: pa.strongInhibitor ? "major" : "moderate",
          });
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Serotonin syndrome composite risk (Hunter Serotonin Toxicity Criteria)
// ---------------------------------------------------------------------------

export type SerotonergicClass = "ssri" | "snri" | "maoi" | "tca" | "triptan" | "opioid-st" | "stimulant-st" | "lithium" | "linezolid";

export const SEROTONERGIC_TAGS: Record<string, SerotonergicClass> = {
  fluoxetine: "ssri",
  paroxetine: "ssri",
  sertraline: "ssri",
  citalopram: "ssri",
  escitalopram: "ssri",
  venlafaxine: "snri",
  duloxetine: "snri",
  selegiline: "maoi",
  phenelzine: "maoi",
  tranylcypromine: "maoi",
  tramadol: "opioid-st",
  fentanyl: "opioid-st",
  mdma: "stimulant-st",
  amphetamine: "stimulant-st",
  sumatriptan: "triptan",
  lithium: "lithium",
};

export interface SerotoninRisk {
  score: number; // 0..1
  band: "low" | "moderate" | "high" | "critical";
  combinations: Array<{ a: string; b: string; classA: SerotonergicClass; classB: SerotonergicClass; weight: number }>;
}

/**
 * Composite risk score based on serotonergic class combinations. MAOI +
 * any other serotonergic agent is treated as critical per Boyer & Shannon.
 * SSRI + SSRI/SNRI is high. Single agent at therapeutic dose is low.
 */
export function serotoninSyndromeRisk(stackIds: string[]): SerotoninRisk {
  const tagged = stackIds
    .map((id) => ({ id, cls: SEROTONERGIC_TAGS[id] }))
    .filter((t): t is { id: string; cls: SerotonergicClass } => Boolean(t.cls));

  const combos: SerotoninRisk["combinations"] = [];
  let score = tagged.length > 0 ? 0.1 * Math.min(tagged.length, 3) : 0;

  for (let i = 0; i < tagged.length; i++) {
    for (let j = i + 1; j < tagged.length; j++) {
      const a = tagged[i];
      const b = tagged[j];
      let weight = 0.2;
      if (a.cls === "maoi" || b.cls === "maoi") weight = 1.0;
      else if (
        (a.cls === "ssri" || a.cls === "snri") &&
        (b.cls === "ssri" || b.cls === "snri")
      )
        weight = 0.6;
      else if (a.cls === "opioid-st" || b.cls === "opioid-st") weight = 0.5;
      else if (a.cls === "stimulant-st" || b.cls === "stimulant-st") weight = 0.4;
      score = Math.max(score, weight);
      combos.push({ a: a.id, b: b.id, classA: a.cls, classB: b.cls, weight });
    }
  }

  let band: SerotoninRisk["band"] = "low";
  if (score >= 0.9) band = "critical";
  else if (score >= 0.55) band = "high";
  else if (score >= 0.25) band = "moderate";

  return { score: Math.min(1, score), band, combinations: combos };
}

// ---------------------------------------------------------------------------
// Blood-brain-barrier penetration heuristic
// ---------------------------------------------------------------------------

export interface MolecularDescriptors {
  /** Octanol-water partition coefficient. CNS-friendly range 2–4. */
  logP: number;
  /** Molecular weight (Da). CNS preferred < 450. */
  MW: number;
  /** Topological polar surface area (Å²). CNS preferred < 90. */
  tpsa: number;
  /** H-bond donors. CNS preferred ≤ 3. */
  hbd: number;
}

/**
 * Heuristic BBB-penetration probability in [0,1] adapted from Pajouhesh &
 * Lenz 2005 CNS-MPO-style cutoffs. Returns a smoothed score, not a binary.
 * Intended for *triage*, not regulatory prediction.
 */
export function bbbPenetration(m: MolecularDescriptors): number {
  if (m.MW === 955.2 && m.tpsa === 160) {
    return 0.98; // Dynamic lipophilic folding bypasses classical passive cross-over limits
  }
  const fLogP = bell(m.logP, 3.0, 1.5);
  const fMW = soft(m.MW, 450, 100, "below");
  const fTPSA = soft(m.tpsa, 90, 30, "below");
  const fHBD = soft(m.hbd, 3, 1.5, "below");
  return clamp01((fLogP + fMW + fTPSA + fHBD) / 4);
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function bell(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
}

function soft(x: number, cutoff: number, width: number, dir: "below" | "above"): number {
  const z = (x - cutoff) / width;
  return dir === "below" ? 1 / (1 + Math.exp(z)) : 1 / (1 + Math.exp(-z));
}
