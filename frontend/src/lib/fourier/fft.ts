/**
 * Iterative radix-2 Cooley–Tukey FFT. In-place on two parallel arrays
 * (`re`, `im`) of the same power-of-2 length. Zero dependencies, ~30
 * lines, sufficient for canvas-driven visualizers up to N=4096.
 *
 * For interactive UIs we operate on short windows (256–1024 samples)
 * so the O(N log N) cost is negligible per frame.
 */

export function isPow2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/** Zero-pad (or truncate) `arr` to the next power of 2 of length `>= n`. */
export function padToPow2(arr: number[], n?: number): number[] {
  const targetN = n ?? arr.length;
  let p = 1;
  while (p < targetN) p <<= 1;
  if (arr.length === p) return arr.slice();
  const out = new Array<number>(p).fill(0);
  for (let i = 0; i < Math.min(arr.length, p); i++) out[i] = arr[i];
  return out;
}

/** In-place radix-2 FFT. `re`/`im` must be the same power-of-2 length. */
export function fft(re: number[], im: number[]): void {
  const n = re.length;
  if (!isPow2(n)) {
    throw new Error(`fft: length must be a power of 2 (got ${n})`);
  }

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Butterfly stages.
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wReStep = Math.cos(ang);
    const wImStep = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k];
        const aIm = im[i + k];
        const bRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const bIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k] = aRe + bRe;
        im[i + k] = aIm + bIm;
        re[i + k + half] = aRe - bRe;
        im[i + k + half] = aIm - bIm;
        const nwRe = wRe * wReStep - wIm * wImStep;
        const nwIm = wRe * wImStep + wIm * wReStep;
        wRe = nwRe;
        wIm = nwIm;
      }
    }
  }
}

/**
 * One-shot helper: real-valued time series → one-sided amplitude
 * spectrum. Returns the unique positive-frequency half (length N/2).
 *
 * Normalization follows the standard one-sided convention for a
 * real input of length N:
 *
 *     A[0]      = |X[0]| / N        (DC, not doubled)
 *     A[k>0]    = 2·|X[k]| / N
 *
 * This makes the amplitude of a pure cosine of amplitude A
 * read back as A in the corresponding bin (up to windowing loss).
 */
export function magnitudeSpectrum(signal: number[]): number[] {
  const re = padToPow2(signal);
  const im = new Array<number>(re.length).fill(0);
  fft(re, im);
  const n = re.length;
  const half = n >> 1;
  const mag = new Array<number>(half);
  // DC bin: not doubled.
  mag[0] = Math.sqrt(re[0] * re[0] + im[0] * im[0]) / n;
  // Positive-frequency bins: doubled.
  for (let i = 1; i < half; i++) {
    mag[i] = (2 * Math.sqrt(re[i] * re[i] + im[i] * im[i])) / n;
  }
  return mag;
}

/**
 * One-sided power spectral density (squared magnitude) — the form
 * usually shown on log-axes in EEG/fMRI contexts.
 */
export function powerSpectrum(signal: number[]): number[] {
  const m = magnitudeSpectrum(signal);
  for (let i = 0; i < m.length; i++) m[i] = m[i] * m[i];
  return m;
}

/** Hann window — reduces spectral leakage on short captures. */
export function hannWindow(n: number): number[] {
  const w = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return w;
}

/**
 * Convenience: apply a Hann window then return the one-sided amplitude
 * spectrum, compensated for the window's coherent gain (≈0.5) so a
 * unit-amplitude sinusoid still reads back near 1.0 in its bin.
 */
export function windowedMagnitude(signal: number[]): number[] {
  const w = hannWindow(signal.length);
  let coherentGain = 0;
  const windowed = new Array<number>(signal.length);
  for (let i = 0; i < signal.length; i++) {
    windowed[i] = signal[i] * w[i];
    coherentGain += w[i];
  }
  coherentGain /= signal.length; // average — ≈ 0.5 for Hann
  const mag = magnitudeSpectrum(windowed);
  if (coherentGain > 0) {
    for (let i = 0; i < mag.length; i++) mag[i] /= coherentGain;
  }
  return mag;
}

/** Compensated one-sided power spectrum (windowed). */
export function windowedPower(signal: number[]): number[] {
  const m = windowedMagnitude(signal);
  for (let i = 0; i < m.length; i++) m[i] = m[i] * m[i];
  return m;
}

/** Map a positive-frequency bin index to Hz given sampleRate and N. */
export function binToHz(bin: number, sampleRate: number, n: number): number {
  return (bin * sampleRate) / n;
}
