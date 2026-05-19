/**
 * Patient domain model — research preview.
 *
 * HIPAA NOTICE
 * ────────────
 * This module is intentionally **local-first**. No Patient record defined
 * here is ever transmitted to a backend in this preview build, because
 * babelForge is not currently deployed inside a HIPAA-covered
 * infrastructure (no BAAs, no audit log, no at-rest encryption guarantees,
 * no row-level access control).
 *
 * If/when those controls are added, the canonical PHI fields are flagged
 * below with a `// PHI` comment so a future redaction layer can target
 * them deterministically. Until then, clinicians are guided (via the form
 * and a banner) to enter de-identified surrogates only:
 *   - MRN  → an internal record number (not the real medical record #)
 *   - Initials only, no full name
 *   - Age range, not date of birth
 *   - ZIP3 / region, not full address
 */

export type Sex = "female" | "male" | "intersex" | "unspecified";
export type Gender =
  | "woman"
  | "man"
  | "nonbinary"
  | "transgender_woman"
  | "transgender_man"
  | "other"
  | "prefer_not_to_say";
export type Handedness = "right" | "left" | "ambidextrous";
export type PregnancyStatus = "not_applicable" | "none" | "pregnant" | "lactating" | "unknown";
export type PathologyCode = "PTSD" | "ADHD" | "TOURETTES" | "DEPRESSION";
export type Severity = "mild" | "moderate" | "severe";

/** Pharmacogenomic CYP phenotypes used in dose adjustment heuristics. */
export type CypPhenotype =
  | "poor"
  | "intermediate"
  | "extensive" // a.k.a. normal
  | "ultrarapid"
  | "unknown";

export interface AgeRange {
  /** Inclusive lower bound in years. */
  min: number;
  /** Inclusive upper bound in years. */
  max: number;
}

export interface Medication {
  name: string;
  doseMg?: number;
  schedule?: string; // e.g. "QD", "BID", "PRN"
}

export interface PathologyEntry {
  code: PathologyCode;
  severity: Severity;
  /** Year of onset (4-digit). Optional. */
  onsetYear?: number;
  /** Prior response: 0 = none, 1 = partial, 2 = remission. */
  priorResponse?: 0 | 1 | 2;
}

/**
 * Validated clinical scale instruments. Names follow the published
 * acronym so clinicians can read the chart at a glance. Score ranges
 * are enforced by `clampScale`.
 */
export interface ClinicalScales {
  phq9?: number;   // 0..27   (depression severity)
  gad7?: number;   // 0..21   (generalized anxiety)
  pcl5?: number;   // 0..80   (PTSD)
  asrs?: number;   // 0..24   (adult ADHD screener, part A composite)
  ygtss?: number;  // 0..100  (Tourette tic severity)
  auditc?: number; // 0..12   (alcohol use)
  moca?: number;   // 0..30   (cognitive)
}

export const SCALE_BOUNDS: Record<keyof ClinicalScales, [number, number]> = {
  phq9:   [0, 27],
  gad7:   [0, 21],
  pcl5:   [0, 80],
  asrs:   [0, 24],
  ygtss:  [0, 100],
  auditc: [0, 12],
  moca:   [0, 30],
};

export interface Pharmacogenomics {
  cyp2d6?: CypPhenotype;
  cyp2c19?: CypPhenotype;
  cyp3a4?: CypPhenotype;
  /** HLA-B*15:02 carrier status (carbamazepine SJS risk). */
  hlaB1502?: boolean;
  /** HLA-B*57:01 carrier status (abacavir hypersensitivity). */
  hlaB5701?: boolean;
}

export interface Vitals {
  heartRateBpm?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  sleepHours?: number;
}

export interface Patient {
  /** Stable internal id (uuid-ish). Never the real MRN. */
  id: string;
  /** Internal record number entered by clinician. PHI-adjacent. */ // PHI
  mrn: string;
  /** Initials only (e.g. "J.D."). PHI-adjacent. */                 // PHI
  initials: string;
  ageRange: AgeRange;
  sex: Sex;
  gender: Gender;
  handedness: Handedness;
  pregnancy: PregnancyStatus;

  weightKg?: number;
  heightCm?: number;

  /** Free-text allergy list. PHI-adjacent. */                       // PHI
  allergies: string[];
  /** Concurrent medications. PHI-adjacent. */                       // PHI
  medications: Medication[];
  /** Region surrogate (ZIP3, country, or city). PHI-adjacent. */    // PHI
  region?: string;

  pathologies: PathologyEntry[];
  scales: ClinicalScales;
  pgx: Pharmacogenomics;
  vitals: Vitals;

  /** Free-text clinical impression. PHI-adjacent. */                // PHI
  notes?: string;

  /** Clinician initials (audit surrogate). */
  clinician?: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Compute Body Mass Index when both height + weight are present. */
export function bmi(p: Pick<Patient, "weightKg" | "heightCm">): number | null {
  if (!p.weightKg || !p.heightCm) return null;
  const m = p.heightCm / 100;
  if (m <= 0) return null;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}

export function clampScale(
  key: keyof ClinicalScales,
  value: number | undefined
): number | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  const [lo, hi] = SCALE_BOUNDS[key];
  return Math.max(lo, Math.min(hi, Math.round(value)));
}

/** Returns a human-readable severity banding for PHQ-9. */
export function phq9Band(v: number | undefined): string {
  if (v === undefined) return "—";
  if (v <= 4) return "Minimal";
  if (v <= 9) return "Mild";
  if (v <= 14) return "Moderate";
  if (v <= 19) return "Moderately severe";
  return "Severe";
}

export function gad7Band(v: number | undefined): string {
  if (v === undefined) return "—";
  if (v <= 4) return "Minimal";
  if (v <= 9) return "Mild";
  if (v <= 14) return "Moderate";
  return "Severe";
}

/**
 * Maps the active patient's pathology list to the codes used by the
 * existing Console / Stack Builder so the topology composer reflects
 * the patient's actual diagnosis stack.
 */
export function patientToPathologyCodes(p: Patient | null): string[] {
  if (!p) return [];
  return p.pathologies.map((x) => x.code);
}

/**
 * Returns a per-CYP dose multiplier used as a clinical *hint* only.
 * 1.0 == standard; <1 == reduce dose; >1 == may require higher dose.
 * Source: simplified Clinical Pharmacogenetics Implementation Consortium
 * (CPIC) phenotype guidance.
 */
export function cypDoseMultiplier(pheno: CypPhenotype | undefined): number {
  switch (pheno) {
    case "poor": return 0.5;
    case "intermediate": return 0.75;
    case "extensive": return 1.0;
    case "ultrarapid": return 1.5;
    default: return 1.0;
  }
}

export const PATHOLOGY_LABELS: Record<PathologyCode, string> = {
  PTSD: "Post-Traumatic Stress",
  ADHD: "Attention-Deficit / Hyperactivity",
  TOURETTES: "Tourette Syndrome",
  DEPRESSION: "Major Depressive Disorder",
};

export const AGE_RANGES: AgeRange[] = [
  { min: 0,  max: 17 },
  { min: 18, max: 24 },
  { min: 25, max: 34 },
  { min: 35, max: 44 },
  { min: 45, max: 54 },
  { min: 55, max: 64 },
  { min: 65, max: 74 },
  { min: 75, max: 120 },
];
