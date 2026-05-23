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
import { translateSubjective, type SubjectiveProfile } from "./subjective";
import type { PatientProfile } from "@/lib/patient/profile";
import { computePharmaChemVectors, type OccupancyResult } from "./pharmaChemEngine";

export interface PharmaVectors {
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
}

export interface PatientParams {
  weightKg: number;
  toleranceMonths: number; // global, simplified
  ageYears: number;
  simulationTimeMonths: number; // Time Engine
  profile?: PatientProfile;
  elapsedHrs?: number; // Added to capture real-time PK decay!
}

export interface RestorationMetric {
  target: string;
  factor: string;
  value: number;
  description: string;
}

export interface DiagnosticReport {
  integrity: number;        // 0..100
  R: number;                // Kuramoto order parameter
  K: number;                // effective coupling
  label: string;
  description: string;
  subjective: string[];
  warnings: string[];
  structuralPlasticityK: number; // delta to K based on time
  correctionConvergence: number; // 0..100% convergence to healthy baseline
  holisticSynergyBonus: number;  // synergistic amplifier (e.g. 1.0..1.5)
  activeCorrections: RestorationMetric[];
  subjectiveProfile?: SubjectiveProfile;
  occupancies?: OccupancyResult; // Exposes physical receptor occupancy profiles
  vectors?: PharmaVectors;      // Exposes decayed or modified vectors
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
  patient: PatientParams,
  stack: any[] = []
): DiagnosticReport {
  const topo = composeTopology(states);
  
  // Temporal Engine Integration
  // Interplay: older starting age accelerates biological aging drift over the simulation time horizon
  const biologicalAgingAcceleration = 1.0 + Math.max(0, (patient.ageYears - 45) / 15);
  const effectiveAge = patient.ageYears + (patient.simulationTimeMonths / 12) * biologicalAgingAcceleration;
  const prolongedExposure = patient.simulationTimeMonths;
  
  // Tolerance grows over time if compounds are present
  const dynamicTolerance = patient.toleranceMonths + prolongedExposure;
  
  const weightFactor = 70 / Math.max(40, patient.weightKg);
  const tolFactor = 1 / (1 + Math.log1p(dynamicTolerance * 0.08));
  // Age factor: older age generally reduces neuroplasticity (repair efficacy) and increases sensitivity to dampening/chaos
  const ageFactor = effectiveAge > 60 ? (1 - (effectiveAge - 60) * 0.015) : 1.0;
  const ageSensitivity = effectiveAge > 65 ? 1.2 : 1.0;

  // Scan the stack for active compounds to calculate synergy & direct counteractions
  let hasCBT = false;
  let hasBreathwork = false;
  let hasMeditation = false;
  let hasSleep = false;
  let hasHBOT = false;
  let hasColdPlunge = false;
  let hasLionMane = false;
  let hasNRG01 = false;
  let hasNAC = false;
  let hasNX44 = false;
  let hasClonidine = false;
  let hasSR17 = false;
  
  const activeMols = new Set<string>();
  
  if (stack && Array.isArray(stack)) {
    for (const item of stack) {
      const intensity = item.dose ?? item.currentIntensity ?? 0;
      if (intensity > 0) {
        activeMols.add(item.id);
        if (item.id === 'cbt') hasCBT = true;
        if (item.id === 'breathwork') hasBreathwork = true;
        if (item.id === 'meditation') hasMeditation = true;
        if (item.id === 'sleep') hasSleep = true;
        if (item.id === 'hbot') hasHBOT = true;
        if (item.id === 'coldplunge') hasColdPlunge = true;
        if (item.id === 'lionmane') hasLionMane = true;
        if (item.id === 'nrg01') hasNRG01 = true;
        if (item.id === 'nac') hasNAC = true;
        if (item.id === 'nx44') hasNX44 = true;
        if (item.id === 'clonidine') hasClonidine = true;
        if (item.id === 'sr17') hasSR17 = true;
      }
    }
  }

  let holisticSynergyBonus = 1.0;
  const activeCorrections: RestorationMetric[] = [];
  
  // Dopaminergic Regeneration Synergy
  if (hasNRG01 && hasColdPlunge) {
    holisticSynergyBonus += 0.20;
    activeCorrections.push({
      target: "Dopamine Pathways",
      factor: "NRG-01 + Cold Plunge",
      value: 20,
      description: "Dopaminergic Regeneration engaged: Accelerated receptor resensitization."
    });
  }
  
  // Glutamatergic Stabilization Synergy
  if (hasNAC && hasMeditation) {
    holisticSynergyBonus += 0.15;
    activeCorrections.push({
      target: "Glutamatergic Synapses",
      factor: "NAC + Meditation",
      value: 15,
      description: "Glutamatergic Stabilization engaged: Reduced excitotoxic baseline noise."
    });
  }
  
  // Axonal Growth / BDNF Synergy
  if (hasNX44 && hasLionMane) {
    holisticSynergyBonus += 0.30;
    activeCorrections.push({
      target: "Axonal Structure",
      factor: "NX-44 + Lion's Mane",
      value: 30,
      description: "BDNF / Axonal Regrowth Synergy: Maximum structural repair projection."
    });
  }
  
  // Autonomic Rebalancing Synergy
  if (hasClonidine && hasBreathwork) {
    holisticSynergyBonus += 0.25;
    activeCorrections.push({
      target: "Autonomic Nervous System",
      factor: "Clonidine + Breathwork",
      value: 25,
      description: "Autonomic Rebalancing: Deep down-regulation of adrenergic distress."
    });
  }

  // Direct Pathological Counteractions
  const hasDepression = states.includes("DEPRESSION");
  const hasPTSD = states.includes("PTSD");
  const hasAddiction = states.includes("ADDICTION") || states.includes("WITHDRAWAL_OPIOID");
  
  if (hasDepression && hasCBT) {
    activeCorrections.push({
      target: "Default Mode Network",
      factor: "CBT / Talk Therapy",
      value: 35,
      description: "Direct DMN Down-regulation: Cognitively disrupting hyper-stable DMN connectivity."
    });
  }
  
  if (hasPTSD && (hasBreathwork || hasMeditation)) {
    activeCorrections.push({
      target: "Limbic Network",
      factor: hasBreathwork && hasMeditation ? "Breathwork & Meditation" : (hasBreathwork ? "Somatic Breathwork" : "Mindfulness Meditation"),
      value: 40,
      description: "Limbic Dampening: Down-regulating hyper-sensitized amygdala responses."
    });
  }

  if (hasAddiction) {
    const activeCures: string[] = [];
    if (activeMols.has("sr17")) activeCures.push("SR17-018");
    if (activeMols.has("agmatine")) activeCures.push("Agmatine");
    if (activeMols.has("acamprosate")) activeCures.push("Acamprosate");
    if (activeMols.has("flumazenil")) activeCures.push("Flumazenil");
    
    if (activeCures.length > 0) {
      activeCorrections.push({
        target: "Reward Circuitry",
        factor: activeCures.join(" + "),
        value: 50,
        description: "Connectome Correction: Actively returning receptor structures to baseline."
      });
    }
  }

  if (hasSleep || hasHBOT) {
    activeCorrections.push({
      target: "Structural Connectome",
      factor: hasSleep && hasHBOT ? "Sleep + HBOT" : (hasSleep ? "Optimized Sleep" : "Hyperbaric Oxygen"),
      value: 20,
      description: "Axonal Rejuvenation: Reversing prolonged micro-structural decay and edge-loss."
    });
  }

  // Synergy applies to repair and dampens chaos
  let synergyRepairMultiplier = holisticSynergyBonus;
  let synergyChaosMultiplier = 1.0;
  
  if (hasNRG01 && hasColdPlunge) {
    synergyChaosMultiplier -= 0.15;
  }
  if (hasNAC && hasMeditation) {
    synergyChaosMultiplier -= 0.20;
  }
  synergyChaosMultiplier = Math.max(0.4, synergyChaosMultiplier);

  // Ingest Patient Genotypic & Physiological Factors
  let cypFactor = 1.0;
  if (patient.profile?.pgx?.cyp2d6 === "PM" || patient.profile?.pgx?.cyp2c19 === "PM") {
    cypFactor = 1.35; // slow metabolizers accumulate active compounds
  } else if (patient.profile?.pgx?.cyp2d6 === "UM" || patient.profile?.pgx?.cyp2c19 === "UM") {
    cypFactor = 0.65; // rapid metabolizers clear compounds too quickly
  }

  // BDNF Val66Met genetic neuroplasticity capacity scaling
  let bdnfFactor = 1.0;
  const pgxData = patient.profile?.pgx as any;
  if (pgxData?.bdnf === "Met/Met" || (patient.profile?.demographics?.ethnicity === "east_asian" && !pgxData?.bdnf)) {
    bdnfFactor = 0.65; // Met/Met or East Asian preset has ~35% lower neuroplasticity capacity
  } else if (pgxData?.bdnf === "Val/Met") {
    bdnfFactor = 0.85; // intermediate neuroplasticity capacity
  }

  // COMT Val158Met baseline cortical phase noise under stress
  let comtNoise = 0.0;
  if (pgxData?.comt === "Met/Met" && (patient.profile?.lifestyle?.perceivedStress ?? 0) >= 6) {
    comtNoise = 0.03; // low COMT activity -> dopamine flood under stress increases cortical phase noise ("worrier")
  }

  let deficiencyRepairPenalty = 1.0;
  if (patient.profile) {
    const pVitD = patient.profile.labs?.vitD;
    const pVitB12 = patient.profile.labs?.vitB12;
    if (pVitD !== undefined && pVitD < 30) deficiencyRepairPenalty -= 0.15;
    if (pVitB12 !== undefined && pVitB12 < 200) deficiencyRepairPenalty -= 0.20;
  }

  // Resolve vectors using pharma-chem engine if stack is available, else fallback
  let activeVectors = vectors;
  let activeOccupancies: OccupancyResult | undefined = undefined;

  if (stack && stack.length > 0) {
    const res = computePharmaChemVectors(stack, patient, patient.elapsedHrs ?? 0);
    activeVectors = res.vectors;
    activeOccupancies = res.occupancies;
  } else {
    // Legacy fallback: apply weightFactor and cypFactor to input vectors
    activeVectors = {
      arousal: vectors.arousal * weightFactor * cypFactor,
      dampening: vectors.dampening * weightFactor * cypFactor,
      chaos: vectors.chaos * weightFactor * cypFactor,
      repair: vectors.repair * weightFactor * (cypFactor > 1 ? 1.1 : cypFactor),
    };
  }

  const v: PharmaVectors = {
    arousal: activeVectors.arousal * tolFactor * ageSensitivity,
    dampening: activeVectors.dampening * tolFactor * ageSensitivity,
    chaos: activeVectors.chaos * tolFactor * ageSensitivity * synergyChaosMultiplier,
    repair: activeVectors.repair * tolFactor * Math.max(0.5, ageFactor) * synergyRepairMultiplier * deficiencyRepairPenalty * bdnfFactor,
  };

  // Structural neuroplasticity (Hebridean learning / BDNF increase via repair over time)
  // Structural excitotoxicity (atrophy via chronic high chaos over time)
  const structuralPlasticityK = (v.repair * Math.log1p(prolongedExposure) * 0.05) - (v.chaos * Math.log1p(prolongedExposure) * 0.08);
  const temporalNoise = (v.chaos * Math.log1p(prolongedExposure) * 0.02) + (effectiveAge > 70 ? (effectiveAge - 70) * 0.005 : 0);

  // Ingest stress and anxiety parameters as phase noise in the Kuramoto model
  let profileNoise = 0;
  if (patient.profile) {
    const pSleep = patient.profile.lifestyle?.sleepHours;
    const pStress = patient.profile.lifestyle?.perceivedStress;
    const pGad = patient.profile.psychometric?.gad7;
    const pHrv = patient.profile.vitals?.hrvRmssd;
    
    if (pSleep !== undefined && pSleep < 6.0) profileNoise += (6.0 - pSleep) * 0.05;
    if (pStress !== undefined && pStress >= 7) profileNoise += (pStress - 5) * 0.02;
    if (pGad !== undefined && pGad >= 12) profileNoise += 0.07;
    if (pHrv !== undefined && pHrv < 25) profileNoise += 0.04;
  }

  const baseK = effectiveCoupling(v);
  const K = Math.max(0.1, baseK + structuralPlasticityK);
  const noise = Math.max(0.01, effectiveNoise(v) + temporalNoise + profileNoise + comtNoise);
  
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

  // Calculate Correction Convergence to baseline
  let correctionConvergence = 100;
  if (states.length > 0) {
    const baseConvergence = Math.max(20, 100 - (states.length * 30));
    const totalRestorationValue = activeCorrections.reduce((sum, c) => sum + c.value, 0);
    const convergenceIncrease = totalRestorationValue * 0.8;
    correctionConvergence = Math.min(100, Math.round(baseConvergence + convergenceIncrease));
  }

  // Label heuristic from vectors + states + time
  let label = states.length === 0 ? "Healthy Baseline" : "Pathological Baseline";
  let description = states.length === 0
    ? "Network entrainment within healthy variance. R(t) ≈ Kuramoto reference."
    : `Detected ${states.length} pathological state${states.length > 1 ? "s" : ""}. Topology composed.`;

  const warnings: string[] = [];
  if (v.dampening > 1.5 && v.arousal > 0.5) warnings.push("Polypharmacy conflict — antagonistic axes co-active.");
  if (v.chaos > 1.8) warnings.push("Topological fragmentation — high stochastic entropy.");
  if (v.arousal > 2.2) warnings.push("Hyperarousal toxicity threshold approached.");
  if (v.dampening > 2.2) warnings.push("Severe CNS depression — global amplitude collapsed.");
  if (structuralPlasticityK < -0.2) warnings.push("Excitotoxic atrophy — long-term damage projected.");

  if (vectors.arousal !== 0 || vectors.dampening !== 0 || vectors.chaos !== 0 || vectors.repair !== 0 || prolongedExposure > 0) {
    if (warnings.length === 0 && v.repair > 0.7 && v.chaos < 0.4) {
      label = structuralPlasticityK > 0.2 ? "Sustained Neuroplastic Growth" : "Topological Optimization";
      description = structuralPlasticityK > 0.2 ? "Long-term exposure has permanently widened Arnold tongues, resulting in structural growth." : "Precision compounds widening Arnold tongues; system re-entraining toward healthy baseline.";
    } else if (warnings.length > 0) {
      label = warnings[0].split(" — ")[0];
      description = warnings[0];
    } else if (v.dampening > 0.7) {
      label = "Global Suppression";
      description = "Network amplitude reduced; pathological cliques quieted along with healthy ones.";
    } else if (v.arousal > 0.7) {
      label = "Upregulated State";
      description = "Firing rates increased above baseline; spectral peak shifted to higher bands.";
    } else if (prolongedExposure > 24 && v.repair < 0.1) {
      label = "Temporal Drift";
      description = "Network aging and steady drift from baseline equilibrium.";
    }
  }

  const subjectiveProfile = translateSubjective(states, v, patient, { R, K: baseK, noise, integrity }, stack);
  
  const finalLabel = subjectiveProfile.qualiaClass;
  const finalDescription = subjectiveProfile.qualiaDescription;
  
  const subjective: string[] = [subjectiveProfile.qualiaDescription, subjectiveProfile.narrative];

  return { 
    integrity, 
    R: +R.toFixed(3), 
    K: +K.toFixed(2), 
    label: finalLabel, 
    description: finalDescription, 
    subjective, 
    warnings, 
    structuralPlasticityK,
    correctionConvergence,
    holisticSynergyBonus: +holisticSynergyBonus.toFixed(2),
    activeCorrections,
    subjectiveProfile,
    occupancies: activeOccupancies,
    vectors: v
  };
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
