/**
 * Shared EEG band model.
 *
 * Single source of truth for clinical band definitions and the stimulus →
 * per-band response model. Band colors are sourced from the color engine
 * (lib/theme/palette.ts) so the swatches stay synchronized with the rest
 * of the UI when the palette is re-tuned.
 */

import { palette } from "../theme/palette";

export type BandKey = "delta" | "theta" | "alpha" | "beta" | "gamma";

export interface BandDef {
  key: BandKey;
  label: string;
  symbol: string;
  hzLabel: string;
  /** Per-frame phase increment for the synthetic generator. */
  freq: number;
  color: string;
  /** Short clinical role used in tooltips / legends. */
  role: string;
  /** Long-form explanation surfaced by `SignalExplainer`. */
  explain: string;
}

export const BANDS: BandDef[] = [
  {
    key: "delta",
    label: "Delta",
    symbol: "δ",
    hzLabel: "1–4 Hz",
    freq: 0.012,
    color: palette.bands.delta,
    role: "Deep sleep / restorative",
    explain:
      "Slow-wave activity dominant during NREM stage 3. Elevated delta in waking states suggests sedation, hypoxia, or cortical injury.",
  },
  {
    key: "theta",
    label: "Theta",
    symbol: "θ",
    hzLabel: "4–8 Hz",
    freq: 0.030,
    color: palette.bands.theta,
    role: "Drowsy / memory consolidation",
    explain:
      "Hippocampal-cortical coupling band. Linked to spatial navigation and episodic encoding; pathological when frontal-dominant in alert subjects.",
  },
  {
    key: "alpha",
    label: "Alpha",
    symbol: "α",
    hzLabel: "8–13 Hz",
    freq: 0.065,
    color: palette.bands.alpha,
    role: "Relaxed wakefulness",
    explain:
      "Posterior-dominant rhythm when eyes are closed. Acts as a cortical 'idling' inhibitor; suppression marks attention engagement.",
  },
  {
    key: "beta",
    label: "Beta",
    symbol: "β",
    hzLabel: "13–30 Hz",
    freq: 0.130,
    color: palette.bands.beta,
    role: "Active cognition / motor",
    explain:
      "Sensorimotor and prefrontal activity during alert problem-solving. Elevated under stimulants, anxiety, or motor planning.",
  },
  {
    key: "gamma",
    label: "Gamma",
    symbol: "γ",
    hzLabel: "30–80 Hz",
    freq: 0.260,
    color: palette.bands.gamma,
    role: "Binding / conscious access",
    explain:
      "High-frequency feature binding across cortical assemblies. Implicated in attention, perception, and conscious access.",
  },
];

export const BAND_BY_KEY: Record<BandKey, BandDef> = BANDS.reduce(
  (acc, b) => {
    acc[b.key] = b;
    return acc;
  },
  {} as Record<BandKey, BandDef>
);

export interface Stimulus {
  category: string;
  type: string;
  label: string;
  desc: string;
}

export interface BandGain {
  amp: number;
  noise: number;
  freqMul: number;
}

/**
 * Stimulus → per-band gain model. Pure function so it can be shared by the
 * renderer and the explainer.
 */
export function stimulusGain(stimulus: Stimulus | null, bandKey: BandKey): BandGain {
  let amp = 1;
  let noise = 1;
  const freqMul = 1;
  if (!stimulus) return { amp, noise, freqMul };

  if (stimulus.category === "Pharmacological") {
    if (stimulus.type === "Stimulant") {
      if (bandKey === "alpha" || bandKey === "theta") amp = 0.4;
      if (bandKey === "beta") { amp = 1.8; noise = 1.4; }
      if (bandKey === "gamma") { amp = 2.0; noise = 1.6; }
    } else if (stimulus.type === "Depressant") {
      if (bandKey === "delta" || bandKey === "theta") amp = 2.0;
      if (bandKey === "beta" || bandKey === "gamma") amp = 0.3;
      noise = 0.5;
    } else if (stimulus.type === "Psychedelic") {
      amp = 1.4; noise = 3.5;
      if (bandKey === "gamma") amp = 1.8;
    }
  } else if (stimulus.category === "Cognitive") {
    if (bandKey === "beta") amp = 1.6;
    if (bandKey === "gamma") amp = 2.4;
    if (bandKey === "alpha") amp = 0.5;
  } else if (stimulus.category === "Neuromodulatory") {
    if (stimulus.type === "TMS") {
      if (bandKey === "alpha") { amp = 2.5; noise = 0.1; }
      else amp = 0.3;
    } else if (stimulus.type === "tDCS") {
      amp = 1.2;
    }
  } else if (stimulus.category === "Sensory") {
    if (bandKey === "gamma") { amp = 1.5; noise = 1.2; }
  }
  return { amp, noise, freqMul };
}

/**
 * Predict the dominant band for a stimulus by comparing peak amplitudes from
 * `stimulusGain`. Used to seed deterministic copy in the explainer before the
 * renderer reports its first tick.
 */
export function predictDominantBand(stimulus: Stimulus | null): BandDef {
  let best = BANDS[2]; // alpha at rest
  let bestAmp = 0;
  for (const b of BANDS) {
    const g = stimulusGain(stimulus, b.key);
    const score = g.amp * (1 + g.noise * 0.1);
    if (score > bestAmp) { bestAmp = score; best = b; }
  }
  return best;
}

/**
 * Human-readable summary of what a stimulus is doing to the cortex,
 * synthesised from the gain table.
 */
export function describeStimulus(stimulus: Stimulus | null): string {
  if (!stimulus) {
    return "Resting-state LFP. Alpha-dominant posterior rhythm with mixed beta from frontal sources.";
  }
  const boosted = BANDS.filter((b) => stimulusGain(stimulus, b.key).amp >= 1.4)
    .map((b) => `${b.symbol} ${b.label}`)
    .join(", ");
  const suppressed = BANDS.filter((b) => stimulusGain(stimulus, b.key).amp <= 0.5)
    .map((b) => `${b.symbol} ${b.label}`)
    .join(", ");
  const parts: string[] = [];
  if (boosted) parts.push(`Up-regulates: ${boosted}.`);
  if (suppressed) parts.push(`Down-regulates: ${suppressed}.`);
  parts.push(stimulus.desc);
  return parts.join(" ");
}
