// ----------------------------------------------------------------------------
// Kuramoto Phase Oscillator Engine
// ----------------------------------------------------------------------------
// Discretized integration of the canonical Kuramoto model on a structural
// adjacency matrix W:
//
//     dθ_i/dt = ω_i + (K/N) Σ_j W_ij sin(θ_j − θ_i) + ξ_i(t)
//
// with global coupling K and Gaussian noise ξ. The complex order parameter
//
//     R(t) e^{iΨ(t)} = (1/N) Σ_j e^{i θ_j(t)}
//
// quantifies global phase coherence: R ≈ 0 → asynchrony, R ≈ 1 → frequency
// entrainment. We expose a stateful integrator that the React Three Fiber
// canvas calls each frame.
//
// References:
//   Kuramoto Y. (1984). Chemical Oscillations, Waves and Turbulence.
//   Cabral et al. (2014). Exploring mechanisms of spontaneous brain dynamics
//     using the Kuramoto model on a connectome.
// ----------------------------------------------------------------------------

import { mulberry32 } from "./rng";

export interface KuramotoState {
  N: number;
  theta: Float32Array;
  omega: Float32Array;
  adjacency: Uint8Array;
  K: number;
  noise: number;
  /** rolling complex order parameter */
  R: number;
  psi: number;
}

export interface KuramotoConfig {
  N: number;
  adjacency: Uint8Array;
  omegas: Float32Array | number[];
  K?: number;
  noise?: number;
  seed?: number;
}

export function initKuramoto(cfg: KuramotoConfig): KuramotoState {
  const rng = mulberry32(cfg.seed ?? 7);
  const theta = new Float32Array(cfg.N);
  for (let i = 0; i < cfg.N; i++) theta[i] = rng() * Math.PI * 2;
  const omega = new Float32Array(cfg.omegas as ArrayLike<number>);
  return {
    N: cfg.N,
    theta,
    omega,
    adjacency: cfg.adjacency,
    K: cfg.K ?? 1.0,
    noise: cfg.noise ?? 0.05,
    R: 0,
    psi: 0,
  };
}

/** Advance the Kuramoto system by Δt (seconds) with explicit Euler. */
export function stepKuramoto(s: KuramotoState, dt: number, rng: () => number = Math.random): void {
  const { N, theta, omega, adjacency, K, noise } = s;
  const next = new Float32Array(N);
  const invN = 1 / N;
  for (let i = 0; i < N; i++) {
    let sum = 0;
    const row = i * N;
    const ti = theta[i];
    for (let j = 0; j < N; j++) {
      if (adjacency[row + j]) sum += Math.sin(theta[j] - ti);
    }
    const xi = noise * (rng() * 2 - 1);
    next[i] = ti + dt * (omega[i] + K * invN * sum + xi);
  }
  for (let i = 0; i < N; i++) theta[i] = next[i];

  // Order parameter
  let cx = 0,
    cy = 0;
  for (let i = 0; i < N; i++) {
    cx += Math.cos(theta[i]);
    cy += Math.sin(theta[i]);
  }
  cx *= invN;
  cy *= invN;
  s.R = Math.sqrt(cx * cx + cy * cy);
  s.psi = Math.atan2(cy, cx);
}

/** Estimate steady-state R for a given coupling K (3s warm-up, 1s sample). */
export function estimateOrderParameter(cfg: KuramotoConfig, dt = 0.02): number {
  const s = initKuramoto(cfg);
  const warm = Math.floor(3 / dt);
  const samp = Math.floor(1 / dt);
  for (let t = 0; t < warm; t++) stepKuramoto(s, dt);
  let acc = 0;
  for (let t = 0; t < samp; t++) {
    stepKuramoto(s, dt);
    acc += s.R;
  }
  return acc / samp;
}

/** Effective coupling K* given pharmacological vectors. Increases with repair,
 *  decreases with chaos, modulated by dampening/arousal balance. */
export function effectiveCoupling(vectors: {
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
}): number {
  const balance = 1 + 0.25 * vectors.repair - 0.30 * vectors.chaos;
  const tone = 1 + 0.10 * (vectors.arousal - vectors.dampening);
  return Math.max(0.05, 0.85 * balance * tone);
}

/** Stochastic noise level induced by pharmacology. */
export function effectiveNoise(vectors: { chaos: number; arousal: number }): number {
  return Math.max(0.01, 0.05 + 0.18 * vectors.chaos + 0.04 * Math.max(0, vectors.arousal));
}
