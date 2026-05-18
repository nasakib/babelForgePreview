// ----------------------------------------------------------------------------
// AI Diagnostic Engine — pure functions, no network call required.
// ----------------------------------------------------------------------------
// Combines (1) the composed topology (pathology modifiers), (2) the
// pharmacological "vectors" produced by the stack, and (3) patient parameters
// (weight, tolerance) to produce:
//   • Topological Integrity Score    Φ ∈ [0, 100]
//   • Subjective experience summary
//   • Recommended optimization (auto-stack)
// The integrity score is anchored on the steady-state Kuramoto order
// parameter R of the composed system at a representative coupling K*.
// ----------------------------------------------------------------------------

import {
  composeTopology,
  type Pathology,
  PATHOLOGY_META,
} from "./topology";
import {
  estimateOrderParameter,
  effectiveCoupling,
  effectiveNoise,
} from "./kuramoto";

export interface PharmaVectors {
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
}

export interface PatientParams {
  weightKg: number;
  toleranceMonths: number; // global, simplified
}

export interface DiagnosticReport {
  integrity: number;        // 0..100
  R: number;                // Kuramoto order parameter
  K: number;                // effective coupling
  label: string;
  description: string;
  subjective: string[];
  warnings: string[];
}

export const ZERO_VECTORS: PharmaVectors = {
  arousal: 0,
  dampening: 0,
  chaos: 0,
  repair: 0,
};

export function runDiagnosis(
  states: Pathology[],
  vectors: PharmaVectors,
  patient: PatientParams
): DiagnosticReport {
  const topo = composeTopology(states);
  const weightFactor = 70 / Math.max(40, patient.weightKg);
  const tolFactor = 1 / (1 + Math.log1p(patient.toleranceMonths * 0.08));
  const v: PharmaVectors = {
    arousal: vectors.arousal * weightFactor * tolFactor,
    dampening: vectors.dampening * weightFactor * tolFactor,
    chaos: vectors.chaos * weightFactor * tolFactor,
    repair: vectors.repair * weightFactor * tolFactor,
  };

  const K = effectiveCoupling(v);
  const noise = effectiveNoise(v);
  const R = estimateOrderParameter({
    N: topo.N,
    adjacency: topo.adjacency,
    omegas: Float32Array.from(topo.nodes.map((n) => n.omega)),
    K,
    noise,
    seed: 13,
  }, 0.04); // larger dt for speed

  // Baseline R (no pathology, no drug) computed once and cached.
  const Rbase = getBaselineR();
  const ratio = Rbase > 0 ? R / Rbase : 1;
  const integrity = Math.round(Math.max(0, Math.min(100, ratio * 100)));

  // Label heuristic from vectors + states
  let label = states.length === 0 ? "Healthy Baseline" : "Pathological Baseline";
  let description = states.length === 0
    ? "Network entrainment within healthy variance. R(t) ≈ Kuramoto reference."
    : `Detected ${states.length} pathological state${states.length > 1 ? "s" : ""}. Topology composed.`;

  const warnings: string[] = [];
  if (v.dampening > 1.5 && v.arousal > 0.5) warnings.push("Polypharmacy conflict — antagonistic axes co-active.");
  if (v.chaos > 1.8) warnings.push("Topological fragmentation — high stochastic entropy.");
  if (v.arousal > 2.2) warnings.push("Hyperarousal toxicity threshold approached.");
  if (v.dampening > 2.2) warnings.push("Severe CNS depression — global amplitude collapsed.");

  if (vectors.arousal !== 0 || vectors.dampening !== 0 || vectors.chaos !== 0 || vectors.repair !== 0) {
    if (warnings.length === 0 && v.repair > 0.7 && v.chaos < 0.4) {
      label = "Topological Optimization";
      description = "Precision compounds widening Arnold tongues; system re-entraining toward healthy baseline.";
    } else if (warnings.length > 0) {
      label = warnings[0].split(" — ")[0];
      description = warnings[0];
    } else if (v.dampening > 0.7) {
      label = "Global Suppression";
      description = "Network amplitude reduced; pathological cliques quieted along with healthy ones.";
    } else if (v.arousal > 0.7) {
      label = "Upregulated State";
      description = "Firing rates increased above baseline; spectral peak shifted to higher bands.";
    }
  }

  const subjective: string[] = [];
  states.forEach((s) => subjective.push(PATHOLOGY_META[s].subjective));
  if (v.repair > 1.0 && v.chaos < 0.4 && warnings.length === 0) {
    subjective.unshift("Restored cognitive clarity; effortless focus; emotional contrast returning.");
  }
  if (subjective.length === 0) subjective.push("Baseline: a sense of 'flow', clear cognition, stable affect.");

  return { integrity, R: +R.toFixed(3), K: +K.toFixed(2), label, description, subjective, warnings };
}

// Memoised baseline R so repeated diagnoses stay cheap.
let _baselineR: number | null = null;
function getBaselineR(): number {
  if (_baselineR !== null) return _baselineR;
  const topo = composeTopology([]);
  _baselineR = estimateOrderParameter(
    {
      N: topo.N,
      adjacency: topo.adjacency,
      omegas: Float32Array.from(topo.nodes.map((n) => n.omega)),
      K: 1.0,
      noise: 0.05,
      seed: 13,
    },
    0.04
  );
  return _baselineR;
}
