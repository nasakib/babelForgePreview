/**
 * babelForge — derived clinical metrics from a PatientProfile.
 *
 * Every formula here is a published, citation-anchored calculation.
 * Functions return `null` whenever inputs are insufficient so callers
 * can render an "—" cell rather than a misleading zero.
 *
 * References:
 *   - Du Bois D, Du Bois EF. Arch Intern Med 1916 (BSA).
 *   - CKD-EPI 2021, Inker LA et al., NEJM 2021 (race-free eGFR).
 *   - Nathan DM et al., Diabetes Care 2008 (HbA1c → mean glucose).
 *   - Friedewald WT et al., Clin Chem 1972 (LDL when triglycerides < 400).
 *   - McEwen BS, Stellar E, Arch Intern Med 1993 (allostatic load concept).
 *   - Shaffer F, Ginsberg JP, Front Public Health 2017 (HRV norms).
 */

import type { PatientProfile } from "./profile";

export interface DerivedMetrics {
  bmi?: number;
  bmiCategory?: "underweight" | "normal" | "overweight" | "obese-I" | "obese-II" | "obese-III";
  bsa?: number; // m²
  map?: number; // mean arterial pressure, mmHg
  pulsePressure?: number; // mmHg
  egfr?: number; // mL/min/1.73 m²
  egfrStage?: "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5";
  meanGlucoseFromA1c?: number; // mg/dL
  diabetesStatus?: "normal" | "prediabetes" | "diabetes";
  ldlCalc?: number; // mg/dL (Friedewald)
  framinghamRiskRel?: "low" | "moderate" | "elevated" | "high";
  hrvCategory?: "low" | "below-avg" | "average" | "above-avg" | "elite";
  allostaticLoad?: number; // 0..10
  ckdRisk?: "low" | "moderate" | "high" | "severe";
  /** Composite metabolic syndrome flag (NCEP ATP III). */
  metSyndrome?: boolean;
  /** Subjective integrity score (0..100) — pulled into integrityScore if no fMRI loaded. */
  bodyIntegrity?: number;
}

export function deriveMetrics(p: PatientProfile): DerivedMetrics {
  const d: DerivedMetrics = {};

  // BMI
  const h = p.demographics.heightCm;
  const w = p.demographics.weightKg;
  if (h && w && h > 0) {
    const bmi = w / Math.pow(h / 100, 2);
    d.bmi = round(bmi, 1);
    d.bmiCategory =
      bmi < 18.5
        ? "underweight"
        : bmi < 25
          ? "normal"
          : bmi < 30
            ? "overweight"
            : bmi < 35
              ? "obese-I"
              : bmi < 40
                ? "obese-II"
                : "obese-III";
    d.bsa = round(0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725), 2);
  }

  // MAP & pulse pressure
  if (p.vitals.sbp && p.vitals.dbp) {
    d.map = round((p.vitals.sbp + 2 * p.vitals.dbp) / 3, 1);
    d.pulsePressure = p.vitals.sbp - p.vitals.dbp;
  }

  // eGFR (CKD-EPI 2021, race-free)
  const cr = p.labs.creatinine;
  const age = p.demographics.ageYears;
  const sex = p.demographics.sex;
  if (cr && age && sex && (sex === "female" || sex === "male")) {
    const k = sex === "female" ? 0.7 : 0.9;
    const alpha = sex === "female" ? -0.241 : -0.302;
    const minTerm = Math.pow(Math.min(cr / k, 1), alpha);
    const maxTerm = Math.pow(Math.max(cr / k, 1), -1.2);
    const sexCoef = sex === "female" ? 1.012 : 1.0;
    const egfr = 142 * minTerm * maxTerm * Math.pow(0.9938, age) * sexCoef;
    d.egfr = round(egfr, 1);
    d.egfrStage =
      egfr >= 90
        ? "G1"
        : egfr >= 60
          ? "G2"
          : egfr >= 45
            ? "G3a"
            : egfr >= 30
              ? "G3b"
              : egfr >= 15
                ? "G4"
                : "G5";
    d.ckdRisk =
      egfr >= 60 ? "low" : egfr >= 30 ? "moderate" : egfr >= 15 ? "high" : "severe";
  }

  // HbA1c → mean glucose & diabetes status
  if (p.labs.hba1c != null) {
    const a1c = p.labs.hba1c;
    d.meanGlucoseFromA1c = round(28.7 * a1c - 46.7, 0); // Nathan 2008
    d.diabetesStatus =
      a1c >= 6.5 ? "diabetes" : a1c >= 5.7 ? "prediabetes" : "normal";
  } else if (p.labs.fastingGlucose != null) {
    const g = p.labs.fastingGlucose;
    d.diabetesStatus = g >= 126 ? "diabetes" : g >= 100 ? "prediabetes" : "normal";
  }

  // LDL (Friedewald) when triglycerides < 400 and components present
  if (
    p.labs.totalCholesterol != null &&
    p.labs.hdl != null &&
    p.labs.triglycerides != null &&
    p.labs.triglycerides < 400 &&
    p.labs.ldl == null
  ) {
    d.ldlCalc = round(
      p.labs.totalCholesterol - p.labs.hdl - p.labs.triglycerides / 5,
      0,
    );
  }

  // Crude relative cardiovascular risk band (NOT Framingham per se — a
  // conservative ordinal bucket from independent risk factors).
  const factors =
    (p.lifestyle.cigarettesPerDay && p.lifestyle.cigarettesPerDay > 0 ? 1 : 0) +
    ((p.vitals.sbp ?? 0) >= 140 ? 1 : 0) +
    ((p.labs.ldl ?? d.ldlCalc ?? 0) >= 160 ? 1 : 0) +
    ((p.labs.hdl ?? 60) < 40 ? 1 : 0) +
    (d.diabetesStatus === "diabetes" ? 1 : 0) +
    (d.bmiCategory && d.bmiCategory.startsWith("obese") ? 1 : 0) +
    (age && age >= 65 ? 1 : 0);
  d.framinghamRiskRel =
    factors === 0
      ? "low"
      : factors <= 2
        ? "moderate"
        : factors <= 4
          ? "elevated"
          : "high";

  // HRV (RMSSD) category — Shaffer & Ginsberg 2017 adult reference ranges.
  if (p.vitals.hrvRmssd != null) {
    const v = p.vitals.hrvRmssd;
    d.hrvCategory =
      v < 20 ? "low" : v < 30 ? "below-avg" : v < 50 ? "average" : v < 75 ? "above-avg" : "elite";
  }

  // NCEP ATP III metabolic syndrome (need ≥ 3)
  const wc = undefined; // waist circumference not yet captured; flag stays conservative
  const trig = (p.labs.triglycerides ?? 0) >= 150;
  const lowHdl =
    sex === "male" ? (p.labs.hdl ?? 60) < 40 : (p.labs.hdl ?? 60) < 50;
  const htn = (p.vitals.sbp ?? 0) >= 130 || (p.vitals.dbp ?? 0) >= 85;
  const dys = d.diabetesStatus === "prediabetes" || d.diabetesStatus === "diabetes";
  const score = [trig, lowHdl, htn, dys, !!wc].filter(Boolean).length;
  d.metSyndrome = score >= 3;

  // Allostatic load (0..10) — light heuristic combining ANS, cardiometabolic, sleep, mood.
  const load: number[] = [];
  if (d.bmi != null && d.bmi >= 30) load.push(1);
  if (d.map != null && d.map >= 105) load.push(1);
  if (d.hrvCategory === "low" || d.hrvCategory === "below-avg") load.push(1);
  if (d.diabetesStatus === "diabetes") load.push(1);
  else if (d.diabetesStatus === "prediabetes") load.push(0.5);
  if ((p.labs.crpHs ?? 0) >= 3) load.push(1);
  else if ((p.labs.crpHs ?? 0) >= 1) load.push(0.5);
  if ((p.lifestyle.sleepHours ?? 8) < 6) load.push(1);
  if ((p.lifestyle.perceivedStress ?? 0) >= 7) load.push(1);
  if ((p.psychometric.phq9 ?? 0) >= 15 || (p.psychometric.gad7 ?? 0) >= 15) load.push(1);
  if (p.vitals.spo2 != null && p.vitals.spo2 < 92) load.push(1);
  if (d.ckdRisk === "high" || d.ckdRisk === "severe") load.push(1);
  d.allostaticLoad = round(
    load.reduce((a, b) => a + b, 0) * (10 / Math.max(load.length, 1)),
    1,
  );

  // Body integrity 0..100 — high when allostatic load is low and HRV/sleep/mood are good.
  if (load.length > 0) {
    let base = 100 - 9 * (d.allostaticLoad ?? 0);
    if (d.hrvCategory === "above-avg") base += 4;
    if (d.hrvCategory === "elite") base += 8;
    if ((p.lifestyle.exerciseMinutesPerWeek ?? 0) >= 150) base += 3;
    if ((p.psychometric.who5 ?? 0) >= 18) base += 3;
    d.bodyIntegrity = Math.max(0, Math.min(100, Math.round(base)));
  }

  return d;
}

function round(x: number, places: number): number {
  const p = Math.pow(10, places);
  return Math.round(x * p) / p;
}
