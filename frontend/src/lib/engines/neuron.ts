/**
 * babelForge — Neuron engine.
 *
 * Single-cell models and synaptic kinetics. Provides building blocks for
 * spiking simulations, biophysically-grounded membrane dynamics, and
 * synapse-level pharmacology hooks (the Chemistry engine modulates the
 * conductances exposed here).
 *
 * Models:
 *   - Leaky integrate-and-fire (LIF) — fast, qualitative.
 *   - Izhikevich (2003) — 20+ firing patterns from two parameters.
 *     doi:10.1109/TNN.2003.820440
 *   - Hodgkin–Huxley (1952) — squid giant axon, biophysical reference.
 *     doi:10.1113/jphysiol.1952.sp004764
 *
 * Synapse kinetics use double-exponential conductance profiles with time
 * constants drawn from:
 *   - Destexhe, Mainen, Sejnowski, in Methods in Neuronal Modeling (1998).
 *   - Jonas et al., J Physiol 1993 (AMPA). doi:10.1113/jphysiol.1993.sp019812
 *   - Lester et al., Nature 1990 (NMDA). doi:10.1038/346565a0
 *   - Mody et al., TINS 1994 (GABA-A). doi:10.1016/0166-2236(94)90155-4
 *
 * All time variables are in milliseconds, voltages in mV, conductances in
 * dimensionless gating-variable units unless stated.
 */

// ---------------------------------------------------------------------------
// Leaky integrate-and-fire
// ---------------------------------------------------------------------------

export interface LIFParams {
  /** Membrane time constant (ms). Cortical pyramidal ~20 ms. */
  tau: number;
  /** Resting potential (mV). */
  vRest: number;
  /** Spike threshold (mV). */
  vThresh: number;
  /** Reset potential after spike (mV). */
  vReset: number;
  /** Absolute refractory period (ms). */
  refractory: number;
  /** Membrane resistance (MΩ). */
  R: number;
}

export interface LIFState {
  v: number;
  lastSpikeT: number;
}

export const DEFAULT_LIF: LIFParams = {
  tau: 20,
  vRest: -65,
  vThresh: -50,
  vReset: -70,
  refractory: 2,
  R: 100,
};

export function lifStep(
  state: LIFState,
  I: number,
  t: number,
  dt: number,
  p: LIFParams = DEFAULT_LIF,
): { state: LIFState; spiked: boolean } {
  if (t - state.lastSpikeT < p.refractory) {
    return { state: { v: p.vReset, lastSpikeT: state.lastSpikeT }, spiked: false };
  }
  const dv = (-(state.v - p.vRest) + p.R * I) / p.tau;
  const vNew = state.v + dt * dv;
  if (vNew >= p.vThresh) {
    return {
      state: { v: p.vReset, lastSpikeT: t },
      spiked: true,
    };
  }
  return { state: { v: vNew, lastSpikeT: state.lastSpikeT }, spiked: false };
}

// ---------------------------------------------------------------------------
// Izhikevich (2003)
// ---------------------------------------------------------------------------

export interface IzhikevichParams {
  a: number; // recovery time scale
  b: number; // recovery sensitivity
  c: number; // post-spike reset of v
  d: number; // post-spike kick to u
}

/** Canonical firing-pattern presets from Izhikevich 2003 Fig. 2. */
export const IZHIKEVICH_PRESETS: Record<string, IzhikevichParams> = {
  regularSpiking: { a: 0.02, b: 0.2, c: -65, d: 8 },
  intrinsicallyBursting: { a: 0.02, b: 0.2, c: -55, d: 4 },
  chattering: { a: 0.02, b: 0.2, c: -50, d: 2 },
  fastSpiking: { a: 0.1, b: 0.2, c: -65, d: 2 },
  lowThresholdSpiking: { a: 0.02, b: 0.25, c: -65, d: 2 },
  thalamoCortical: { a: 0.02, b: 0.25, c: -65, d: 0.05 },
  resonator: { a: 0.1, b: 0.26, c: -65, d: 2 },
};

export interface IzhikevichState {
  v: number;
  u: number;
}

export function izhikevichStep(
  s: IzhikevichState,
  I: number,
  dt: number,
  p: IzhikevichParams,
): { state: IzhikevichState; spiked: boolean } {
  // Izhikevich recommends sub-stepping (two 0.5 ms updates of v per ms).
  const halfSteps = Math.max(1, Math.round(dt / 0.5));
  const h = dt / halfSteps;
  let v = s.v;
  let u = s.u;
  let spiked = false;
  for (let i = 0; i < halfSteps; i++) {
    v += h * (0.04 * v * v + 5 * v + 140 - u + I);
    u += h * (p.a * (p.b * v - u));
    if (v >= 30) {
      v = p.c;
      u += p.d;
      spiked = true;
      break;
    }
  }
  return { state: { v, u }, spiked };
}

// ---------------------------------------------------------------------------
// Synaptic kinetics
// ---------------------------------------------------------------------------

/** Receptor time constants (ms), rise / decay, biophysical literature. */
export const SYNAPSE_KINETICS = {
  AMPA: { tauRise: 0.5, tauDecay: 2.4, eRev: 0 },
  NMDA: { tauRise: 4, tauDecay: 100, eRev: 0 },
  GABA_A: { tauRise: 0.5, tauDecay: 10, eRev: -75 },
  GABA_B: { tauRise: 60, tauDecay: 200, eRev: -90 },
} as const;

export type SynapseKind = keyof typeof SYNAPSE_KINETICS;

export interface SynapseState {
  /** Open probability surrogate (g/g_max). */
  g: number;
  /** Auxiliary fast-rising variable for double-exponential kinetics. */
  x: number;
}

/**
 * Double-exponential conductance evolution. On each presynaptic spike call
 * `applyPresynSpike(state, weight)` to bump `x`; otherwise call `synapseStep`
 * each integration step.
 */
export function synapseStep(
  s: SynapseState,
  kind: SynapseKind,
  dt: number,
): SynapseState {
  const { tauRise, tauDecay } = SYNAPSE_KINETICS[kind];
  // Two coupled linear ODEs: dx/dt = -x/tauRise, dg/dt = (x - g) / tauDecay
  const xNew = s.x * Math.exp(-dt / tauRise);
  const gNew = s.g + dt * ((s.x - s.g) / tauDecay);
  return { g: Math.max(0, gNew), x: xNew };
}

export function applyPresynSpike(
  s: SynapseState,
  weight: number = 1,
): SynapseState {
  return { g: s.g, x: s.x + weight };
}

/**
 * Mg²⁺ block of NMDA receptors (Jahr & Stevens 1990).
 * doi:10.1523/JNEUROSCI.10-09-03178.1990
 * Multiply NMDA conductance by this factor when computing current.
 */
export function nmdaMgBlock(v: number, mgConc_mM: number = 1): number {
  return 1 / (1 + (mgConc_mM / 3.57) * Math.exp(-0.062 * v));
}

/** Synaptic current I = g · (V - E_rev). */
export function synapticCurrent(
  g: number,
  v: number,
  kind: SynapseKind,
): number {
  return g * (v - SYNAPSE_KINETICS[kind].eRev);
}
