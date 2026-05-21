/**
 * @file ryuTakayanagi.ts
 * @description Ryu-Takayanagi Mapping & Optimization Pipeline
 * 
 * Biological Analogue: Cortical structural pathways mending functional informational routing deficits.
 * Physics Principle: Ryu-Takayanagi Formula (AdS/CFT); boundary entanglement entropy equals bulk minimal surface area.
 * Runtime Complexity: O(Iter * M^2) for minimal cut quadratic solver; O(Iter * E * N) for gradient-based repair.
 * Role in Prevention: Reconstructs collapsed high-dimensional cavities by calculating optimal sparse structural welds.
 */

import { computeBoundaryOperator, computeCombinatorialHodgeLaplacian, SimplicialComplex } from "./bulk";

/**
 * Solves for the minimal structural surface cut \gamma_A in the bulk
 * that minimizes the Hodge Laplacian quadratic form: Tr(\gamma_A^T * L_k * \gamma_A)
 * subject to boundary constraints where nodes in region A are 1, and in B are 0.
 * 
 * @param L_k Combinatorial Hodge Laplacian of dimension k (size M x M).
 * @param complex The simplicial complex.
 * @param k Simplex dimension.
 * @param indicesA Nodes in boundary subnetwork selection A.
 * @param indicesB Nodes in boundary subnetwork selection B (complement).
 * @returns Indicator vector \gamma_A of length M representing the minimal surface cut.
 */
export function solveRyuTakayanagiCut(
  L_k: number[][],
  complex: SimplicialComplex,
  k: number,
  indicesA: number[],
  indicesB: number[]
): number[] {
  const M = L_k.length;
  if (M === 0 || L_k[0].length === 0) return [];
  
  const simplices = complex.simplices[k] ?? [];
  const gamma = new Array(M).fill(0.5); // Initialize with mid-state continuous relaxation
  
  // Define boundary constraints on the simplices
  // If all vertices of a k-simplex are in A, force gamma = 1.
  // If all vertices are in B, force gamma = 0.
  const isFixed = new Array(M).fill(false);
  const fixedValue = new Array(M).fill(0.5);
  
  for (let i = 0; i < M; i++) {
    const simplex = simplices[i];
    
    const inA = simplex.every(node => indicesA.includes(node));
    const inB = simplex.every(node => indicesB.includes(node));
    
    if (inA) {
      isFixed[i] = true;
      fixedValue[i] = 1.0;
      gamma[i] = 1.0;
    } else if (inB) {
      isFixed[i] = true;
      fixedValue[i] = 0.0;
      gamma[i] = 0.0;
    }
  }
  
  // Iterative Projected Gradient Descent solver to minimize \gamma^T * L_k * \gamma
  const maxIterations = 200;
  const learningRate = 0.05;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const grad = new Array(M).fill(0);
    
    // Compute gradient: \nabla = 2 * L_k * \gamma
    for (let r = 0; r < M; r++) {
      let sum = 0;
      for (let c = 0; c < M; c++) {
        sum += L_k[r][c] * gamma[c];
      }
      grad[r] = 2 * sum;
    }
    
    // Update and project
    let diff = 0;
    for (let i = 0; i < M; i++) {
      if (isFixed[i]) continue;
      
      const prev = gamma[i];
      // Move in direction of negative gradient
      let next = gamma[i] - learningRate * grad[i];
      // Project to [0, 1] box constraints
      next = Math.max(0.0, Math.min(1.0, next));
      
      gamma[i] = next;
      diff += Math.abs(next - prev);
    }
    
    if (diff < 1e-4) break;
  }
  
  return gamma;
}

/**
 * Tracks geometric anomalies by matching drops in boundary mutual information to bulk Hodge Laplacian energy.
 * Returns indices of "collapsed" simplicial cavities where functional routing has failed.
 */
export function trackGeometricAnomalies(
  mutualInformationMatrix: number[][],
  complex: SimplicialComplex,
  k: number,
  baselineIntegrity = 0.85
): { collapsedSimplexIndices: number[]; anomalyScores: number[] } {
  const simplices = complex.simplices[k] ?? [];
  const M = simplices.length;
  
  const collapsedSimplexIndices: number[] = [];
  const anomalyScores: number[] = [];
  
  for (let i = 0; i < M; i++) {
    const simplex = simplices[i];
    
    // Compute the average mutual information among vertices of this simplex
    let sumMI = 0;
    let counts = 0;
    for (let r = 0; r < simplex.length; r++) {
      for (let c = r + 1; c < simplex.length; c++) {
        sumMI += mutualInformationMatrix[simplex[r]][simplex[c]];
        counts++;
      }
    }
    const avgMI = counts === 0 ? 0 : sumMI / counts;
    
    // An anomaly is registered if mutual information falls below baseline thresholds
    if (avgMI < baselineIntegrity) {
      collapsedSimplexIndices.push(i);
      anomalyScores.push(Math.max(0, baselineIntegrity - avgMI));
    }
  }
  
  return { collapsedSimplexIndices, anomalyScores };
}

export interface StructuralWeld {
  nodeU: number;
  nodeV: number;
  weight: number;
}

/**
 * Repair Optimization Routine: Calculates the gradient \nabla_{\partial} to solve for
 * the minimal sparse structural weights (structural welds) required to mend a collapsed k-simplex cavity.
 * 
 * We identify which edges (1-simplices) are missing or weak that, if added/strengthened, would
 * maximize Hodge Laplacian diffusion energy Tr(\gamma^T * L_k * \gamma) and bridge the information gap.
 */
export function optimizeRepairs(
  complex: SimplicialComplex,
  collapsedIndices: number[],
  gamma: number[],
  N: number,
  maxWelds = 10
): StructuralWeld[] {
  const welds: StructuralWeld[] = [];
  if (collapsedIndices.length === 0 || gamma.length === 0) return welds;
  
  // To mend a collapsed k-simplex, we calculate the gradient of the surface energy
  // with respect to potential structural edges (u, v) that are NOT currently present,
  // or are currently weak.
  // The goal is to strengthen connections that join nodes of the collapsed simplices.
  
  const potentialWelds = new Map<string, number>();
  
  for (const idx of collapsedIndices) {
    const simplex = complex.simplices[complex.simplices.length - 1]?.[idx] ?? 
                    complex.simplices[1]?.[idx] ?? [];
    
    if (simplex.length < 2) continue;
    
    const scale = gamma[idx] ?? 1.0;
    
    // For every pair of nodes in the collapsed simplex, we evaluate the repair gradient
    for (let i = 0; i < simplex.length; i++) {
      for (let j = i + 1; j < simplex.length; j++) {
        const u = Math.min(simplex[i], simplex[j]);
        const v = Math.max(simplex[i], simplex[j]);
        const key = `${u},${v}`;
        
        // Gradient contribution: larger cuts (gamma near 1) inside collapsed regions require stronger welds
        const gradient = scale * (1.5 - (gamma[idx] ?? 0));
        potentialWelds.set(key, (potentialWelds.get(key) ?? 0) + gradient);
      }
    }
  }
  
  // Sort potential welds by gradient score
  const sorted = Array.from(potentialWelds.entries())
    .map(([key, score]) => {
      const [u, v] = key.split(",").map(Number);
      return { nodeU: u, nodeV: v, weight: score };
    })
    .sort((a, b) => b.weight - a.weight);
  
  // Return up to maxWelds
  return sorted.slice(0, maxWelds);
}
