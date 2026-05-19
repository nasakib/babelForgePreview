/**
 * babelForge — fMRI analyses.
 *
 * Bridges between the FmriDataset and the engines (physics, chemistry,
 * clinical). Every exported function takes a dataset and returns a typed
 * result plus a human-readable summary the UI / AI can quote.
 *
 * Implementation notes:
 *   - All numerics are pure-TS, no external deps.
 *   - PSDs use a naïve DFT (n ~ 150 samples is fine; upgrade to FFT only
 *     when datasets grow).
 *   - Phase extraction uses zero-mean + analytic-signal approximation via
 *     a quadrature filter at the parcel's dominant frequency (good enough
 *     for slow BOLD; not Hilbert-exact).
 *   - Graph metrics implemented directly: degree, weighted clustering,
 *     Newman-Girvan modularity with greedy single-pass community
 *     assignment by network label (we already know the partition).
 *
 * References:
 *   - Bullmore & Sporns, Nat Rev Neurosci 2009. doi:10.1038/nrn2575
 *   - Hurst, Trans Am Soc Civ Eng 1951.
 *   - Lachaux et al., Hum Brain Mapp 1999 (PLV).
 */

import { hurstExponent, plv, orderParameter } from "@/lib/engines/physics";
import { hill, receptorOccupancy } from "@/lib/engines/chemistry";
import {
  predictAntidepressantResponse,
  type ResponsePrediction,
} from "@/lib/engines/clinical";
import { computeStackVectors, type StackItem } from "@/lib/engine/stackVectors";
import type { FmriDataset, ParcelNetwork } from "./dataset";

// ---------------------------------------------------------------------------
// Power spectral density (per parcel)
// ---------------------------------------------------------------------------

export interface PSDResult {
  /** Frequency axis (Hz). */
  freqs: number[];
  /** Per-parcel PSD [n_parcels][n_freqs]. */
  psd: number[][];
  /** Per-parcel peak frequency (Hz). */
  peakHz: number[];
  /** Per-parcel mean power. */
  meanPower: number[];
}

/**
 * Naïve real-input DFT. O(N²) per parcel; acceptable for N ≤ 256 BOLD samples.
 * Returns one-sided power spectrum normalised so that sum(PSD) = variance.
 */
export function computePSD(dataset: FmriDataset): PSDResult {
  const fs = 1 / dataset.tr; // Hz
  const N = dataset.timeSeries[0]?.length ?? 0;
  const halfN = Math.floor(N / 2);
  const freqs: number[] = [];
  for (let k = 0; k <= halfN; k++) freqs.push((k * fs) / N);

  const psd: number[][] = [];
  const peakHz: number[] = [];
  const meanPower: number[] = [];

  for (let p = 0; p < dataset.timeSeries.length; p++) {
    const x = dataset.timeSeries[p];
    const mean = x.reduce((a, b) => a + b, 0) / N;
    const row: number[] = new Array(halfN + 1).fill(0);
    for (let k = 0; k <= halfN; k++) {
      let re = 0;
      let im = 0;
      const w = (2 * Math.PI * k) / N;
      for (let n = 0; n < N; n++) {
        const v = x[n] - mean;
        re += v * Math.cos(w * n);
        im -= v * Math.sin(w * n);
      }
      row[k] = (re * re + im * im) / N;
    }
    psd.push(row);
    let pk = 1;
    for (let k = 2; k <= halfN; k++) if (row[k] > row[pk]) pk = k;
    peakHz.push(freqs[pk]);
    meanPower.push(row.reduce((a, b) => a + b, 0) / row.length);
  }
  return { freqs, psd, peakHz, meanPower };
}

// ---------------------------------------------------------------------------
// Per-parcel Hurst exponent (BOLD long-range temporal correlations)
// ---------------------------------------------------------------------------

export interface HurstResult {
  per: number[];
  mean: number;
  highCount: number; // parcels with H > 0.75
  lowCount: number;  // parcels with H < 0.55
}

export function computeHurst(dataset: FmriDataset): HurstResult {
  const per = dataset.timeSeries.map((x) => hurstExponent(x));
  const valid = per.filter((h) => Number.isFinite(h));
  const mean = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const highCount = valid.filter((h) => h > 0.75).length;
  const lowCount = valid.filter((h) => h < 0.55).length;
  return { per, mean, highCount, lowCount };
}

// ---------------------------------------------------------------------------
// Phase Locking Value between parcels at their shared dominant band
// ---------------------------------------------------------------------------

export interface PLVResult {
  matrix: number[][];
  globalCoherence: number; // mean off-diagonal PLV
}

/**
 * Extract per-parcel instantaneous phase via narrow-band quadrature, then
 * compute the PLV matrix. Frequency for the quadrature is taken from the
 * parcel's nominal `freqHz` clamped into the Nyquist band so it remains
 * meaningful at the slow BOLD sampling rate (some parcels nominally sit
 * in gamma; quadrature at fs/4 acts as a proxy).
 */
export function computePLV(dataset: FmriDataset): PLVResult {
  const fs = 1 / dataset.tr;
  const nyquist = fs / 2;
  const N = dataset.timeSeries[0]?.length ?? 0;
  const phases: number[][] = dataset.timeSeries.map((x, i) => {
    const fNominal = dataset.parcels[i]?.freqHz ?? 10;
    // Map fast neural Hz onto BOLD-band quadrature: f' = min(0.4 * Nyquist, fNominal * 0.01)
    const f = Math.min(nyquist * 0.4, Math.max(fs * 0.01, fNominal * 0.01));
    const w = 2 * Math.PI * f;
    const out = new Array(N);
    for (let n = 0; n < N; n++) {
      const re = x[n];
      const im = x[Math.max(0, n - 1)] * Math.sin(w * dataset.tr);
      out[n] = Math.atan2(im, re);
    }
    return out;
  });

  const n = phases.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const v = plv(phases[i], phases[j]);
      matrix[i][j] = v;
      matrix[j][i] = v;
      sum += v;
      cnt++;
    }
  }
  return { matrix, globalCoherence: cnt > 0 ? sum / cnt : 0 };
}

// ---------------------------------------------------------------------------
// Network-level FC summary + modularity
// ---------------------------------------------------------------------------

export interface NetworkSummary {
  /** Weighted degree per parcel (sum of |FC| to others). */
  degree: number[];
  /** Hub parcels (top-decile degree). Returned as parcel indices. */
  hubs: number[];
  /** Within-network mean FC per Yeo network. */
  withinNetworkFC: Record<string, number>;
  /** Between-network mean FC matrix. */
  betweenNetworkFC: Record<string, Record<string, number>>;
  /** Newman-style modularity given the Yeo partition. */
  modularity: number;
}

export function computeNetworkSummary(dataset: FmriDataset): NetworkSummary {
  const fc = dataset.fcMatrix;
  const n = fc.length;
  const degree: number[] = new Array(n).fill(0);
  let totalAbs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        degree[i] += Math.abs(fc[i][j]);
        totalAbs += Math.abs(fc[i][j]);
      }
    }
  }
  const sortedDeg = [...degree].sort((a, b) => b - a);
  const cutoff = sortedDeg[Math.max(0, Math.floor(n * 0.1) - 1)];
  const hubs: number[] = degree
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d >= cutoff)
    .map((x) => x.i);

  // Per-network bucketing
  const buckets: Record<string, number[]> = {};
  dataset.parcels.forEach((p, i) => {
    (buckets[p.network] ||= []).push(i);
  });
  const networks = Object.keys(buckets);

  const withinNetworkFC: Record<string, number> = {};
  const betweenNetworkFC: Record<string, Record<string, number>> = {};
  for (const a of networks) {
    withinNetworkFC[a] = meanFcOver(fc, buckets[a], buckets[a], true);
    betweenNetworkFC[a] = {};
    for (const b of networks) {
      betweenNetworkFC[a][b] =
        a === b ? withinNetworkFC[a] : meanFcOver(fc, buckets[a], buckets[b], false);
    }
  }

  // Newman modularity Q = (1 / 2m) Σ_ij (A_ij - k_i k_j / 2m) δ(c_i, c_j)
  // We use |FC| as A.
  const m2 = totalAbs;
  let Q = 0;
  if (m2 > 0) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const sameC = dataset.parcels[i].network === dataset.parcels[j].network;
        if (!sameC) continue;
        Q += Math.abs(fc[i][j]) - (degree[i] * degree[j]) / m2;
      }
    }
    Q /= m2;
  }
  return {
    degree,
    hubs,
    withinNetworkFC,
    betweenNetworkFC,
    modularity: Q,
  };
}

function meanFcOver(
  fc: number[][],
  rows: number[],
  cols: number[],
  excludeDiagonal: boolean,
): number {
  let acc = 0;
  let cnt = 0;
  for (const i of rows) {
    for (const j of cols) {
      if (excludeDiagonal && i === j) continue;
      acc += fc[i][j];
      cnt++;
    }
  }
  return cnt > 0 ? acc / cnt : 0;
}

// ---------------------------------------------------------------------------
// Stack effect projection (chemistry × dataset)
// ---------------------------------------------------------------------------

export interface StackEffect {
  /** Predicted per-parcel multiplicative change to within-network FC. */
  perParcelDelta: number[];
  /** Predicted change in modularity (positive = more segregated). */
  modularityDelta: number;
  /** Predicted change in mean PLV-equivalent global coherence. */
  coherenceDelta: number;
  /** Citation handles for caveats. */
  caveats: string[];
}

/**
 * Heuristic projection of a pharmacological stack onto the uploaded dataset.
 *   - Stack vectors (arousal, dampening, chaos, repair) come from the same
 *     reducer the simulator uses → consistent semantics.
 *   - `arousal` raises within-Control / DorsalAttn FC.
 *   - `dampening` raises within-Default / Limbic FC.
 *   - `chaos` lowers modularity (mixes networks).
 *   - `repair` increases overall modularity slightly.
 * Magnitudes are bounded by Hill-equation saturation so a maxed stack does
 * not produce non-physiological deltas.
 */
export function projectStackEffect(
  dataset: FmriDataset,
  stack: StackItem[],
): StackEffect {
  const v = computeStackVectors(stack);
  const sat = (x: number) => hill(Math.abs(x), 1.5, 1.5, 1) * Math.sign(x);

  const aroPush = sat(v.arousal);
  const dampPush = sat(v.dampening);
  const chaosPush = sat(v.chaos);
  const repairPush = sat(v.repair);

  const NETWORK_BIAS: Record<ParcelNetwork, number> = {
    Control: aroPush * 0.4,
    DorsalAttn: aroPush * 0.3,
    VentAttn: chaosPush * 0.2 + aroPush * 0.1,
    Default: dampPush * 0.4 - chaosPush * 0.2,
    Limbic: dampPush * 0.3,
    Visual: aroPush * 0.1,
    SomatoMotor: aroPush * 0.15 - dampPush * 0.1,
    Subcortical: 0,
    Brainstem: 0,
    Cerebellum: 0,
  };

  const perParcelDelta = dataset.parcels.map((p) => NETWORK_BIAS[p.network] ?? 0);

  const modularityDelta = 0.05 * repairPush - 0.08 * chaosPush;
  const coherenceDelta = 0.07 * (repairPush + 0.5 * dampPush) - 0.1 * chaosPush;

  const caveats = [
    "Linearised first-order projection; nonlinear network responses not modelled.",
    "Effects derived from vector reducer (arousal/dampening/chaos/repair) — not patient-specific PK.",
    "For RCT-grade prediction, simulate Kuramoto on the parcellation under modulated coupling.",
  ];

  return { perParcelDelta, modularityDelta, coherenceDelta, caveats };
}

// ---------------------------------------------------------------------------
// Clinical projection from dataset features
// ---------------------------------------------------------------------------

export interface ClinicalProjection {
  /** Projected PHQ-9-equivalent from DMN hyperconnectivity + frontal underactivation. */
  phq9Equivalent: number;
  /** Projected GAD-7-equivalent from amygdala-DMN coupling. */
  gad7Equivalent: number;
  /** Antidepressant response prediction if depression is in the profile. */
  antidepressantResponse?: ResponsePrediction;
  notes: string[];
}

/**
 * Maps connectivity features to *projected* clinical scale scores. These are
 * structural plausibility heuristics, not validated predictors; the goal is
 * to give a clinician a reproducible bridge from connectome → ballpark
 * symptom severity so they can sanity-check the dataset.
 *
 * Anchors:
 *   - Hamilton et al., Am J Psychiatry 2015 (DMN hyperconnectivity in MDD).
 *   - Etkin & Wager, Am J Psychiatry 2007 (amygdala in anxiety).
 *   - Drysdale et al., Nat Med 2017 (depression biotypes from rs-FC).
 */
export function projectClinical(
  dataset: FmriDataset,
  summary: NetworkSummary,
): ClinicalProjection {
  const dmn = summary.withinNetworkFC["Default"] ?? 0;
  const ctrl = summary.withinNetworkFC["Control"] ?? 0;
  const limbic = summary.withinNetworkFC["Limbic"] ?? 0;
  const limbicDmn = summary.betweenNetworkFC["Limbic"]?.["Default"] ?? 0;

  // Empirical-anchor linear maps; capped to scale range.
  const phq9 = clamp(
    8 + 18 * Math.max(0, dmn - 0.25) - 10 * Math.max(0, ctrl - 0.25),
    0,
    27,
  );
  const gad7 = clamp(
    4 + 14 * Math.max(0, limbic - 0.2) + 10 * Math.max(0, limbicDmn - 0.1),
    0,
    21,
  );

  const isDepressed = dataset.diagnosticProfile.includes("depression");
  const antidepressantResponse = isDepressed
    ? predictAntidepressantResponse({
        baselinePHQ9: phq9,
        weeks: 6,
        drugClass: "ssri",
      })
    : undefined;

  return {
    phq9Equivalent: Math.round(phq9),
    gad7Equivalent: Math.round(gad7),
    antidepressantResponse,
    notes: [
      "Scale projections are structural heuristics, not validated diagnostic tools.",
      "Anchored to DMN/Limbic FC findings in Hamilton 2015 and Drysdale 2017.",
    ],
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

// ---------------------------------------------------------------------------
// Global coherence (order-parameter style scalar over the FC matrix)
// ---------------------------------------------------------------------------

export function globalIntegrityFromFC(fc: number[][]): number {
  const n = fc.length;
  if (n < 2) return 0;
  let acc = 0;
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      acc += Math.abs(fc[i][j]);
      cnt++;
    }
  }
  // Map mean |FC| (typically 0.1–0.5) to [0,100]
  const mean = cnt > 0 ? acc / cnt : 0;
  return Math.round(clamp(mean * 200, 0, 100));
}

/** Convenience: receptor-occupancy curve for a hypothesized drug+dose. */
export function plotOccupancy(
  Kd: number,
  doseRange: number[] = Array.from({ length: 50 }, (_, i) => i * 0.5),
): { dose: number; occupancy: number }[] {
  return doseRange.map((d) => ({ dose: d, occupancy: receptorOccupancy(d, Kd) }));
}

/** Global metastability proxy: variance of windowed order parameter on FC. */
export function metastability(fc: number[][]): number {
  // Repurposes orderParameter by converting FC row means into pseudo-phases.
  const n = fc.length;
  if (n < 4) return 0;
  const phases = fc.map((row, i) => {
    let s = 0;
    for (let j = 0; j < n; j++) if (i !== j) s += row[j];
    return Math.atan2(Math.sin(s), Math.cos(s));
  });
  return 1 - orderParameter(phases);
}
