/**
 * babelForge — Clinical engine.
 *
 * Validated psychometric scale scorers, clinical decision rules, and
 * effect-size / number-needed-to-treat utilities. Every scale here uses
 * the published scoring algorithm and severity bands; sources cited inline.
 *
 * IMPORTANT: This engine is for *educational simulation*. None of these
 * scorers are a substitute for a licensed clinician's judgment, and the
 * NNT / response-likelihood utilities are heuristic compositions, not
 * diagnostic instruments.
 *
 * Scales implemented:
 *   - PHQ-9   Kroenke et al., J Gen Intern Med 2001.
 *               doi:10.1046/j.1525-1497.2001.016009606.x
 *   - GAD-7   Spitzer et al., Arch Intern Med 2006.
 *               doi:10.1001/archinte.166.10.1092
 *   - AUDIT   Saunders et al., Addiction 1993.
 *               doi:10.1111/j.1360-0443.1993.tb02093.x
 *   - PCL-5   Weathers et al., 2013 (Nat'l Center for PTSD).
 *   - CIWA-Ar Sullivan et al., Br J Addict 1989.
 *               doi:10.1111/j.1360-0443.1989.tb00737.x
 *   - YMRS    Young et al., Br J Psychiatry 1978.
 *               doi:10.1192/bjp.133.5.429
 *   - MoCA    Nasreddine et al., JAGS 2005.
 *               doi:10.1111/j.1532-5415.2005.53221.x
 *
 * Plus:
 *   - NNT from odds-ratio + baseline risk (Cates 2002).
 *   - CGI-S severity labels.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type SeverityBand =
  | "minimal"
  | "mild"
  | "moderate"
  | "moderately-severe"
  | "severe"
  | "negative"
  | "positive"
  | "low-risk"
  | "hazardous"
  | "harmful"
  | "dependent";

export interface ScaleResult {
  scale: string;
  score: number;
  maxScore: number;
  band: SeverityBand;
  interpretation: string;
  /** Optional flags requiring clinician attention (e.g. PHQ-9 item 9). */
  redFlags?: string[];
}

function sum(items: number[]): number {
  return items.reduce((a, b) => a + b, 0);
}

function assertItems(items: number[], expected: number, scale: string): void {
  if (items.length !== expected) {
    throw new Error(`${scale}: expected ${expected} items, got ${items.length}`);
  }
}

// ---------------------------------------------------------------------------
// PHQ-9
// ---------------------------------------------------------------------------

export function scorePHQ9(items: number[]): ScaleResult {
  assertItems(items, 9, "PHQ-9");
  const score = sum(items);
  let band: SeverityBand = "minimal";
  let interpretation = "Minimal depression. Watchful waiting; reassess at follow-up.";
  if (score >= 20) {
    band = "severe";
    interpretation = "Severe depression. Active treatment with pharmacotherapy and/or psychotherapy indicated.";
  } else if (score >= 15) {
    band = "moderately-severe";
    interpretation = "Moderately severe depression. Active treatment indicated.";
  } else if (score >= 10) {
    band = "moderate";
    interpretation = "Moderate depression. Treatment plan considering counseling and/or pharmacotherapy.";
  } else if (score >= 5) {
    band = "mild";
    interpretation = "Mild depression. Watchful waiting; repeat PHQ-9 at follow-up.";
  }
  const redFlags: string[] = [];
  // Item 9 = suicidal ideation. Any non-zero answer is a red flag.
  if (items[8] > 0) {
    redFlags.push("Suicidal ideation endorsed on item 9 — perform safety assessment.");
  }
  return { scale: "PHQ-9", score, maxScore: 27, band, interpretation, redFlags };
}

// ---------------------------------------------------------------------------
// GAD-7
// ---------------------------------------------------------------------------

export function scoreGAD7(items: number[]): ScaleResult {
  assertItems(items, 7, "GAD-7");
  const score = sum(items);
  let band: SeverityBand = "minimal";
  let interpretation = "Minimal anxiety.";
  if (score >= 15) {
    band = "severe";
    interpretation = "Severe anxiety. Further evaluation and active treatment indicated.";
  } else if (score >= 10) {
    band = "moderate";
    interpretation = "Moderate anxiety. Possible clinically significant condition.";
  } else if (score >= 5) {
    band = "mild";
    interpretation = "Mild anxiety. Monitor; reassess at follow-up.";
  }
  return { scale: "GAD-7", score, maxScore: 21, band, interpretation };
}

// ---------------------------------------------------------------------------
// AUDIT
// ---------------------------------------------------------------------------

export function scoreAUDIT(items: number[]): ScaleResult {
  assertItems(items, 10, "AUDIT");
  const score = sum(items);
  let band: SeverityBand = "low-risk";
  let interpretation = "Low-risk drinking or abstinence.";
  if (score >= 20) {
    band = "dependent";
    interpretation = "Possible alcohol dependence. Diagnostic evaluation and specialist referral indicated.";
  } else if (score >= 16) {
    band = "harmful";
    interpretation = "Harmful use. Brief counseling and continued monitoring.";
  } else if (score >= 8) {
    band = "hazardous";
    interpretation = "Hazardous drinking. Brief intervention recommended.";
  }
  return { scale: "AUDIT", score, maxScore: 40, band, interpretation };
}

// ---------------------------------------------------------------------------
// PCL-5
// ---------------------------------------------------------------------------

export function scorePCL5(items: number[]): ScaleResult {
  assertItems(items, 20, "PCL-5");
  const score = sum(items);
  // Conventional provisional PTSD cutoff = 33 (National Center for PTSD).
  let band: SeverityBand = "negative";
  let interpretation = "Below provisional PTSD threshold.";
  if (score >= 33) {
    band = "positive";
    interpretation = "Meets provisional PTSD threshold; structured clinical interview (CAPS-5) recommended.";
  }
  return { scale: "PCL-5", score, maxScore: 80, band, interpretation };
}

// ---------------------------------------------------------------------------
// CIWA-Ar (alcohol withdrawal severity)
// ---------------------------------------------------------------------------

export function scoreCIWA(items: number[]): ScaleResult {
  assertItems(items, 10, "CIWA-Ar");
  const score = sum(items);
  let band: SeverityBand = "minimal";
  let interpretation = "Minimal / no withdrawal. Monitoring usually sufficient.";
  if (score >= 20) {
    band = "severe";
    interpretation = "Severe withdrawal. Symptom-triggered benzodiazepine therapy; risk of seizures / delirium tremens.";
  } else if (score >= 10) {
    band = "moderate";
    interpretation = "Moderate withdrawal. Pharmacologic treatment recommended.";
  } else if (score >= 8) {
    band = "mild";
    interpretation = "Mild withdrawal. Supportive care; reassess hourly.";
  }
  return { scale: "CIWA-Ar", score, maxScore: 67, band, interpretation };
}

// ---------------------------------------------------------------------------
// YMRS (Young Mania Rating Scale)
// ---------------------------------------------------------------------------

export function scoreYMRS(items: number[]): ScaleResult {
  assertItems(items, 11, "YMRS");
  const score = sum(items);
  let band: SeverityBand = "minimal";
  let interpretation = "Euthymic / minimal manic symptoms.";
  if (score >= 26) {
    band = "severe";
    interpretation = "Severe mania.";
  } else if (score >= 20) {
    band = "moderate";
    interpretation = "Moderate mania.";
  } else if (score >= 13) {
    band = "mild";
    interpretation = "Mild manic symptoms; threshold for clinically significant change in trials.";
  }
  return { scale: "YMRS", score, maxScore: 60, band, interpretation };
}

// ---------------------------------------------------------------------------
// MoCA (Montreal Cognitive Assessment)
// ---------------------------------------------------------------------------

export function scoreMoCA(rawScore: number, yearsOfEducation: number): ScaleResult {
  // Standard adjustment: +1 if ≤12 years of education (and total ≤30).
  let score = rawScore;
  if (yearsOfEducation <= 12) score = Math.min(30, rawScore + 1);
  let band: SeverityBand = "negative";
  let interpretation = "Within normal cognitive range (≥26).";
  if (score < 18) {
    band = "severe";
    interpretation = "Suggestive of moderate-to-severe cognitive impairment.";
  } else if (score < 22) {
    band = "moderate";
    interpretation = "Suggestive of mild-to-moderate cognitive impairment.";
  } else if (score < 26) {
    band = "mild";
    interpretation = "Suggestive of mild cognitive impairment; consider full neuropsych evaluation.";
  }
  return { scale: "MoCA", score, maxScore: 30, band, interpretation };
}

// ---------------------------------------------------------------------------
// CGI-S
// ---------------------------------------------------------------------------

export const CGI_SEVERITY_LABELS = [
  "Not assessed",
  "Normal, not at all ill",
  "Borderline mentally ill",
  "Mildly ill",
  "Moderately ill",
  "Markedly ill",
  "Severely ill",
  "Among the most extremely ill",
] as const;

export function cgiSeverity(score: number): string {
  const clamped = Math.max(0, Math.min(7, Math.round(score)));
  return CGI_SEVERITY_LABELS[clamped];
}

// ---------------------------------------------------------------------------
// Effect-size / NNT utilities
// ---------------------------------------------------------------------------

/**
 * Convert an odds ratio plus a control-arm event rate to number needed to
 * treat. Cates 2002 (BMJ). Returns Infinity if OR == 1.
 *   doi:10.1136/bmj.324.7340.729
 */
export function nntFromOR(or: number, controlRisk: number): number {
  if (controlRisk <= 0 || controlRisk >= 1) return Number.NaN;
  if (or === 1) return Number.POSITIVE_INFINITY;
  const expRisk = (or * controlRisk) / (1 - controlRisk + or * controlRisk);
  const arr = controlRisk - expRisk;
  if (arr === 0) return Number.POSITIVE_INFINITY;
  return 1 / Math.abs(arr);
}

/** Cohen's d → r (point-biserial). For meta-analytic conversions. */
export function cohenDToR(d: number): number {
  return d / Math.sqrt(d * d + 4);
}

/** Relative risk reduction from baseline and experimental risks. */
export function relativeRiskReduction(controlRisk: number, expRisk: number): number {
  if (controlRisk <= 0) return Number.NaN;
  return (controlRisk - expRisk) / controlRisk;
}

// ---------------------------------------------------------------------------
// Treatment-response heuristic (composes scale + drug class + duration)
// ---------------------------------------------------------------------------

export interface ResponsePrediction {
  /** Probability of ≥50% scale reduction by `weeks` weeks, 0..1. */
  probResponse: number;
  /** Probability of remission (e.g., PHQ-9 < 5), 0..1. */
  probRemission: number;
  caveats: string[];
}

/**
 * Heuristic, NOT a regression. Anchors:
 *   - STAR*D (Trivedi 2006): ~50% response, ~33% remission per SSRI step.
 *     doi:10.1176/appi.ajp.163.1.28
 *   - Cipriani et al. (Lancet 2018) network meta-analysis: SSRIs OR 1.7-2.1 vs placebo.
 *     doi:10.1016/S0140-6736(17)32802-7
 *   - Higher baseline severity → larger absolute effect (Fournier 2010).
 *     doi:10.1001/jama.2009.1943
 */
export function predictAntidepressantResponse(args: {
  baselinePHQ9: number;
  weeks: number;
  drugClass: "ssri" | "snri" | "bupropion" | "tca" | "maoi" | "augment" | "psychotherapy";
}): ResponsePrediction {
  const { baselinePHQ9, weeks, drugClass } = args;
  if (baselinePHQ9 < 0 || baselinePHQ9 > 27) {
    return {
      probResponse: 0,
      probRemission: 0,
      caveats: ["Invalid baseline PHQ-9; provide 0..27."],
    };
  }
  // Time-course: logistic ramp toward asymptote, half-saturated ~ week 4.
  const timeFactor = 1 / (1 + Math.exp(-(weeks - 4) / 1.5));
  // Severity multiplier per Fournier 2010: minimal lift for mild, larger for severe.
  const sevFactor = baselinePHQ9 < 10 ? 0.45 : baselinePHQ9 < 15 ? 0.75 : 1.0;
  const baseResponse: Record<typeof drugClass, number> = {
    ssri: 0.55,
    snri: 0.58,
    bupropion: 0.5,
    tca: 0.6,
    maoi: 0.6,
    augment: 0.4,
    psychotherapy: 0.45,
  } as const;
  const baseRemission: Record<typeof drugClass, number> = {
    ssri: 0.35,
    snri: 0.36,
    bupropion: 0.32,
    tca: 0.38,
    maoi: 0.38,
    augment: 0.25,
    psychotherapy: 0.3,
  } as const;
  const probResponse = baseResponse[drugClass] * sevFactor * timeFactor;
  const probRemission = baseRemission[drugClass] * sevFactor * timeFactor;
  const caveats = [
    "Heuristic composed from STAR*D, Cipriani 2018 NMA, and Fournier 2010.",
    "Individual response depends on prior treatment history, comorbidities, pharmacogenetics, and adherence.",
  ];
  if (weeks < 2) caveats.push("Most antidepressants require 2–4 weeks before therapeutic effect emerges.");
  return { probResponse: clamp01(probResponse), probRemission: clamp01(probRemission), caveats };
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
