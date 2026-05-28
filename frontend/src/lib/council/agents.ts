/**
 * babelForge — Clinical Council agent catalogue.
 *
 * Each agent represents a medical specialty. The catalogue is the single
 * source-of-truth consumed by:
 *   - `/council` page UI (chips + opinion cards)
 *   - the orchestrator that synthesizes a multi-discipline second opinion
 *   - any future "ask one specialist" sub-flows
 *
 * Hues come from `palette.disciplines` so a UI can render an agent's
 * chip with its canonical color and remain consistent across the app.
 *
 * The "lens" string is a short prompt fragment that frames the agent's
 * perspective when the council is queried. The orchestrator combines
 * relevant lenses into a single prompt to the backend.
 */

import { palette } from "@/lib/theme/palette";

export type DisciplineKey = keyof typeof palette.disciplines;

export interface CouncilAgent {
  id: DisciplineKey;
  /** Human display name. */
  name: string;
  /** Letter glyph for chip rendering when no icon is desired. */
  glyph: string;
  /** Specialist short title, e.g. "Cardiologist". */
  title: string;
  /** One-line scope of practice. */
  scope: string;
  /** The lens this specialist applies to a case. */
  lens: string;
  /** Brand color (sourced from `palette.disciplines`). */
  color: string;
  /** Heuristic systems this agent prefers to weigh in on. */
  watches: string[];
}

function chip(id: DisciplineKey): string {
  return (palette.disciplines as Record<string, string>)[id] ?? palette.accent[500];
}

export const COUNCIL: CouncilAgent[] = [
  {
    id: "Psychiatry",
    name: "Dr. Cortex",
    glyph: "ψ",
    title: "Psychiatrist",
    scope: "Mood, anxiety, psychosis, neurodevelopmental, addiction.",
    lens:
      "Frame symptoms in DSM-5-TR / ICD-11 categories. Weigh PHQ-9, GAD-7, " +
      "PCL-5 against sleep, substance use, life stress. Note medication " +
      "interactions with the proposed regimen.",
    color: chip("Psychiatry"),
    watches: ["Neurological", "Endocrine", "Autonomic"],
  },
  {
    id: "Neurology",
    name: "Dr. Axon",
    glyph: "Λ",
    title: "Neurologist",
    scope: "Seizures, headache, stroke, neurodegeneration, neuro-immunology.",
    lens:
      "Look for focal signs, red-flag headache patterns, autonomic " +
      "instability, vitamin/mineral deficiencies that can mimic " +
      "neurological disease. Consider QT/seizure-threshold drug effects.",
    color: chip("Neurology"),
    watches: ["Neurological", "Autonomic", "Metabolic"],
  },
  {
    id: "Cardiology",
    name: "Dr. Sinus",
    glyph: "♥",
    title: "Cardiologist",
    scope: "Blood pressure, rhythm, ischemia, structural disease, lipids.",
    lens:
      "Apply ACC/AHA 2017 BP staging, ASCVD risk where computable, look " +
      "for QT-prolonging combinations, bradycardia from rate-controllers, " +
      "and metabolic-syndrome contribution.",
    color: chip("Cardiology"),
    watches: ["Cardiovascular", "Metabolic", "Renal"],
  },
  {
    id: "Pulmonology",
    name: "Dr. Alveoli",
    glyph: "≋",
    title: "Pulmonologist",
    scope: "Hypoxia, asthma/COPD, sleep-disordered breathing.",
    lens:
      "Flag SpO₂ < 92%, respiratory rate extremes, and any drug that " +
      "depresses ventilation when co-prescribed with opioids/benzodiazepines.",
    color: chip("Pulmonology"),
    watches: ["Respiratory", "Cardiovascular"],
  },
  {
    id: "Endocrinology",
    name: "Dr. Axis",
    glyph: "⌬",
    title: "Endocrinologist",
    scope: "Thyroid, diabetes, adrenal, gonadal, vitamin D, micronutrients.",
    lens:
      "Apply ADA 2024 dysglycemia thresholds, ATA TSH ranges, USPSTF " +
      "vitamin D guidance. Watch for steroid-induced hyperglycemia.",
    color: chip("Endocrinology"),
    watches: ["Endocrine", "Metabolic"],
  },
  {
    id: "Gastroenterology",
    name: "Dr. Mucosa",
    glyph: "ℑ",
    title: "Gastroenterologist",
    scope: "Liver, gut motility, IBD, microbiome.",
    lens:
      "Watch transaminase trends with hepatotoxic agents (acetaminophen, " +
      "statins, antiepileptics). Consider gut–brain axis effects on mood.",
    color: chip("Gastroenterology"),
    watches: ["Gastrointestinal", "Hepatic"],
  },
  {
    id: "Nephrology",
    name: "Dr. Glom",
    glyph: "◊",
    title: "Nephrologist",
    scope: "Kidney function, electrolytes, fluid balance.",
    lens:
      "Apply KDIGO 2024 eGFR staging. Adjust renally-cleared drugs " +
      "below eGFR 60. Flag NSAIDs / RAAS combos in CKD.",
    color: chip("Nephrology"),
    watches: ["Renal", "Cardiovascular"],
  },
  {
    id: "Hepatology",
    name: "Dr. Portal",
    glyph: "❖",
    title: "Hepatologist",
    scope: "Hepatic dysfunction, NAFLD, cirrhosis, drug-induced injury.",
    lens:
      "ALT/AST > 3× ULN warrants stopping the suspected agent and " +
      "re-trending in 1–2 weeks; use Child-Pugh logic for hepatic dosing.",
    color: chip("Hepatology"),
    watches: ["Hepatic", "Metabolic"],
  },
  {
    id: "Hematology",
    name: "Dr. Heme",
    glyph: "✜",
    title: "Hematologist",
    scope: "Anemia, coagulation, bone marrow.",
    lens:
      "Distinguish microcytic (iron / thalassemia) from macrocytic (B12 / " +
      "folate) anemia. Watch bleeding risk with SSRIs + NSAIDs / " +
      "anticoagulants.",
    color: chip("Hematology"),
    watches: ["Hematologic", "Immune"],
  },
  {
    id: "Immunology",
    name: "Dr. Antigen",
    glyph: "✦",
    title: "Immunologist",
    scope: "Autoimmunity, allergy, chronic inflammation.",
    lens:
      "Persistent hs-CRP > 3 raises ASCVD and depression-symptom risk. " +
      "Look for autoimmune mimics of psychiatric presentations.",
    color: chip("Immunology"),
    watches: ["Immune", "Hematologic"],
  },
  {
    id: "Pharmacology",
    name: "Dr. Kinetics",
    glyph: "℞",
    title: "Clinical Pharmacologist",
    scope: "PK/PD, CYP interactions, polypharmacy, PGx.",
    lens:
      "Walk the regimen against CYP2D6/2C19/3A4 phenotypes. Compute " +
      "additive serotonergic, anticholinergic, sedative, and QT burdens.",
    color: chip("Pharmacology"),
    watches: ["Cardiovascular", "Neurological", "Hepatic", "Renal"],
  },
  {
    id: "InternalMedicine",
    name: "Dr. Integrator",
    glyph: "Σ",
    title: "Internist",
    scope: "Cross-system synthesis; the generalist who threads the needles.",
    lens:
      "Identify the dominant driver across systems. Sequence work-up " +
      "from cheapest/least-invasive to most. Flag any single-cause " +
      "explanation that risks missing the dyad/triad.",
    color: chip("InternalMedicine"),
    watches: ["Metabolic", "Cardiovascular", "Endocrine", "Renal"],
  },
  {
    id: "SleepMedicine",
    name: "Dr. NREM",
    glyph: "☾",
    title: "Sleep Medicine",
    scope: "Insomnia, OSA, circadian rhythm, parasomnias.",
    lens:
      "< 7h habitual sleep + daytime fatigue + snoring warrants OSA " +
      "screening (STOP-BANG). Treat sleep before titrating psychotropics.",
    color: chip("SleepMedicine"),
    watches: ["Neurological", "Cardiovascular", "Metabolic"],
  },
  {
    id: "Nutrition",
    name: "Dr. Macro",
    glyph: "✿",
    title: "Nutritionist",
    scope: "Macros, micronutrients, dietary patterns, deficiency syndromes.",
    lens:
      "Mediterranean / DASH pattern adherence; B12, D, iron, magnesium, " +
      "omega-3 status. Calorie/protein adequacy before any optimization.",
    color: chip("Nutrition"),
    watches: ["Metabolic", "Endocrine", "Hematologic"],
  },
  {
    id: "SportsMedicine",
    name: "Dr. VO₂",
    glyph: "⚡",
    title: "Sports Medicine",
    scope: "Cardio-respiratory fitness, musculoskeletal load, recovery.",
    lens:
      "Apply WHO 150 min/wk moderate or 75 min/wk vigorous. Strength " +
      "≥ 2 days/wk. Recovery: HRV trends, sleep quality, RPE.",
    color: chip("SportsMedicine"),
    watches: ["Musculoskeletal", "Cardiovascular", "Autonomic"],
  },
  {
    id: "Toxicology",
    name: "Dr. LD₅₀",
    glyph: "☣",
    title: "Toxicologist",
    scope: "Overdose, environmental exposure, withdrawal, drug abuse.",
    lens:
      "Compute serotonin / anticholinergic / sedative burden. Screen " +
      "alcohol (AUDIT-C), opioid, stimulant, cannabis use against safety.",
    color: chip("Toxicology"),
    watches: ["Neurological", "Hepatic", "Renal"],
  },
  {
    id: "Functional",
    name: "Dr. Loop",
    glyph: "∞",
    title: "Functional Medicine",
    scope: "Systems-biology framing of chronic disease drivers.",
    lens:
      "Look upstream: sleep, stress, gut, exposures, micronutrients. " +
      "Useful adjunct, not a replacement for guideline-directed care.",
    color: chip("Functional"),
    watches: ["Metabolic", "Immune", "Gastrointestinal", "Autonomic"],
  },
  {
    id: "PainMedicine",
    name: "Dr. Nociceptor",
    glyph: "⚓",
    title: "Pain Medicine",
    scope: "Acute / chronic pain, opioid stewardship, neuropathic pain.",
    lens:
      "Step-care: non-pharm → non-opioid → opioid only with explicit " +
      "exit criteria. Watch additive sedation with concurrent CNS depressants.",
    color: chip("PainMedicine"),
    watches: ["Neurological", "Musculoskeletal"],
  },
  {
    id: "Geriatrics",
    name: "Dr. Senescence",
    glyph: "✶",
    title: "Geriatrician",
    scope: "Polypharmacy, falls, cognition, frailty, end-of-life.",
    lens:
      "Apply Beers criteria. De-prescribe anticholinergics, long-acting " +
      "BZDs, sliding-scale insulin in the elderly when feasible.",
    color: chip("Geriatrics"),
    watches: ["Neurological", "Renal", "Cardiovascular", "Musculoskeletal"],
  },
  {
    id: "WomensHealth",
    name: "Dr. Cycle",
    glyph: "♀",
    title: "Women's Health",
    scope: "Cycle, pregnancy, lactation, menopause, contraception.",
    lens:
      "Flag teratogens (valproate, isotretinoin, ACE-i, warfarin, " +
      "topiramate) at pre-pregnancy / pregnancy / lactation. Watch " +
      "iron-deficiency anemia in menstruating patients.",
    color: chip("WomensHealth"),
    watches: ["Reproductive", "Endocrine", "Hematologic"],
  },
];

export function getAgent(id: DisciplineKey): CouncilAgent | undefined {
  return COUNCIL.find((a) => a.id === id);
}
