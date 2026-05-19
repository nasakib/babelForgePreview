/**
 * babelForge — anomaly scanning rule catalogue.
 *
 * Each rule maps a {patient profile + derived metrics} input to either
 * `null` (no flag) or an `AnomalyHit`. Rules are tagged with a `mode`:
 *
 *   - "verified" — fires only on guideline-anchored thresholds with a
 *       primary citation (USPSTF, ACC/AHA, KDIGO, ADA, NCEP ATP III,
 *       NICE, JNC 8, WHO, AAP, AACE). Suitable for clinical-grade hints.
 *   - "novice"   — looser pattern hints derived from self-report or
 *       wearable data, used as a "you might want to mention this to
 *       a clinician" gentle nudge. May lack a hard guideline anchor.
 *   - "both"     — verified threshold but worth surfacing in both modes.
 *
 * Output is *never* a diagnosis. The orchestrator in `scan.ts` enforces
 * the disclaimer banner. Every hit must include a `message` written in
 * plain English (Flesch-Kincaid ≤ grade 10) plus a `nextStep` describing
 * what a reasonable person would do next (almost always: "share with
 * your clinician").
 */

import type { PatientProfile } from "@/lib/patient/profile";
import type { DerivedMetrics } from "@/lib/patient/derived";

export type AnomalySystem =
  | "Cardiovascular"
  | "Respiratory"
  | "Neurological"
  | "Endocrine"
  | "Renal"
  | "Hepatic"
  | "Hematologic"
  | "Immune"
  | "Gastrointestinal"
  | "Musculoskeletal"
  | "Integumentary"
  | "Reproductive"
  | "Metabolic"
  | "Autonomic"
  | "Behavioral"
  | "Pharmacologic";

export type AnomalySeverity = "info" | "watch" | "concern" | "urgent";

export type AnomalyMode = "verified" | "novice";

export interface AnomalyHit {
  /** Rule id (stable, used for dedupe). */
  id: string;
  /** Body system tag — drives color in the UI. */
  system: AnomalySystem;
  severity: AnomalySeverity;
  /** One-line headline, no jargon. */
  title: string;
  /** Plain-English explanation: what babelForge saw, why it matters. */
  message: string;
  /** What a reasonable person would do next. */
  nextStep: string;
  /** Guideline / paper backing the threshold. Empty for novice-only rules. */
  citations: string[];
  /** Which mode produced the hit. */
  mode: AnomalyMode;
}

export interface AnomalyRule {
  id: string;
  system: AnomalySystem;
  modes: AnomalyMode[];
  check: (p: PatientProfile, d: DerivedMetrics) => Omit<AnomalyHit, "id" | "system" | "mode"> | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const has = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);

// ===========================================================================
// VERIFIED RULES — guideline-anchored thresholds
// ===========================================================================

export const VERIFIED_RULES: AnomalyRule[] = [
  // -------------------- Cardiovascular --------------------
  {
    id: "cv.hypertension.stage2",
    system: "Cardiovascular",
    modes: ["verified", "novice"],
    check: (p) => {
      const s = p.vitals.sbp;
      const d = p.vitals.dbp;
      if (!has(s) && !has(d)) return null;
      if ((has(s) && s >= 140) || (has(d) && d >= 90))
        return {
          severity: "concern",
          title: "Blood pressure in stage-2 hypertension range",
          message:
            `Recorded ${s ?? "?"}/${d ?? "?"} mmHg. ACC/AHA 2017 classifies sustained ` +
            "BP ≥ 140/90 as stage-2 hypertension.",
          nextStep:
            "Confirm with two repeat readings on separate days, then discuss with a clinician. " +
            "Home BP averaging is the most reliable measurement.",
          citations: ["ACC/AHA 2017 Hypertension Guideline (Whelton et al., Hypertension 2018)"],
        };
      if ((has(s) && s >= 130) || (has(d) && d >= 80))
        return {
          severity: "watch",
          title: "Blood pressure in stage-1 hypertension range",
          message:
            `Recorded ${s ?? "?"}/${d ?? "?"} mmHg. ACC/AHA 2017 considers 130–139 / 80–89 mmHg ` +
            "stage-1 hypertension.",
          nextStep:
            "Repeat over several days. Lifestyle changes (sodium, weight, exercise, sleep) often suffice " +
            "at this stage; clinical follow-up recommended.",
          citations: ["ACC/AHA 2017"],
        };
      return null;
    },
  },
  {
    id: "cv.hypertensive_urgency",
    system: "Cardiovascular",
    modes: ["verified", "novice"],
    check: (p) => {
      const s = p.vitals.sbp ?? 0;
      const d = p.vitals.dbp ?? 0;
      if (s >= 180 || d >= 120)
        return {
          severity: "urgent",
          title: "Blood pressure in hypertensive crisis range",
          message:
            `Recorded ${s}/${d} mmHg. Readings ≥ 180/120 mmHg are classified as hypertensive crisis.`,
          nextStep:
            "Re-measure after 5 minutes. If still ≥ 180/120 with any chest pain, vision changes, " +
            "weakness, or shortness of breath, seek emergency care now.",
          citations: ["ACC/AHA 2017", "JNC 8"],
        };
      return null;
    },
  },
  {
    id: "cv.bradycardia",
    system: "Cardiovascular",
    modes: ["verified"],
    check: (p) => {
      const h = p.vitals.hrRest;
      if (!has(h)) return null;
      if (h < 40 && (p.lifestyle.exerciseMinutesPerWeek ?? 0) < 300)
        return {
          severity: "concern",
          title: "Resting heart rate unusually low",
          message:
            `Resting HR ${h} bpm. In adults without endurance training, sustained HR < 40 bpm warrants ` +
            "evaluation for conduction disease.",
          nextStep: "Share with a clinician; a single ECG can rule out most concerning causes.",
          citations: ["ACC/AHA/HRS 2018 Bradycardia Guideline (Kusumoto et al., JACC 2019)"],
        };
      return null;
    },
  },
  {
    id: "cv.tachycardia_resting",
    system: "Cardiovascular",
    modes: ["verified"],
    check: (p) => {
      const h = p.vitals.hrRest;
      if (!has(h)) return null;
      if (h > 100)
        return {
          severity: "watch",
          title: "Resting heart rate above 100 bpm",
          message: `Resting HR ${h} bpm. Sinus tachycardia at rest can be benign (caffeine, anxiety, ` +
            "deconditioning) or signal anemia, thyroid disease, dehydration, or cardiac causes.",
          nextStep: "Recheck rested, hydrated, no caffeine for 4h. If persistent, share with a clinician.",
          citations: ["AHA Sinus Tachycardia Statement (Sheldon et al., Heart Rhythm 2015)"],
        };
      return null;
    },
  },
  {
    id: "cv.hypotension",
    system: "Cardiovascular",
    modes: ["verified"],
    check: (p) => {
      const s = p.vitals.sbp;
      if (!has(s)) return null;
      if (s < 90)
        return {
          severity: "concern",
          title: "Blood pressure unusually low",
          message: `Systolic ${s} mmHg. Sustained SBP < 90 mmHg with symptoms (dizziness, fainting) ` +
            "warrants prompt evaluation; without symptoms it is often baseline.",
          nextStep: "If symptomatic, contact a clinician; if dizzy + cool/clammy, seek urgent care.",
          citations: ["AHA Hypotension Statement 2019"],
        };
      return null;
    },
  },
  {
    id: "cv.dyslipidemia.ldl_high",
    system: "Cardiovascular",
    modes: ["verified", "novice"],
    check: (p, d) => {
      const ldl = p.labs.ldl ?? d.ldlCalc;
      if (!has(ldl)) return null;
      if (ldl >= 190)
        return {
          severity: "concern",
          title: "LDL cholesterol very high",
          message:
            `LDL ${ldl} mg/dL. The 2018 ACC/AHA cholesterol guideline calls LDL ≥ 190 mg/dL a ` +
            "statin-benefit group regardless of 10-year risk; consider screening for familial hypercholesterolemia.",
          nextStep: "Share with a clinician — lifelong cardiovascular risk reduction is high-impact at this level.",
          citations: ["2018 ACC/AHA Cholesterol Guideline (Grundy et al., Circulation 2019)"],
        };
      if (ldl >= 160)
        return {
          severity: "watch",
          title: "LDL cholesterol high",
          message: `LDL ${ldl} mg/dL. NCEP ATP III classifies LDL ≥ 160 mg/dL as "high".`,
          nextStep:
            "Diet (saturated fat ≤ 7% kcal), exercise, weight loss; recheck in 6–12 weeks and discuss with a clinician.",
          citations: ["NCEP ATP III 2002"],
        };
      return null;
    },
  },
  {
    id: "cv.dyslipidemia.hdl_low",
    system: "Cardiovascular",
    modes: ["verified"],
    check: (p) => {
      const sex = p.demographics.sex;
      const hdl = p.labs.hdl;
      if (!has(hdl)) return null;
      const thresh = sex === "male" ? 40 : 50;
      if (hdl < thresh)
        return {
          severity: "watch",
          title: "HDL ('good') cholesterol below reference",
          message: `HDL ${hdl} mg/dL (reference ≥ ${thresh} for ${sex ?? "adults"}).`,
          nextStep: "Aerobic exercise raises HDL ~5–10%; tobacco cessation also helps. Share trend with a clinician.",
          citations: ["NCEP ATP III 2002"],
        };
      return null;
    },
  },
  {
    id: "cv.triglycerides.high",
    system: "Cardiovascular",
    modes: ["verified"],
    check: (p) => {
      const tg = p.labs.triglycerides;
      if (!has(tg)) return null;
      if (tg >= 500)
        return {
          severity: "urgent",
          title: "Triglycerides very high — pancreatitis risk",
          message: `Triglycerides ${tg} mg/dL. ≥ 500 mg/dL meaningfully raises acute pancreatitis risk.`,
          nextStep: "Contact a clinician within days, not weeks. Avoid alcohol and large-fat meals in the meantime.",
          citations: ["Endocrine Society Hypertriglyceridemia Guideline (Berglund 2012)"],
        };
      if (tg >= 200)
        return {
          severity: "watch",
          title: "Triglycerides elevated",
          message: `Triglycerides ${tg} mg/dL. NCEP ATP III considers 200–499 mg/dL "high".`,
          nextStep:
            "Limit refined carbs / alcohol, increase omega-3 / activity; recheck fasting in 8–12 weeks.",
          citations: ["NCEP ATP III 2002"],
        };
      return null;
    },
  },
  // -------------------- Respiratory / Autonomic --------------------
  {
    id: "resp.hypoxia",
    system: "Respiratory",
    modes: ["verified", "novice"],
    check: (p) => {
      const o = p.vitals.spo2;
      if (!has(o)) return null;
      if (o < 88)
        return {
          severity: "urgent",
          title: "Oxygen saturation low",
          message: `SpO₂ ${o}%. Sustained < 88% defines significant hypoxemia.`,
          nextStep: "Verify with a fresh reading. If confirmed, seek urgent medical care.",
          citations: ["GOLD 2024 COPD Report"],
        };
      if (o < 92)
        return {
          severity: "concern",
          title: "Oxygen saturation below normal",
          message: `SpO₂ ${o}%. < 92% is below most adult reference ranges (with allowance for altitude).`,
          nextStep: "Recheck, warm fingers, no nail polish. Share trend with a clinician.",
          citations: ["BTS Emergency Oxygen Guideline 2017"],
        };
      return null;
    },
  },
  {
    id: "auto.hr_temp",
    system: "Autonomic",
    modes: ["verified"],
    check: (p) => {
      const t = p.vitals.tempC;
      if (!has(t)) return null;
      if (t >= 38.0)
        return {
          severity: "watch",
          title: "Fever",
          message: `Temperature ${t.toFixed(1)} °C ≥ 38.0 (oral).`,
          nextStep:
            "Hydrate, monitor every 4h. Seek care if T ≥ 39.5, persists > 3 days, or with stiff neck / rash / shortness of breath.",
          citations: ["IDSA 2008 Fever in the ICU"],
        };
      if (t < 35.0)
        return {
          severity: "urgent",
          title: "Body temperature low",
          message: `Temperature ${t.toFixed(1)} °C. < 35.0 is hypothermia.`,
          nextStep: "If accurate, seek urgent care — also recheck thermometer / measurement site.",
          citations: ["AHA 2010 Hypothermia"],
        };
      return null;
    },
  },
  // -------------------- Endocrine / Metabolic --------------------
  {
    id: "endo.a1c_diabetes",
    system: "Endocrine",
    modes: ["verified", "novice"],
    check: (p) => {
      const a = p.labs.hba1c;
      if (!has(a)) return null;
      if (a >= 6.5)
        return {
          severity: "concern",
          title: "HbA1c in diabetes range",
          message: `HbA1c ${a}%. ADA criteria: ≥ 6.5% on two occasions = diabetes.`,
          nextStep: "Share with a clinician; repeat A1c to confirm, then discuss treatment.",
          citations: ["ADA Standards of Care 2024"],
        };
      if (a >= 5.7)
        return {
          severity: "watch",
          title: "HbA1c in prediabetes range",
          message: `HbA1c ${a}%. ADA: 5.7–6.4% = prediabetes.`,
          nextStep:
            "DPP-style lifestyle change reduces 10-year diabetes risk ~58%. Recheck A1c in 6–12 months.",
          citations: ["ADA 2024", "DPP, NEJM 2002"],
        };
      return null;
    },
  },
  {
    id: "endo.fasting_glucose",
    system: "Endocrine",
    modes: ["verified"],
    check: (p) => {
      const g = p.labs.fastingGlucose;
      if (!has(g)) return null;
      if (g >= 126)
        return {
          severity: "concern",
          title: "Fasting glucose in diabetes range",
          message: `Fasting glucose ${g} mg/dL. ADA: ≥ 126 mg/dL on two occasions = diabetes.`,
          nextStep: "Confirm with a repeat fasting test or HbA1c, then see a clinician.",
          citations: ["ADA 2024"],
        };
      if (g >= 100)
        return {
          severity: "watch",
          title: "Impaired fasting glucose",
          message: `Fasting glucose ${g} mg/dL. ADA: 100–125 mg/dL = impaired fasting glucose.`,
          nextStep: "Lifestyle change is high-yield at this stage. Consider HbA1c if not done.",
          citations: ["ADA 2024"],
        };
      return null;
    },
  },
  {
    id: "endo.tsh",
    system: "Endocrine",
    modes: ["verified"],
    check: (p) => {
      const t = p.labs.tsh;
      if (!has(t)) return null;
      if (t > 10)
        return {
          severity: "concern",
          title: "TSH markedly elevated",
          message: `TSH ${t} mIU/L. > 10 typically indicates overt hypothyroidism.`,
          nextStep: "Share with a clinician; treatment usually involves levothyroxine.",
          citations: ["ATA Hypothyroidism Guideline (Jonklaas 2014)"],
        };
      if (t > 4.5)
        return {
          severity: "watch",
          title: "TSH mildly elevated",
          message: `TSH ${t} mIU/L. Above the common reference upper limit (~4.5).`,
          nextStep:
            "Recheck with free T4 in 4–8 weeks; subclinical hypothyroidism is common and often watched.",
          citations: ["ATA 2014"],
        };
      if (t < 0.4)
        return {
          severity: "watch",
          title: "TSH suppressed",
          message: `TSH ${t} mIU/L. Low TSH can indicate hyperthyroidism or pituitary issues.`,
          nextStep: "Check free T4 / T3; share with a clinician.",
          citations: ["ATA Hyperthyroidism Guideline (Ross 2016)"],
        };
      return null;
    },
  },
  {
    id: "endo.vitamin_d.deficient",
    system: "Endocrine",
    modes: ["verified", "novice"],
    check: (p) => {
      const v = p.labs.vitD;
      if (!has(v)) return null;
      if (v < 20)
        return {
          severity: "watch",
          title: "Vitamin D deficient",
          message: `25-OH Vitamin D ${v} ng/mL. < 20 = deficient (Endocrine Society).`,
          nextStep:
            "Daily 800–2000 IU D3 with food restores most adults in 8–12 weeks; recheck.",
          citations: ["Endocrine Society Vitamin D Guideline (Holick 2011)"],
        };
      return null;
    },
  },
  {
    id: "metab.metabolic_syndrome",
    system: "Metabolic",
    modes: ["verified"],
    check: (_, d) => {
      if (d.metSyndrome === true)
        return {
          severity: "concern",
          title: "Metabolic syndrome criteria likely met",
          message:
            "Three or more of: elevated triglycerides, low HDL, elevated BP, elevated fasting glucose, " +
            "central adiposity. This is a clustered risk pattern, not a disease in itself.",
          nextStep:
            "Share with a clinician. Lifestyle change alone reduces conversion to T2DM and improves all components.",
          citations: ["NCEP ATP III 2005 revision (Grundy, Circulation 2005)"],
        };
      return null;
    },
  },
  // -------------------- Renal / Hepatic --------------------
  {
    id: "renal.egfr_low",
    system: "Renal",
    modes: ["verified", "novice"],
    check: (_, d) => {
      const e = d.egfr;
      if (!has(e)) return null;
      if (e < 30)
        return {
          severity: "urgent",
          title: "Kidney filtration markedly reduced",
          message: `Estimated GFR ${e} mL/min/1.73m². KDIGO stage G4 (15–29).`,
          nextStep:
            "Confirm with a clinician; many medications need dose adjustment below this threshold.",
          citations: ["KDIGO 2024 CKD Guideline"],
        };
      if (e < 60)
        return {
          severity: "concern",
          title: "Kidney filtration reduced",
          message: `Estimated GFR ${e} mL/min/1.73m². KDIGO stage G3.`,
          nextStep:
            "Share with a clinician; review NSAID use and medication dosing.",
          citations: ["KDIGO 2024"],
        };
      return null;
    },
  },
  {
    id: "hepatic.transaminases",
    system: "Hepatic",
    modes: ["verified"],
    check: (p) => {
      const ast = p.labs.ast ?? 0;
      const alt = p.labs.alt ?? 0;
      if (ast > 200 || alt > 200)
        return {
          severity: "urgent",
          title: "Liver enzymes markedly elevated",
          message: `AST ${ast}, ALT ${alt} U/L. > 5× ULN suggests acute hepatocellular injury.`,
          nextStep: "Contact a clinician within days; review acetaminophen / alcohol / new medications.",
          citations: ["ACG Abnormal LFTs Guideline (Kwo et al., Am J Gastroenterol 2017)"],
        };
      if (ast > 80 || alt > 80)
        return {
          severity: "watch",
          title: "Liver enzymes elevated",
          message: `AST ${ast}, ALT ${alt} U/L. ~2× ULN.`,
          nextStep:
            "Recheck in 4–8 weeks; common causes include MASLD/NAFLD, alcohol, viral, medication.",
          citations: ["ACG 2017"],
        };
      return null;
    },
  },
  // -------------------- Hematologic --------------------
  {
    id: "heme.anemia",
    system: "Hematologic",
    modes: ["verified"],
    check: (p) => {
      const h = p.labs.hgb;
      const sex = p.demographics.sex;
      if (!has(h)) return null;
      const cutoff = sex === "male" ? 13 : 12;
      if (h < 8)
        return {
          severity: "urgent",
          title: "Hemoglobin very low",
          message: `Hemoglobin ${h} g/dL. WHO severe anemia (< 8).`,
          nextStep:
            "Contact a clinician promptly; severe anemia can require transfusion or rapid workup.",
          citations: ["WHO Anaemia Cutoffs 2011"],
        };
      if (h < cutoff)
        return {
          severity: "watch",
          title: "Hemoglobin below reference",
          message: `Hemoglobin ${h} g/dL (ref ≥ ${cutoff}).`,
          nextStep: "Share with a clinician; workup typically starts with iron studies + ferritin.",
          citations: ["WHO 2011"],
        };
      return null;
    },
  },
  {
    id: "heme.ferritin_low",
    system: "Hematologic",
    modes: ["verified"],
    check: (p) => {
      const f = p.labs.ferritin;
      if (!has(f)) return null;
      if (f < 30)
        return {
          severity: "watch",
          title: "Ferritin low — iron stores depleted",
          message: `Ferritin ${f} ng/mL. < 30 has 92% sensitivity / 98% specificity for iron deficiency.`,
          nextStep: "Share with a clinician; common cause is GI / menstrual loss or low intake.",
          citations: ["Mast AE et al., Am J Med 1998"],
        };
      return null;
    },
  },
  // -------------------- Immune / Inflammation --------------------
  {
    id: "immune.crp_high",
    system: "Immune",
    modes: ["verified"],
    check: (p) => {
      const c = p.labs.crpHs;
      if (!has(c)) return null;
      if (c > 10)
        return {
          severity: "watch",
          title: "C-reactive protein elevated",
          message: `hs-CRP ${c} mg/L. > 10 suggests acute inflammation/infection rather than ` +
            "cardiovascular risk stratification.",
          nextStep:
            "Recheck in 2–4 weeks once any current illness has resolved; persistent elevation warrants workup.",
          citations: ["CDC/AHA hs-CRP Statement (Pearson 2003)"],
        };
      return null;
    },
  },
  {
    id: "immune.b12_low",
    system: "Hematologic",
    modes: ["verified"],
    check: (p) => {
      const b = p.labs.vitB12;
      if (!has(b)) return null;
      if (b < 200)
        return {
          severity: "watch",
          title: "Vitamin B12 low",
          message: `B12 ${b} pg/mL. < 200 commonly accepted as deficient.`,
          nextStep:
            "Share with a clinician; oral 1000 mcg/day works for most causes; rule out pernicious anemia.",
          citations: ["BCSH Cobalamin Guideline 2014"],
        };
      return null;
    },
  },
  // -------------------- Electrolytes --------------------
  {
    id: "electro.k_high",
    system: "Renal",
    modes: ["verified"],
    check: (p) => {
      const k = p.labs.potassium;
      if (!has(k)) return null;
      if (k >= 6.0)
        return {
          severity: "urgent",
          title: "Potassium dangerously high",
          message: `K ${k} mEq/L. ≥ 6.0 risks arrhythmia.`,
          nextStep:
            "Verify the result is not hemolyzed and contact a clinician same day; ER if any chest symptoms.",
          citations: ["KDIGO Hyperkalemia 2022"],
        };
      if (k >= 5.5)
        return {
          severity: "concern",
          title: "Potassium elevated",
          message: `K ${k} mEq/L. Above the common reference upper limit (~5.0).`,
          nextStep:
            "Recheck with a clinician; review ACEi/ARB/spironolactone and dietary potassium.",
          citations: ["KDIGO 2022"],
        };
      return null;
    },
  },
  {
    id: "electro.na_low",
    system: "Renal",
    modes: ["verified"],
    check: (p) => {
      const n = p.labs.sodium;
      if (!has(n)) return null;
      if (n < 125)
        return {
          severity: "urgent",
          title: "Sodium markedly low",
          message: `Na ${n} mEq/L. < 125 is moderate-to-severe hyponatremia.`,
          nextStep: "Seek prompt clinical evaluation, especially with confusion / nausea / headache.",
          citations: ["European Hyponatremia Guideline 2014"],
        };
      return null;
    },
  },
  // -------------------- Behavioral / Psychometric --------------------
  {
    id: "behav.phq9_severe",
    system: "Behavioral",
    modes: ["verified", "novice"],
    check: (p) => {
      const s = p.psychometric.phq9;
      if (!has(s)) return null;
      if (s >= 20)
        return {
          severity: "concern",
          title: "Depression screen in severe range",
          message: `PHQ-9 ${s}. Scores ≥ 20 indicate severe depression.`,
          nextStep: "Reach out to a clinician this week. If any thought of self-harm, call/text 988 (US) now.",
          citations: ["Kroenke et al., J Gen Intern Med 2001"],
        };
      if (s >= 15)
        return {
          severity: "watch",
          title: "Depression screen in moderately-severe range",
          message: `PHQ-9 ${s}. 15–19 = moderately severe.`,
          nextStep: "Discuss with a clinician; combined therapy + medication is most effective at this level.",
          citations: ["Kroenke 2001"],
        };
      return null;
    },
  },
  {
    id: "behav.gad7_severe",
    system: "Behavioral",
    modes: ["verified", "novice"],
    check: (p) => {
      const g = p.psychometric.gad7;
      if (!has(g)) return null;
      if (g >= 15)
        return {
          severity: "watch",
          title: "Anxiety screen in severe range",
          message: `GAD-7 ${g}. ≥ 15 = severe.`,
          nextStep: "Share with a clinician; CBT + SSRIs are first-line.",
          citations: ["Spitzer et al., Arch Intern Med 2006"],
        };
      return null;
    },
  },
  {
    id: "behav.phq9_suicidality",
    system: "Behavioral",
    modes: ["verified", "novice"],
    check: (p) => {
      const s = p.psychometric.phq9;
      if (!has(s)) return null;
      // Item 9 of PHQ-9 is not captured separately; conservative trigger on any ≥ 10.
      if (s >= 10)
        return {
          severity: "info",
          title: "Reminder: if you are having thoughts of self-harm, you are not alone",
          message:
            "babelForge does not capture PHQ-9 item 9 directly, but moderate-to-severe depression is a " +
            "context where talking to someone matters.",
          nextStep:
            "US: call or text 988 (Suicide & Crisis Lifeline). UK: 116 123 (Samaritans). EU: 116 123. AU: 13 11 14.",
          citations: [],
        };
      return null;
    },
  },
];

// ===========================================================================
// NOVICE-MODE RULES — looser pattern hints from self-report / wearables
// ===========================================================================

export const NOVICE_RULES: AnomalyRule[] = [
  {
    id: "lifestyle.sleep_short",
    system: "Behavioral",
    modes: ["novice"],
    check: (p) => {
      const s = p.lifestyle.sleepHours;
      if (!has(s)) return null;
      if (s < 5)
        return {
          severity: "watch",
          title: "Short habitual sleep",
          message:
            `${s} h average. Adults consistently sleeping < 6 h have higher long-term risk for ` +
            "metabolic, cardiovascular and mood disturbance.",
          nextStep:
            "Try a consistent wake time, daylight in the first hour, and no caffeine after noon for 2 weeks.",
          citations: ["AASM/SRS consensus 2015"],
        };
      return null;
    },
  },
  {
    id: "lifestyle.exercise_low",
    system: "Cardiovascular",
    modes: ["novice"],
    check: (p) => {
      const m = p.lifestyle.exerciseMinutesPerWeek;
      if (!has(m)) return null;
      if (m < 75)
        return {
          severity: "info",
          title: "Activity below current guideline",
          message:
            `${m} min/wk moderate-vigorous activity. WHO recommends 150–300 min/wk.`,
          nextStep: "Even 30 min of brisk walking 3×/wk meaningfully lowers all-cause mortality.",
          citations: ["WHO Physical Activity Guidelines 2020"],
        };
      return null;
    },
  },
  {
    id: "lifestyle.alcohol_high",
    system: "Hepatic",
    modes: ["novice"],
    check: (p) => {
      const d = p.lifestyle.drinksPerWeek;
      if (!has(d)) return null;
      if (d >= 14)
        return {
          severity: "watch",
          title: "Alcohol intake above moderate-risk threshold",
          message: `${d} drinks/wk. NIAAA labels > 14 (men) / > 7 (women) as heavy drinking.`,
          nextStep:
            "Two consecutive alcohol-free days per week is a low-friction first step; share trend with a clinician if interested in cutting back.",
          citations: ["NIAAA Drinking Levels 2023"],
        };
      return null;
    },
  },
  {
    id: "lifestyle.smoking",
    system: "Cardiovascular",
    modes: ["novice"],
    check: (p) => {
      const c = p.lifestyle.cigarettesPerDay;
      if (!has(c)) return null;
      if (c > 0)
        return {
          severity: "watch",
          title: "Current tobacco use",
          message:
            "Smoking is the single largest modifiable contributor to cardiovascular and pulmonary risk.",
          nextStep:
            "Combined varenicline + behavioral counseling roughly triples 1-year quit rates vs willpower alone.",
          citations: ["USPSTF Tobacco Cessation 2021"],
        };
      return null;
    },
  },
  {
    id: "novice.stress_high",
    system: "Behavioral",
    modes: ["novice"],
    check: (p) => {
      const s = p.lifestyle.perceivedStress;
      if (!has(s)) return null;
      if (s >= 8)
        return {
          severity: "watch",
          title: "Self-reported stress very high",
          message: `Reported ${s}/10. Sustained high stress affects sleep, BP, glucose, and immune function.`,
          nextStep:
            "Pick one daily anchor (10 min walk, journaling, breathwork). Share trend with a clinician if persistent.",
          citations: [],
        };
      return null;
    },
  },
  {
    id: "novice.bmi",
    system: "Metabolic",
    modes: ["novice"],
    check: (_, d) => {
      if (!d.bmi) return null;
      if (d.bmiCategory === "underweight")
        return {
          severity: "watch",
          title: "BMI in underweight range",
          message: `BMI ${d.bmi}. < 18.5 can reflect malnutrition or unintentional weight loss.`,
          nextStep: "Share trend with a clinician; unintentional weight loss > 5% in 6 months always merits review.",
          citations: ["WHO BMI Classification"],
        };
      if (d.bmiCategory === "obese-II" || d.bmiCategory === "obese-III")
        return {
          severity: "watch",
          title: "BMI in higher-risk range",
          message: `BMI ${d.bmi}. ≥ 35 is associated with elevated cardiometabolic risk.`,
          nextStep:
            "Modern options range from structured lifestyle programs to GLP-1 medications and bariatric surgery — a clinician can sketch the menu.",
          citations: ["WHO BMI Classification"],
        };
      return null;
    },
  },
  {
    id: "novice.allostatic",
    system: "Autonomic",
    modes: ["novice"],
    check: (_, d) => {
      const a = d.allostaticLoad;
      if (!has(a)) return null;
      if (a >= 6)
        return {
          severity: "watch",
          title: "Composite physiological load high",
          message: `Allostatic load ${a}/10. Aggregates BP, HRV, glucose, inflammation, sleep, and mood signals.`,
          nextStep:
            "Not a diagnosis — but a useful prompt to discuss whole-system patterns at your next clinical visit.",
          citations: ["McEwen & Stellar, Arch Intern Med 1993"],
        };
      return null;
    },
  },
  {
    id: "novice.caffeine",
    system: "Autonomic",
    modes: ["novice"],
    check: (p) => {
      const c = p.lifestyle.caffeineMgPerDay;
      if (!has(c)) return null;
      if (c > 400)
        return {
          severity: "info",
          title: "Caffeine above FDA-suggested daily ceiling",
          message: `${c} mg/day. FDA notes 400 mg/day as generally not associated with adverse effects in healthy adults.`,
          nextStep: "If you notice palpitations / anxiety / poor sleep, taper gradually.",
          citations: ["FDA Caffeine Guidance 2018"],
        };
      return null;
    },
  },
];
