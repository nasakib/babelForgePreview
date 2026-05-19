/**
 * babelForge — Physics engine.
 *
 * Dynamical-systems and stochastic primitives that any simulation in the
 * app can compose. The existing `lib/engine/kuramoto.ts` is a *specific*
 * model; this module supplies the *infrastructure*: integrators, noise,
 * spectral metrics, and coarse-grained mean-field equations.
 *
 * Design principles:
 *   - Pure functions. Inputs in, outputs out. No state, no I/O.
 *   - In-place where it matters for performance (use `*Into` variants).
 *   - Citation comments on every non-trivial algorithm so the science is
 *     auditable from the source.
 *
 * Selected references:
 *   - Higham, "An algorithmic introduction to numerical simulation of
 *     SDEs," SIAM Review 2001. doi:10.1137/S0036144500378302
 *   - Wilson & Cowan, Biophys J 1972. doi:10.1016/S0006-3495(72)86068-5
 *   - Lachaux et al., Hum Brain Mapp 1999 (PLV). doi:10.1002/(SICI)1097-0193(1999)8:4<194::AID-HBM4>3.0.CO;2-C
 *   - Rosenstein et al., Physica D 1993 (Lyapunov). doi:10.1016/0167-2789(93)90009-P
 *   - Hurst, Trans Am Soc Civ Eng 1951 (R/S analysis).
 */

// ---------------------------------------------------------------------------
// RNG (Box–Muller, seeded externally if needed)
// ---------------------------------------------------------------------------

/** Sample one standard normal N(0,1) using Math.random. */
export function randn(): number {
  // Box–Muller. We discard the second sample; cheap enough at our scale.
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ---------------------------------------------------------------------------
// ODE / SDE integrators
// ---------------------------------------------------------------------------

export type VectorField = (t: number, y: Float64Array, out: Float64Array) => void;

/** Classic RK4 step for dy/dt = f(t, y). Allocates 4 working buffers. */
export function rk4Step(
  t: number,
  y: Float64Array,
  dt: number,
  f: VectorField,
): Float64Array {
  const n = y.length;
  const k1 = new Float64Array(n);
  const k2 = new Float64Array(n);
  const k3 = new Float64Array(n);
  const k4 = new Float64Array(n);
  const tmp = new Float64Array(n);

  f(t, y, k1);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * dt * k1[i];
  f(t + 0.5 * dt, tmp, k2);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * dt * k2[i];
  f(t + 0.5 * dt, tmp, k3);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + dt * k3[i];
  f(t + dt, tmp, k4);

  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return out;
}

/**
 * Euler–Maruyama step for dY = a(t,Y)dt + b(t,Y)dW with diagonal noise.
 * Strong order 0.5, weak order 1. Sufficient for the qualitative-dynamics
 * targets in this app; upgrade to Milstein if you need order-1 strong.
 */
export function emStep(
  t: number,
  y: Float64Array,
  dt: number,
  drift: VectorField,
  diffusion: VectorField,
): Float64Array {
  const n = y.length;
  const a = new Float64Array(n);
  const b = new Float64Array(n);
  drift(t, y, a);
  diffusion(t, y, b);
  const sqdt = Math.sqrt(dt);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = y[i] + a[i] * dt + b[i] * sqdt * randn();
  }
  return out;
}

// ---------------------------------------------------------------------------
// Wilson–Cowan mean-field (excitatory / inhibitory population rates)
// ---------------------------------------------------------------------------

export interface WilsonCowanParams {
  /** Excitatory time constant (ms). Typical 10 ms. */
  tauE: number;
  /** Inhibitory time constant (ms). Typical 20 ms. */
  tauI: number;
  /** Recurrent E→E gain. */
  wEE: number;
  /** I→E gain (inhibitory drive onto E). */
  wEI: number;
  /** E→I gain. */
  wIE: number;
  /** Recurrent I→I gain (usually small). */
  wII: number;
  /** External tonic drive to E. */
  inputE: number;
  /** External tonic drive to I. */
  inputI: number;
  /** Sigmoid steepness. */
  beta: number;
  /** Sigmoid threshold. */
  theta: number;
}

function sigmoid(x: number, beta: number, theta: number): number {
  return 1 / (1 + Math.exp(-beta * (x - theta)));
}

/**
 * Returns dE/dt, dI/dt given current (E,I) and parameters. Use with `rk4Step`
 * or `emStep` for a noisy variant. All rates are dimensionless population
 * activity in [0,1].
 */
export function wilsonCowanRHS(p: WilsonCowanParams) {
  return (_t: number, y: Float64Array, out: Float64Array) => {
    const E = y[0];
    const I = y[1];
    const drvE = p.wEE * E - p.wEI * I + p.inputE;
    const drvI = p.wIE * E - p.wII * I + p.inputI;
    out[0] = (-E + sigmoid(drvE, p.beta, p.theta)) / p.tauE;
    out[1] = (-I + sigmoid(drvI, p.beta, p.theta)) / p.tauI;
  };
}

// ---------------------------------------------------------------------------
// Spectral / phase metrics
// ---------------------------------------------------------------------------

/**
 * Phase Locking Value between two equal-length phase time series.
 * R = |⟨e^{i(φ_a - φ_b)}⟩|. Range [0,1]; 1 = perfectly phase-locked,
 * 0 = random phase relationship. Lachaux 1999.
 */
export function plv(phasesA: ArrayLike<number>, phasesB: ArrayLike<number>): number {
  const n = Math.min(phasesA.length, phasesB.length);
  if (n === 0) return 0;
  let sumC = 0;
  let sumS = 0;
  for (let i = 0; i < n; i++) {
    const d = phasesA[i] - phasesB[i];
    sumC += Math.cos(d);
    sumS += Math.sin(d);
  }
  return Math.sqrt(sumC * sumC + sumS * sumS) / n;
}

/**
 * Hurst exponent via rescaled-range analysis. H ≈ 0.5 = uncorrelated white
 * noise; H > 0.5 = long-range positive correlations; H < 0.5 = anti-
 * persistent. fMRI BOLD typically yields H in 0.7–0.9.
 */
export function hurstExponent(series: ArrayLike<number>): number {
  const N = series.length;
  if (N < 16) return Number.NaN;
  const minK = 8;
  const ks: number[] = [];
  for (let k = minK; k <= N; k = Math.floor(k * 1.5)) ks.push(k);
  if (ks[ks.length - 1] !== N) ks.push(N);

  const lnK: number[] = [];
  const lnRS: number[] = [];

  for (const k of ks) {
    const blocks = Math.floor(N / k);
    if (blocks < 1) continue;
    let rsSum = 0;
    let rsCount = 0;
    for (let b = 0; b < blocks; b++) {
      const start = b * k;
      let mean = 0;
      for (let i = 0; i < k; i++) mean += series[start + i];
      mean /= k;
      let cum = 0;
      let min = Infinity;
      let max = -Infinity;
      let sumSq = 0;
      for (let i = 0; i < k; i++) {
        const x = series[start + i] - mean;
        cum += x;
        if (cum < min) min = cum;
        if (cum > max) max = cum;
        sumSq += x * x;
      }
      const std = Math.sqrt(sumSq / k);
      if (std > 0) {
        rsSum += (max - min) / std;
        rsCount++;
      }
    }
    if (rsCount > 0) {
      lnK.push(Math.log(k));
      lnRS.push(Math.log(rsSum / rsCount));
    }
  }

  // Linear regression slope ln(R/S) ~ H · ln(k)
  const n = lnK.length;
  if (n < 2) return Number.NaN;
  let mK = 0;
  let mRS = 0;
  for (let i = 0; i < n; i++) {
    mK += lnK[i];
    mRS += lnRS[i];
  }
  mK /= n;
  mRS /= n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (lnK[i] - mK) * (lnRS[i] - mRS);
    den += (lnK[i] - mK) ** 2;
  }
  return den === 0 ? Number.NaN : num / den;
}

/**
 * Order parameter of a phase ensemble: R = |⟨e^{iθ}⟩|, the same quantity
 * the Kuramoto integrator reports. Surfaced here so non-Kuramoto callers
 * (Wilson–Cowan + phase-extracted output, oscillator banks, etc.) can
 * compute coherence consistently.
 */
export function orderParameter(phases: ArrayLike<number>): number {
  const n = phases.length;
  if (n === 0) return 0;
  let c = 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    c += Math.cos(phases[i]);
    s += Math.sin(phases[i]);
  }
  return Math.sqrt(c * c + s * s) / n;
}
