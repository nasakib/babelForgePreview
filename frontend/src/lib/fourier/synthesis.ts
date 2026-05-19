/**
 * Synthetic signal generators per Fourier category.
 *
 * Each category returns a real-valued time series (length = N) plus the
 * sample rate so the spectrum component can label the frequency axis
 * correctly. None of these claim to be a physiological simulation —
 * they are *teaching* signals shaped so each canonical phenomenon is
 * visible in the spectrum.
 */

import { BANDS, Stimulus, stimulusGain } from "@/lib/signal/bands";

export type FourierCategoryKey =
  | "neural"
  | "coherence"
  | "bold"
  | "compound";

export interface FourierCategory {
  key: FourierCategoryKey;
  label: string;
  group: "Electrophysiology" | "Network" | "Imaging" | "Pharmacology";
  blurb: string;
  /** Suggested x-axis label for the spectrum. */
  xAxisLabel: string;
  /** Suggested sample rate for the synthesizer (Hz). */
  sampleRate: number;
  /** Suggested window length in samples (power of 2). */
  N: number;
  /** True if the category should be drawn with delta/theta/alpha/beta/gamma overlays. */
  overlayBands: boolean;
}

export const FOURIER_CATEGORIES: FourierCategory[] = [
  {
    key: "neural",
    label: "Neural Signal (EEG)",
    group: "Electrophysiology",
    blurb:
      "Synthetic scalp EEG = five canonical band oscillators (δθαβγ) summed with a 1/f pink-noise background (octave-spaced, amplitude ∝ 1/√f). Stimulus selection reshapes per-band gain via stimulusGain().",
    xAxisLabel: "Frequency (Hz)",
    sampleRate: 256,
    N: 1024,
    overlayBands: true,
  },
  {
    key: "coherence",
    label: "Phase Coherence (Kuramoto)",
    group: "Network",
    blurb:
      "Real Kuramoto ensemble of N=64 oscillators integrated with Euler-Maruyama. Spectrum is computed on the detrended global order parameter R(t) = |⟨e^iθⱼ⟩|. Peaks reflect collective network rhythms beyond any individual oscillator.",
    xAxisLabel: "Frequency (Hz)",
    sampleRate: 64,
    N: 512,
    overlayBands: true,
  },
  {
    key: "bold",
    label: "fMRI BOLD",
    group: "Imaging",
    blurb:
      "Poisson neural impulse train convolved with the canonical SPM double-gamma HRF (Friston 1998: a₁=6, a₂=16, ratio 1/6) + 1/f scanner drift. Spectrum is dominated by <0.2 Hz components — the band where resting-state networks live.",
    xAxisLabel: "Frequency (Hz)",
    sampleRate: 1,
    N: 512,
    overlayBands: false,
  },
  {
    key: "compound",
    label: "Compound Resonance",
    group: "Pharmacology",
    blurb:
      "Treats the stimulus as a frequency-domain transfer function: each band's amplitude equals its stimulusGain() amp factor. Reading bin power = reading the intervention's per-band action directly.",
    xAxisLabel: "Frequency (Hz)",
    sampleRate: 256,
    N: 1024,
    overlayBands: true,
  },
];

export function categoryByKey(k: FourierCategoryKey): FourierCategory {
  return FOURIER_CATEGORIES.find((c) => c.key === k) ?? FOURIER_CATEGORIES[0];
}

/** Deterministic seedable pseudo-random for reproducible visuals. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Per-band center frequency (Hz) used by the EEG synthesizer. */
const BAND_CENTER_HZ: Record<string, number> = {
  delta: 2.5,
  theta: 6.0,
  alpha: 10.0,
  beta:  20.0,
  gamma: 45.0,
};

/**
 * Approximate 1/f ("pink") noise by summing decorrelated octaves.
 * Amplitude per octave is set so power-spectral density scales as 1/f,
 * i.e. amplitude scales as 1/sqrt(f). Octave centers are spaced
 * logarithmically so coverage is uniform on a log-frequency axis —
 * which is how the spectrum is rendered.
 */
function addPinkNoise(
  out: number[],
  sampleRate: number,
  amp: number,
  rnd: () => number
): void {
  const N = out.length;
  const fMax = sampleRate / 2;
  const fMin = Math.max(0.1, sampleRate / N);
  const octaves = Math.max(4, Math.floor(Math.log2(fMax / fMin)));
  for (let k = 0; k < octaves; k++) {
    // Geometric (log) spacing across the available band.
    const f = fMin * Math.pow(fMax / fMin, k / (octaves - 1));
    // Random phase + small intra-octave jitter so adjacent octaves
    // don't beat against each other.
    const phase = rnd() * Math.PI * 2;
    const jitter = 1 + (rnd() - 0.5) * 0.1;
    const fk = f * jitter;
    const a = amp / Math.sqrt(Math.max(fk, fMin));
    for (let i = 0; i < N; i++) {
      out[i] += a * Math.sin(2 * Math.PI * fk * (i / sampleRate) + phase);
    }
  }
}

function eegSeries(N: number, sampleRate: number, stim: Stimulus | null): number[] {
  const rnd = mulberry32(7);
  const out = new Array<number>(N).fill(0);
  // Sum 5 band oscillators with stimulus-modulated amplitudes.
  for (const b of BANDS) {
    const f = BAND_CENTER_HZ[b.key];
    const g = stimulusGain(stim, b.key);
    const amp = 0.5 * g.amp;
    const phase = rnd() * Math.PI * 2;
    for (let i = 0; i < N; i++) {
      out[i] += amp * Math.sin(2 * Math.PI * f * (i / sampleRate) + phase);
    }
  }
  // 1/f pink background. Psychedelics broaden noise (Schartner et al.).
  const noiseAmp = 0.6 + (stim?.type === "Psychedelic" ? 0.6 : 0);
  addPinkNoise(out, sampleRate, noiseAmp, rnd);
  return out;
}

/**
 * Real Kuramoto ensemble. Integrates
 *     dθᵢ/dt = ωᵢ + (K/N) · Σⱼ sin(θⱼ − θᵢ) + ξᵢ(t)
 * with the explicit Euler method, then returns the time series of
 * R(t) = |⟨e^iθⱼ⟩| — the canonical order parameter.
 *
 * K and σ_ω depend on the stimulus so the spectral signature of each
 * intervention is mechanistically motivated rather than handwritten.
 */
function coherenceSeries(N: number, sampleRate: number, stim: Stimulus | null): number[] {
  // Stimulus → ensemble parameters.
  let K = 1.6;                // coupling
  let omega0 = 2 * Math.PI * 9; // mean intrinsic frequency (≈α)
  let sigma = 1.2;            // intrinsic frequency spread
  let noise = 0.15;           // thermal noise σ per √dt
  switch (stim?.type) {
    case "Stimulant":   omega0 = 2 * Math.PI * 18; K = 1.2; sigma = 1.6; break;
    case "Depressant":  omega0 = 2 * Math.PI * 4;  K = 2.6; sigma = 0.6; noise = 0.08; break;
    case "Psychedelic": K = 0.8; sigma = 2.4; noise = 0.32; break;
    case "Focus":       omega0 = 2 * Math.PI * 22; K = 2.2; sigma = 1.0; break;
    case "TMS":         omega0 = 2 * Math.PI * 10; K = 3.4; sigma = 0.5; break;
    case "Visual":      omega0 = 2 * Math.PI * 12; K = 1.4; sigma = 1.4; break;
  }
  const M = 64;               // ensemble size — small but enough for a clean R
  const rnd = mulberry32(13);
  // Sample ωᵢ ~ Normal(omega0, sigma) via Box–Muller.
  const omega = new Array<number>(M);
  for (let i = 0; i < M; i++) {
    const u1 = Math.max(1e-9, rnd());
    const u2 = rnd();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    omega[i] = omega0 + sigma * z;
  }
  const theta = new Array<number>(M);
  for (let i = 0; i < M; i++) theta[i] = rnd() * Math.PI * 2;

  // Integrate with a step dt = 1/sampleRate · stepsPerSample (oversample
  // to keep Euler stable at the upper frequencies).
  const stepsPerSample = 4;
  const dt = 1 / (sampleRate * stepsPerSample);
  const R = new Array<number>(N);
  const sqrtDt = Math.sqrt(dt);
  for (let n = 0; n < N; n++) {
    for (let s = 0; s < stepsPerSample; s++) {
      // Compute order parameter components once per micro-step.
      let cx = 0, cy = 0;
      for (let j = 0; j < M; j++) { cx += Math.cos(theta[j]); cy += Math.sin(theta[j]); }
      cx /= M; cy /= M;
      // Mean-field form: K · |R| · sin(Ψ - θᵢ)
      for (let i = 0; i < M; i++) {
        const Rsin = cy * Math.cos(theta[i]) - cx * Math.sin(theta[i]);
        // Box–Muller for white-noise increment.
        const u1 = Math.max(1e-9, rnd());
        const u2 = rnd();
        const xi = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        theta[i] += dt * (omega[i] + K * Rsin) + noise * sqrtDt * xi;
      }
    }
    // Sample R after the micro-steps.
    let cx = 0, cy = 0;
    for (let j = 0; j < M; j++) { cx += Math.cos(theta[j]); cy += Math.sin(theta[j]); }
    cx /= M; cy /= M;
    R[n] = Math.sqrt(cx * cx + cy * cy);
  }
  // Detrend (remove DC) so the spectrum reflects fluctuations of R,
  // not its mean level which would otherwise dominate the 0-Hz bin.
  let mean = 0;
  for (let i = 0; i < N; i++) mean += R[i];
  mean /= N;
  for (let i = 0; i < N; i++) R[i] -= mean;
  return R;
}

/**
 * Canonical SPM-style double-gamma hemodynamic response function (HRF):
 *
 *     h(t) = (t/d1)^a1 · exp(-(t-d1)/b1)
 *          - c · (t/d2)^a2 · exp(-(t-d2)/b2)
 *
 * with the standard parameter set (Friston, 1998).
 */
function doubleGammaHRF(sampleRate: number, durationSec = 32): number[] {
  const a1 = 6, a2 = 16, b1 = 1, b2 = 1, c = 1 / 6;
  const d1 = a1 * b1, d2 = a2 * b2;
  const N = Math.max(8, Math.floor(durationSec * sampleRate));
  const h = new Array<number>(N);
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    const term1 = Math.pow(t / d1, a1) * Math.exp(-(t - d1) / b1);
    const term2 = Math.pow(t / d2, a2) * Math.exp(-(t - d2) / b2);
    h[i] = term1 - c * term2;
    if (h[i] > peak) peak = h[i];
  }
  // Normalize peak to 1 so amplitudes downstream are interpretable.
  if (peak > 0) for (let i = 0; i < N; i++) h[i] /= peak;
  return h;
}

/** Direct (non-FFT) convolution — fine for HRF lengths used here. */
function convolve(x: number[], h: number[], outLen: number): number[] {
  const out = new Array<number>(outLen).fill(0);
  for (let i = 0; i < outLen; i++) {
    let s = 0;
    const jMax = Math.min(h.length, i + 1);
    for (let j = 0; j < jMax; j++) s += h[j] * x[i - j];
    out[i] = s;
  }
  return out;
}

/**
 * BOLD signal = neural impulse train · HRF + low-frequency drift +
 * scanner noise. The HRF is the dominant low-pass filter, which is
 * why the resulting spectrum is dominated by <0.2 Hz components.
 */
function boldSeries(N: number, sampleRate: number, stim: Stimulus | null): number[] {
  const rnd = mulberry32(29);
  // Neural drive: Poisson-ish event train modulated by a slow envelope
  // around a stimulus-dependent rate (events per second).
  let rate = 0.4;
  if (stim?.type === "Stimulant")   rate = 0.7;
  if (stim?.type === "Depressant")  rate = 0.2;
  if (stim?.type === "Psychedelic") rate = 0.55;
  if (stim?.type === "Focus")       rate = 0.6;
  const events = new Array<number>(N).fill(0);
  for (let i = 0; i < N; i++) {
    const slow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.04 * (i / sampleRate));
    if (rnd() < rate * slow / sampleRate) events[i] = 1;
  }
  const hrf = doubleGammaHRF(sampleRate, 32);
  const bold = convolve(events, hrf, N);
  // Add scanner 1/f drift.
  addPinkNoise(bold, sampleRate, 0.04, rnd);
  return bold;
}

/**
 * Compound resonance: synthesize an EEG-range signal where each band's
 * amplitude is exactly its stimulus gain. Listeners see the transfer
 * function of the intervention directly in the spectrum.
 */
function compoundSeries(N: number, sampleRate: number, stim: Stimulus | null): number[] {
  const rnd = mulberry32(101);
  const out = new Array<number>(N).fill(0);
  for (const b of BANDS) {
    const f = BAND_CENTER_HZ[b.key];
    const g = stimulusGain(stim, b.key);
    const phase = rnd() * Math.PI * 2;
    for (let i = 0; i < N; i++) {
      out[i] += g.amp * Math.sin(2 * Math.PI * f * (i / sampleRate) + phase);
    }
  }
  return out;
}

export function synthesize(
  category: FourierCategoryKey,
  stim: Stimulus | null
): { samples: number[]; sampleRate: number; meta: FourierCategory } {
  const meta = categoryByKey(category);
  let samples: number[];
  switch (category) {
    case "neural":    samples = eegSeries(meta.N, meta.sampleRate, stim); break;
    case "coherence": samples = coherenceSeries(meta.N, meta.sampleRate, stim); break;
    case "bold":      samples = boldSeries(meta.N, meta.sampleRate, stim); break;
    case "compound":  samples = compoundSeries(meta.N, meta.sampleRate, stim); break;
  }
  return { samples, sampleRate: meta.sampleRate, meta };
}

/** EEG band ranges in Hz for spectrum overlays. */
export const BAND_HZ_RANGES: Record<string, [number, number]> = {
  delta: [1, 4],
  theta: [4, 8],
  alpha: [8, 13],
  beta:  [13, 30],
  gamma: [30, 80],
};
