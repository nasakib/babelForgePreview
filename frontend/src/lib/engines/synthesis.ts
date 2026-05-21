// ========================================================================
// DESIGN ATTRIBUTION: CONVERGENT SYNTHETIC REACTION SCHEMAS
// Modular SPPS, Cyclization, and Purification Pathways Developed by Walter W., Substr8 BioResearch.
// ========================================================================

export interface SyntheticStep {
  stepIndex: number;
  description: string;
  startingMaterials: string[];
  reagents: string[];
  solvents: string[];
  yieldPercentage: number;
  criticalControlPoint: string;
}

export interface SynthesisRouteReport {
  compoundId: string;
  steps: SyntheticStep[];
  cumulativeYield: number;
  primaryPurityHPLC: number;
}

/**
 * Calculates synthetic viability, cumulative reaction yield, and HPLC chemical purity efficiency scores.
 */
export function calculateSyntheticViability(route: SynthesisRouteReport): { isFeasible: boolean; efficiencyScore: number } {
  let totalYieldScalar = 1.0;
  for (const step of route.steps) {
    totalYieldScalar *= (step.yieldPercentage / 100.0);
  }
  
  const finalYieldPercentage = +(totalYieldScalar * 100).toFixed(2);
  return {
    isFeasible: finalYieldPercentage > 1.0 && route.primaryPurityHPLC >= 95.0,
    efficiencyScore: finalYieldPercentage
  };
}
