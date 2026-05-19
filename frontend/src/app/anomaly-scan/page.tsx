"use client";

/**
 * Anomaly Scan — clinical heads-up page.
 *
 * Lets the user enter vitals + labs + lifestyle + meds + conditions
 * inline, persists to localStorage under its own key (separate from the
 * older multi-patient store), and renders <AnomalyScanner /> beside the
 * form. Two modes: Verified (guideline-anchored) and Novice (broader).
 */

import { useEffect, useMemo, useState } from "react";
import AnomalyScanner from "@/components/AnomalyScanner";
import { EMPTY_PROFILE, type PatientProfile } from "@/lib/patient/profile";
import { deriveMetrics } from "@/lib/patient/derived";

const STORAGE_KEY = "babelforge:anomaly:profile:v1";

function load(): PatientProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export default function AnomalyScanPage() {
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* quota — ignore */
    }
  }, [profile, hydrated]);

  const derived = useMemo(() => deriveMetrics(profile), [profile]);

  const set = <K extends keyof PatientProfile>(k: K, v: PatientProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v, updatedAt: Date.now() }));

  const setDemo = (patch: Partial<PatientProfile["demographics"]>) =>
    set("demographics", { ...profile.demographics, ...patch });
  const setVitals = (patch: Partial<PatientProfile["vitals"]>) =>
    set("vitals", { ...profile.vitals, ...patch });
  const setLabs = (patch: Partial<PatientProfile["labs"]>) =>
    set("labs", { ...profile.labs, ...patch });
  const setLifestyle = (patch: Partial<PatientProfile["lifestyle"]>) =>
    set("lifestyle", { ...profile.lifestyle, ...patch });
  const setPsych = (patch: Partial<PatientProfile["psychometric"]>) =>
    set("psychometric", { ...profile.psychometric, ...patch });

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-void lg:block">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Left Sidebar: Data Entry */}
      <aside className="w-full lg:w-[420px] lg:absolute lg:left-4 lg:top-4 lg:bottom-4 z-10 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col overflow-y-auto custom-scrollbar shadow-2xl pointer-events-auto">
        <div className="clinical-card-header flex-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
            Clinical · heads-up scanner
          </span>
          <h1 className="text-xl font-bold text-ink mt-1">Anomaly Scan</h1>
        </div>

        <div className="p-4 border-b border-line flex-none">
          <p className="text-xs text-ink-muted leading-relaxed">
            Enter what you know — vitals, labs, lifestyle, meds. babelForge cross-checks against published thresholds (Verified) and adds pattern hints (Novice).
          </p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <Section title="Demographics">
            <NumInput label="Age (yr)" v={profile.demographics.ageYears} onChange={(v) => setDemo({ ageYears: v })} />
            <SelectInput
              label="Sex"
              v={profile.demographics.sex ?? ""}
              options={[
                { v: "", l: "—" },
                { v: "female", l: "Female" },
                { v: "male", l: "Male" },
                { v: "intersex", l: "Intersex" },
                { v: "unspecified", l: "Unspecified" },
              ]}
              onChange={(v) => setDemo({ sex: (v || undefined) as any })}
            />
            <NumInput label="Height (cm)" v={profile.demographics.heightCm} onChange={(v) => setDemo({ heightCm: v })} />
            <NumInput label="Weight (kg)" v={profile.demographics.weightKg} onChange={(v) => setDemo({ weightKg: v })} />
          </Section>

          <Section title="Vitals">
            <NumInput label="Resting HR (bpm)" v={profile.vitals.hrRest} onChange={(v) => setVitals({ hrRest: v })} />
            <NumInput label="HRV RMSSD (ms)" v={profile.vitals.hrvRmssd} onChange={(v) => setVitals({ hrvRmssd: v })} />
            <NumInput label="Systolic BP (mmHg)" v={profile.vitals.sbp} onChange={(v) => setVitals({ sbp: v })} />
            <NumInput label="Diastolic BP (mmHg)" v={profile.vitals.dbp} onChange={(v) => setVitals({ dbp: v })} />
            <NumInput label="SpO₂ (%)" v={profile.vitals.spo2} onChange={(v) => setVitals({ spo2: v })} />
            <NumInput label="Resp rate (br/min)" v={profile.vitals.rr} onChange={(v) => setVitals({ rr: v })} />
            <NumInput label="Temperature (°C)" v={profile.vitals.tempC} onChange={(v) => setVitals({ tempC: v })} step={0.1} />
          </Section>

          <Section title="Labs (optional)">
            <NumInput label="Fasting glucose (mg/dL)" v={profile.labs.fastingGlucose} onChange={(v) => setLabs({ fastingGlucose: v })} />
            <NumInput label="HbA1c (%)" v={profile.labs.hba1c} onChange={(v) => setLabs({ hba1c: v })} step={0.1} />
            <NumInput label="Creatinine (mg/dL)" v={profile.labs.creatinine} onChange={(v) => setLabs({ creatinine: v })} step={0.01} />
            <NumInput label="Total cholesterol" v={profile.labs.totalCholesterol} onChange={(v) => setLabs({ totalCholesterol: v })} />
            <NumInput label="LDL" v={profile.labs.ldl} onChange={(v) => setLabs({ ldl: v })} />
            <NumInput label="HDL" v={profile.labs.hdl} onChange={(v) => setLabs({ hdl: v })} />
            <NumInput label="Triglycerides" v={profile.labs.triglycerides} onChange={(v) => setLabs({ triglycerides: v })} />
            <NumInput label="hs-CRP (mg/L)" v={profile.labs.crpHs} onChange={(v) => setLabs({ crpHs: v })} step={0.1} />
            <NumInput label="TSH (mIU/L)" v={profile.labs.tsh} onChange={(v) => setLabs({ tsh: v })} step={0.1} />
            <NumInput label="Vit D 25-OH (ng/mL)" v={profile.labs.vitD} onChange={(v) => setLabs({ vitD: v })} />
            <NumInput label="Vit B12 (pg/mL)" v={profile.labs.vitB12} onChange={(v) => setLabs({ vitB12: v })} />
            <NumInput label="Ferritin (ng/mL)" v={profile.labs.ferritin} onChange={(v) => setLabs({ ferritin: v })} />
            <NumInput label="Na (mEq/L)" v={profile.labs.sodium} onChange={(v) => setLabs({ sodium: v })} step={0.1} />
            <NumInput label="K (mEq/L)" v={profile.labs.potassium} onChange={(v) => setLabs({ potassium: v })} step={0.1} />
            <NumInput label="Hgb (g/dL)" v={profile.labs.hgb} onChange={(v) => setLabs({ hgb: v })} step={0.1} />
            <NumInput label="ALT (U/L)" v={profile.labs.alt} onChange={(v) => setLabs({ alt: v })} />
            <NumInput label="AST (U/L)" v={profile.labs.ast} onChange={(v) => setLabs({ ast: v })} />
          </Section>

          <Section title="Lifestyle (novice mode)">
            <NumInput label="Sleep (h / night)" v={profile.lifestyle.sleepHours} onChange={(v) => setLifestyle({ sleepHours: v })} step={0.5} />
            <NumInput label="Exercise (min/wk)" v={profile.lifestyle.exerciseMinutesPerWeek} onChange={(v) => setLifestyle({ exerciseMinutesPerWeek: v })} />
            <NumInput label="Alcohol (drinks/wk)" v={profile.lifestyle.drinksPerWeek} onChange={(v) => setLifestyle({ drinksPerWeek: v })} />
            <NumInput label="Cigarettes/day" v={profile.lifestyle.cigarettesPerDay} onChange={(v) => setLifestyle({ cigarettesPerDay: v })} />
            <NumInput label="Caffeine (mg/day)" v={profile.lifestyle.caffeineMgPerDay} onChange={(v) => setLifestyle({ caffeineMgPerDay: v })} />
            <NumInput label="Perceived stress 1–10" v={profile.lifestyle.perceivedStress} onChange={(v) => setLifestyle({ perceivedStress: v })} />
          </Section>

          <Section title="Psychometric (optional)">
            <NumInput label="PHQ-9 (0–27)" v={profile.psychometric.phq9} onChange={(v) => setPsych({ phq9: v })} />
            <NumInput label="GAD-7 (0–21)" v={profile.psychometric.gad7} onChange={(v) => setPsych({ gad7: v })} />
          </Section>

          <button
            type="button"
            onClick={() => setProfile({ ...EMPTY_PROFILE })}
            className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted hover:text-crit border border-line hover:border-crit/60 rounded-clinical px-2.5 py-1"
          >
            Clear all
          </button>
          </div>
        </aside>

        {/* ─── Scanner output ─── */}
        <aside className="w-full lg:w-[480px] lg:absolute lg:right-4 lg:top-4 lg:bottom-4 z-10 border-t lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col overflow-y-auto custom-scrollbar shadow-2xl pointer-events-auto">
          <div className="clinical-card-header flex-none">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Live Analysis
            </span>
            <h1 className="text-xl font-bold text-ink mt-1">Scanner Output</h1>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <AnomalyScanner profile={profile} />

            <div className="clinical-card">
              <div className="clinical-card-header">
                <span className="section-label-strong">Derived metrics</span>
              </div>
              <dl className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11.5px]">
                <Stat label="BMI" v={derived.bmi} suffix={derived.bmiCategory ? ` · ${derived.bmiCategory}` : ""} />
                <Stat label="BSA (m²)" v={derived.bsa} />
                <Stat label="MAP" v={derived.map} suffix=" mmHg" />
                <Stat label="Pulse pressure" v={derived.pulsePressure} suffix=" mmHg" />
                <Stat label="eGFR" v={derived.egfr} suffix={derived.egfrStage ? ` · ${derived.egfrStage}` : ""} />
                <Stat label="Est. mean glucose" v={derived.meanGlucoseFromA1c} suffix=" mg/dL" />
                <Stat label="LDL (Friedewald)" v={derived.ldlCalc} />
                <Stat label="HRV band" v={derived.hrvCategory} />
                <Stat label="Allostatic load" v={derived.allostaticLoad} suffix=" /10" />
                <Stat label="Body integrity" v={derived.bodyIntegrity} suffix=" /100" />
                <Stat label="Met. syndrome?" v={derived.metSyndrome === true ? "yes" : derived.metSyndrome === false ? "no" : undefined} />
                <Stat label="CKD risk" v={derived.ckdRisk} />
              </dl>
            </div>
          </div>
        </aside>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Tiny presentation primitives — local to this page.
// ────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="clinical-card">
      <div className="clinical-card-header">
        <span className="section-label-strong">{title}</span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function NumInput({
  label,
  v,
  onChange,
  step = 1,
}: {
  label: string;
  v: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={v ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
        className="input-clinical h-7 px-2 text-[12px] font-mono normal-case tracking-normal text-ink"
      />
    </label>
  );
}

function SelectInput({
  label,
  v,
  options,
  onChange,
}: {
  label: string;
  v: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted">
      <span>{label}</span>
      <select
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="input-clinical h-7 px-2 text-[12px] font-mono normal-case tracking-normal text-ink"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, v, suffix = "" }: { label: string; v: number | string | undefined; suffix?: string }) {
  return (
    <div className="rounded-clinical border border-line bg-surface-0 px-2 py-1.5">
      <div className="text-[9.5px] font-mono uppercase tracking-widest2 text-ink-muted">{label}</div>
      <div className="text-ink font-mono text-[12px]">{v == null || v === "" ? "—" : `${v}${suffix}`}</div>
    </div>
  );
}
