/**
 * @file qldpc.ts
 * @description QLDPC Resiliency Module
 * 
 * Biological Analogue: Homeostatic synaptic plasticity mending damaged cortical networks.
 * Physics Principle: Quantum Low-Density Parity-Check (QLDPC) Codes & Stabilizer Formalism.
 * Runtime Complexity: O(M * N) for syndrome checks; O(Iter * M * N) for L1 sparse decoding; O(R^3) for Homology ranks.
 * Role in Prevention: Automatically self-heals broken synaptic links by identifying error syndromic homology classes.
 */

import { computeBoundaryOperator, SimplicialComplex } from "./bulk";

/**
 * Computes the syndrome s = \partial_k * x of a synaptic state vector x.
 * 
 * @param x State vector of length N_k (number of k-simplices).
 * @param boundaryMatrix Parity-check boundary matrix \partial_k of size [N_{k-1}][N_k].
 * @returns Syndrome vector s of length N_{k-1}.
 */
export function computeSyndrome(x: number[], boundaryMatrix: number[][]): number[] {
  const m = boundaryMatrix.length;
  if (m === 0) return [];
  const n = boundaryMatrix[0].length;
  if (x.length !== n) {
    throw new Error(`State vector length (${x.length}) must match parity-check column dimension (${n}).`);
  }
  
  const syndrome = new Array(m).fill(0);
  for (let r = 0; r < m; r++) {
    let sum = 0;
    for (let c = 0; c < n; c++) {
      sum += boundaryMatrix[r][c] * x[c];
    }
    syndrome[r] = sum;
  }
  return syndrome;
}

/**
 * Decodes the observed syndrome s to reconstruct the sparse error vector e
 * satisfying \partial_k * e = s.
 * 
 * Implements a continuous L1-regularized sparse decoding loop (Lasso coordinate descent):
 * Min 0.5 * ||\partial_k * e - s||_2^2 + \lambda * ||e||_1
 * 
 * @param syndrome Syndrome vector of length N_{k-1}.
 * @param boundaryMatrix Parity-check matrix of size [N_{k-1}][N_k].
 * @param lambda L1 regularizer coefficient (sparsity control).
 * @returns Reconstructed sparse synaptic error vector e of length N_k.
 */
export function decodeQLDPCSyndrome(
  syndrome: number[],
  boundaryMatrix: number[][],
  lambda = 0.05
): number[] {
  const m = boundaryMatrix.length;
  if (m === 0) return [];
  const n = boundaryMatrix[0].length;
  
  const e = new Array(n).fill(0);
  const residual = [...syndrome]; // Residual r = s - \partial_k * e
  
  const maxIterations = 150;
  const tolerance = 1e-5;
  
  // Cache column norms of boundary matrix for normalization
  const colNormSq = new Array(n).fill(0);
  for (let c = 0; c < n; c++) {
    let sumSq = 0;
    for (let r = 0; r < m; r++) {
      sumSq += boundaryMatrix[r][c] * boundaryMatrix[r][c];
    }
    colNormSq[c] = sumSq === 0 ? 1e-8 : sumSq;
  }
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let maxChange = 0;
    
    for (let c = 0; c < n; c++) {
      const eOld = e[c];
      
      // Calculate correlation with residual: rho = \sum \partial_k[r][c] * (residual[r] + \partial_k[r][c] * eOld)
      let rho = 0;
      for (let r = 0; r < m; r++) {
        rho += boundaryMatrix[r][c] * (residual[r] + boundaryMatrix[r][c] * eOld);
      }
      
      // Soft-thresholding operator
      let eNew = 0;
      if (rho > lambda) {
        eNew = (rho - lambda) / colNormSq[c];
      } else if (rho < -lambda) {
        eNew = (rho + lambda) / colNormSq[c];
      }
      
      if (eNew !== eOld) {
        e[c] = eNew;
        const diff = eNew - eOld;
        // Update residual: residual = residual - \partial_k[:, c] * diff
        for (let r = 0; r < m; r++) {
          residual[r] -= boundaryMatrix[r][c] * diff;
        }
        maxChange = Math.max(maxChange, Math.abs(diff));
      }
    }
    
    if (maxChange < tolerance) break;
  }
  
  return e;
}

/**
 * Computes the rank of a matrix using Gaussian elimination with partial pivoting.
 */
export function computeMatrixRank(matrix: number[][]): number {
  const m = matrix.length;
  if (m === 0) return 0;
  const n = matrix[0].length;
  
  // Clone matrix
  const mat = Array.from({ length: m }, (_, i) => [...matrix[i]]);
  const eps = 1e-9;
  let rank = 0;
  
  const visited = new Array(n).fill(false);
  for (let r = 0; r < m; r++) {
    // Find pivot in row r
    let pivotCol = -1;
    let maxVal = eps;
    for (let c = 0; c < n; c++) {
      if (!visited[c] && Math.abs(mat[r][c]) > maxVal) {
        maxVal = Math.abs(mat[r][c]);
        pivotCol = c;
      }
    }
    
    if (pivotCol === -1) continue;
    
    visited[pivotCol] = true;
    rank++;
    
    // Eliminate entries below
    for (let i = r + 1; i < m; i++) {
      const factor = mat[i][pivotCol] / mat[r][pivotCol];
      for (let j = 0; j < n; j++) {
        mat[i][j] -= factor * mat[r][j];
      }
    }
  }
  
  return rank;
}

/**
 * Computes Betti Number \beta_k (dimension of homology group H_k = ker(\partial_k) / im(\partial_{k+1})).
 * \beta_k = \dim \ker \partial_k - \dim \text{im} \partial_{k+1}
 *          = (N_k - \text{rank} \partial_k) - \text{rank} \partial_{k+1}
 */
export function computeBettiNumber(complex: SimplicialComplex, k: number): number {
  const N_k = complex.simplices[k]?.length ?? 0;
  if (N_k === 0) return 0;
  
  const d_k = computeBoundaryOperator(complex, k);
  const rank_d_k = k === 0 ? 0 : computeMatrixRank(d_k);
  
  const d_kplus1 = computeBoundaryOperator(complex, k + 1);
  const rank_d_kplus1 = computeMatrixRank(d_kplus1);
  
  const betti = N_k - rank_d_k - rank_d_kplus1;
  return Math.max(0, betti);
}
