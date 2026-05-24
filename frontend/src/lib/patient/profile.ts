/**
 * babelForge — Full Body Context (patient profile).
 *
 * Canonical model for everything the engines need to reason about a
 * specific human. Designed for additive growth: every section is optional
 * so the user can fill in as much or as little as they want without
 * breaking downstream consumers.
 *
 * Privacy note: this object lives in the browser's localStorage only.
 * No PHI is shipped to the backend unless the user explicitly invokes
 * the AI assistant or council — and in those cases only the summary
 * fields (no name, no identifiers) ride along.
 */

export type Sex = "female" | "male" | "intersex" | "unspecified";

export interface PatientDemographics {
  ageYears?: number;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  pregnant?: boolean;
  breastfeeding?: boolean;
  ethnicity?: string;
}

export interface PatientVitals {
  /** Resting heart rate (bpm). */
  hrRest?: number;
  /** Heart-rate variability — RMSSD (ms). */
  hrvRmssd?: number;
  /** Systolic / diastolic blood pressure (mmHg). */
  sbp?: number;
  dbp?: number;
  /** Peripheral oxygen saturation (%). */
  spo2?: number;
  /** Respiratory rate (breaths/min). */
  rr?: number;
  /** Body temperature (°C). */
  tempC?: number;
}

/**
 * Common lab panel. All optional. Units are SI / US-mix per the most
 * widely reported convention in the modern English literature.
 */
export interface PatientLabs {
  /** Fasting glucose (mg/dL). */
  fastingGlucose?: number;
  /** Glycated hemoglobin (%). */
  hba1c?: number;
  /** Serum creatinine (mg/dL). */
  creatinine?: number;
  /** Blood urea nitrogen (mg/dL). */
  bun?: number;
  /** Total cholesterol (mg/dL). */
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  /** C-reactive protein (mg/L), high-sensitivity. */
  crpHs?: number;
  /** Thyroid-stimulating hormone (mIU/L). */
  tsh?: number;
  ft4?: number;
  /** 25-OH Vitamin D (ng/mL). */
  vitD?: number;
  vitB12?: number;
  ferritin?: number;
  /** Sodium (mEq/L). */
  sodium?: number;
  potassium?: number;
  /** Hemoglobin (g/dL). */
  hgb?: number;
  /** Liver enzymes (U/L). */
  alt?: number;
  ast?: number;
}

export interface PatientCondition {
  /** Short label (e.g. "Type 2 diabetes", "Major depressive disorder"). */
  name: string;
  /** ICD-10 code if known. */
  icd10?: string;
  /** Year of onset. */
  onsetYear?: number;
  /** Currently active vs. in remission. */
  status?: "active" | "remission" | "resolved";
}

export interface PatientMedication {
  /** Generic drug name. */
  name: string;
  /** Daily dose (mg). */
  doseMg?: number;
  /** Frequency code: QD, BID, TID, QID, PRN. */
  freq?: "QD" | "BID" | "TID" | "QID" | "PRN" | "weekly";
  /** Route. */
  route?: "PO" | "SL" | "IV" | "IM" | "SC" | "TD" | "INH" | "PR";
  /** Indication. */
  indication?: string;
}

export interface PatientAllergy {
  agent: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "anaphylaxis";
}

export interface PatientFamilyHx {
  relation: "mother" | "father" | "sibling" | "child" | "grandparent" | "other";
  condition: string;
  ageAtOnset?: number;
}

export interface PatientLifestyle {
  /** Cigarettes/day (0 = nonsmoker). */
  cigarettesPerDay?: number;
  /** Standard drinks per week. */
  drinksPerWeek?: number;
  /** Average sleep duration (hours). */
  sleepHours?: number;
  /** Subjective sleep quality 1..10. */
  sleepQuality?: number;
  /** Minutes of moderate-to-vigorous activity per week. */
  exerciseMinutesPerWeek?: number;
  /** Subjective stress 1..10. */
  perceivedStress?: number;
  /** Diet pattern. */
  dietPattern?:
    | "omnivore"
    | "mediterranean"
    | "vegetarian"
    | "vegan"
    | "keto"
    | "carnivore"
    | "other";
  /** Caffeine mg/day. */
  caffeineMgPerDay?: number;
}

export interface PatientPharmacogenomics {
  /** CYP2D6 phenotype. */
  cyp2d6?: "PM" | "IM" | "NM" | "RM" | "UM";
  cyp2c19?: "PM" | "IM" | "NM" | "RM" | "UM";
  cyp3a4?: "PM" | "IM" | "NM" | "RM" | "UM";
  /** MTHFR variant. */
  mthfr?: "wild" | "C677T_het" | "C677T_hom" | "A1298C_het" | "A1298C_hom";
  /** HLA-B*1502 (carbamazepine SJS risk). */
  hlaB1502?: boolean;
}

export interface PatientPsychometric {
  /** Latest PHQ-9 score (0..27). */
  phq9?: number;
  /** Latest GAD-7 score (0..21). */
  gad7?: number;
  /** Latest PCL-5 (PTSD) score (0..80). */
  pcl5?: number;
  /** Subjective wellbeing (WHO-5) 0..25. */
  who5?: number;
  /** MoCA (0..30). */
  moca?: number;
  /** Latest Budapest Criteria (CRPS) score (0..17). */
  budapest?: number;
}

export interface IngestionHistoryLog {
  compoundId: string;
  administrationsLast30Days: number; // Frequency tracking parameter
  consecutiveDaysActive: number;     // Tracking variable for tolerance or neuroplastic compounding
  totalDoseExposed: number;          // Cumulative load metric
}

export interface PatientProfile {
  /** Pseudonymous handle the user picks. No real names. */
  handle: string;
  /** Last update timestamp (ms). */
  updatedAt: number;
  demographics: PatientDemographics;
  vitals: PatientVitals;
  labs: PatientLabs;
  conditions: PatientCondition[];
  medications: PatientMedication[];
  allergies: PatientAllergy[];
  familyHx: PatientFamilyHx[];
  lifestyle: PatientLifestyle;
  pgx: PatientPharmacogenomics;
  psychometric: PatientPsychometric;
  id?: string;
  weightKg?: number;
  ageYears?: number;
  historyLogs?: IngestionHistoryLog[];
}

export const EMPTY_PROFILE: PatientProfile = {
  handle: "you",
  updatedAt: 0,
  demographics: {},
  vitals: {},
  labs: {},
  conditions: [],
  medications: [],
  allergies: [],
  familyHx: [],
  lifestyle: {},
  pgx: {},
  psychometric: {},
};

/** Strip empty branches so the AI payload stays compact. */
export function compactProfile(p: PatientProfile): Record<string, unknown> {
  const out: Record<string, unknown> = { handle: p.handle };
  const sectionEmpty = (o: object) =>
    Object.values(o).every((v) =>
      v == null || (Array.isArray(v) && v.length === 0) || v === "",
    );
  if (!sectionEmpty(p.demographics)) out.demographics = stripNulls(p.demographics);
  if (!sectionEmpty(p.vitals)) out.vitals = stripNulls(p.vitals);
  if (!sectionEmpty(p.labs)) out.labs = stripNulls(p.labs);
  if (p.conditions.length) out.conditions = p.conditions;
  if (p.medications.length) out.medications = p.medications;
  if (p.allergies.length) out.allergies = p.allergies;
  if (p.familyHx.length) out.familyHx = p.familyHx;
  if (!sectionEmpty(p.lifestyle)) out.lifestyle = stripNulls(p.lifestyle);
  if (!sectionEmpty(p.pgx)) out.pgx = stripNulls(p.pgx);
  if (!sectionEmpty(p.psychometric)) out.psychometric = stripNulls(p.psychometric);
  return out;
}

function stripNulls<T extends Record<string, any>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in o) {
    const v = o[k];
    if (v != null && v !== "") out[k] = v;
  }
  return out;
}
