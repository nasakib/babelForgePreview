/**
 * @file boundary.ts
 * @description Boundary Information Engine
 * 
 * Biological Analogue: Functional connectivity and information routing across cortical parcellations.
 * Physics Principle: Holographic Principle & AdS/CFT Duality; the boundary information space encodes bulk topology.
 * Runtime Complexity: O(N * T + N^2) for Mutual Information Matrix; O(k^3) for Subnetwork Entanglement (LU/Cholesky log-det).
 * Role in Prevention: Evaluates network informational collapse and detects early indicators of pathological state decay.
 */

/**
 * Computes the Shannon Entropy of a discretized single variable.
 * @param timeSeries Continuous signal array of a single node.
 * @param bins Number of bins for histogram discretization. Defaults to 10.
 * @returns Shannon entropy in bits.
 */
export function computeShannonEntropy(timeSeries: number[], bins = 10): number {
  if (timeSeries.length === 0) return 0;
  
  const min = Math.min(...timeSeries);
  const max = Math.max(...timeSeries);
  const range = max - min;
  
  const counts = new Array(bins).fill(0);
  for (const val of timeSeries) {
    let binIdx = range === 0 ? 0 : Math.floor(((val - min) / range) * bins);
    if (binIdx >= bins) binIdx = bins - 1;
    if (binIdx < 0) binIdx = 0;
    counts[binIdx]++;
  }
  
  let entropy = 0;
  const n = timeSeries.length;
  for (const count of counts) {
    if (count > 0) {
      const p = count / n;
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

/**
 * Computes the Joint Shannon Entropy of two discretized variables.
 * @param tsA Time series of node A.
 * @param tsB Time series of node B.
 * @param bins Number of bins for discretization.
 * @returns Joint Shannon entropy in bits.
 */
export function computeJointEntropy(tsA: number[], tsB: number[], bins = 10): number {
  if (tsA.length !== tsB.length || tsA.length === 0) return 0;
  
  const minA = Math.min(...tsA), maxA = Math.max(...tsA), rangeA = maxA - minA;
  const minB = Math.min(...tsB), maxB = Math.max(...tsB), rangeB = maxB - minB;
  
  const jointCounts = Array.from({ length: bins }, () => new Array(bins).fill(0));
  const n = tsA.length;
  
  for (let i = 0; i < n; i++) {
    let binA = rangeA === 0 ? 0 : Math.floor(((tsA[i] - minA) / rangeA) * bins);
    if (binA >= bins) binA = bins - 1;
    if (binA < 0) binA = 0;
    
    let binB = rangeB === 0 ? 0 : Math.floor(((tsB[i] - minB) / rangeB) * bins);
    if (binB >= bins) binB = bins - 1;
    if (binB < 0) binB = 0;
    
    jointCounts[binA][binB]++;
  }
  
  let jointEntropy = 0;
  for (let i = 0; i < bins; i++) {
    for (let j = 0; j < bins; j++) {
      const count = jointCounts[i][j];
      if (count > 0) {
        const p = count / n;
        jointEntropy -= p * Math.log2(p);
      }
    }
  }
  
  return jointEntropy;
}

/**
 * Computes the discrete mutual information I(A : B) between two node channels.
 */
export function computeDiscreteMutualInformation(tsA: number[], tsB: number[], bins = 10): number {
  const hA = computeShannonEntropy(tsA, bins);
  const hB = computeShannonEntropy(tsB, bins);
  const hAB = computeJointEntropy(tsA, tsB, bins);
  return Math.max(0, hA + hB - hAB);
}

/**
 * Computes the dense functional Mutual Information Matrix from a set of continuous time series.
 * @param timeSeriesData Matrix of size [N_nodes][T_timesteps].
 * @param bins Discretization bins.
 */
export function computeMutualInformationMatrix(timeSeriesData: number[][], bins = 10): number[][] {
  const n = timeSeriesData.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    matrix[i][i] = computeShannonEntropy(timeSeriesData[i], bins);
  }
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const mi = computeDiscreteMutualInformation(timeSeriesData[i], timeSeriesData[j], bins);
      matrix[i][j] = mi;
      matrix[j][i] = mi;
    }
  }
  
  return matrix;
}

/**
 * Helper to compute the covariance matrix of a subset of variables.
 * @param data Continuous matrix of size [N_variables][T_timesteps].
 * @param indices Selection indices.
 */
export function computeCovarianceMatrix(data: number[][], indices: number[]): number[][] {
  const k = indices.length;
  if (k === 0) return [[]];
  const t = data[0].length;
  
  const means = indices.map(idx => {
    let sum = 0;
    for (let j = 0; j < t; j++) sum += data[idx][j];
    return sum / t;
  });
  
  const cov = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let r = 0; r < k; r++) {
    const idxR = indices[r];
    for (let c = r; c < k; c++) {
      const idxC = indices[c];
      let sum = 0;
      for (let j = 0; j < t; j++) {
        sum += (data[idxR][j] - means[r]) * (data[idxC][j] - means[c]);
      }
      const val = sum / (t - 1 || 1);
      cov[r][c] = val;
      cov[c][r] = val;
    }
  }
  
  return cov;
}

/**
 * Performs Cholesky decomposition of a symmetric positive-definite matrix
 * and returns its log-determinant.
 * Appends a ridge regularization on failure.
 */
export function computeLogDeterminant(cov: number[][]): number {
  const n = cov.length;
  if (n === 0) return -Infinity;
  
  // Clone covariance matrix to avoid mutations
  const a = Array.from({ length: n }, (_, i) => [...cov[i]]);
  
  // Add slight ridge regularization for numerical stability (Bayesian observational noise)
  const ridge = 1e-6;
  for (let i = 0; i < n; i++) {
    a[i][i] += ridge;
  }
  
  const l = Array.from({ length: n }, () => new Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += l[i][k] * l[j][k];
      }
      
      if (i === j) {
        const val = a[i][i] - sum;
        l[i][j] = val <= 0 ? Math.sqrt(ridge) : Math.sqrt(val);
      } else {
        l[i][j] = l[j][j] === 0 ? 0 : (a[i][j] - sum) / l[j][j];
      }
    }
  }
  
  // Log-determinant is 2 * sum(ln(L_ii))
  let logDet = 0;
  for (let i = 0; i < n; i++) {
    logDet += Math.log(l[i][i]);
  }
  
  return 2 * logDet;
}

/**
 * Computes Gaussian analytical joint entropy for a subnetwork selection.
 * H(X) = (k/2)*(1 + ln(2*pi)) + 0.5 * ln(|Sigma|)
 */
export function computeGaussianJointEntropy(cov: number[][]): number {
  const k = cov.length;
  if (k === 0) return 0;
  
  const logDet = computeLogDeterminant(cov);
  const constTerm = (k / 2) * (1 + Math.log(2 * Math.PI));
  
  // Convert nats to bits by dividing by ln(2)
  return (constTerm + 0.5 * logDet) / Math.LN2;
}

/**
 * Evaluates the informational entanglement between subnetwork selection A and B.
 * Calculates I(A : B) = H(A) + H(B) - H(A U B) using analytical Gaussian joint entropy.
 */
export function computeBoundaryEntanglement(
  timeSeriesData: number[][],
  indicesA: number[],
  indicesB: number[]
): number {
  if (indicesA.length === 0 || indicesB.length === 0) return 0;
  
  // Deduplicate and union
  const unionSet = new Set([...indicesA, ...indicesB]);
  const indicesUnion = Array.from(unionSet);
  
  const covA = computeCovarianceMatrix(timeSeriesData, indicesA);
  const covB = computeCovarianceMatrix(timeSeriesData, indicesB);
  const covUnion = computeCovarianceMatrix(timeSeriesData, indicesUnion);
  
  const hA = computeGaussianJointEntropy(covA);
  const hB = computeGaussianJointEntropy(covB);
  const hUnion = computeGaussianJointEntropy(covUnion);
  
  return Math.max(0, hA + hB - hUnion);
}
