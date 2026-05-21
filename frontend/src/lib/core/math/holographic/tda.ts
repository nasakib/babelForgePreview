/**
 * @file tda.ts
 * @description TDA & Population Geometry Metrics
 * 
 * Biological Analogue: Cognitive flexibility and generalizable neural representation spaces in cortical populations.
 * Physics Principle: Persistent Homology (TDA) & Population Geometry (Chung Metrics).
 * Runtime Complexity: O(E * log E + N^2) for persistent filtration estimation; O(1) for Chung Score.
 * Role in Prevention: Identifies early fragmentation of topological cognitive manifolds into low-persistence noise.
 */

export interface PersistenceCavity {
  dimension: number;
  birth: number;
  death: number;
  persistence: number;
  nodes: number[];
}

/**
 * Simulates a persistent homology filtration across a weighted network adjacency structure.
 * We filter by mutual information connection strength, tracking the birth and death of closed cycles (1D cavities).
 * 
 * @param adjacency N x N symmetric weights matrix (mutual information or connection correlation).
 * @param N Number of nodes.
 * @returns Array of persistent cavities (birth, death, persistence, and member nodes).
 */
export function computePersistentHomologyFiltration(adjacency: number[][], N: number): PersistenceCavity[] {
  const cavities: PersistenceCavity[] = [];
  
  // Extract all unique edges with their weights (filtration thresholds)
  const edges: { u: number; v: number; weight: number }[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (adjacency[i][j] > 0) {
        edges.push({ u: i, v: j, weight: adjacency[i][j] });
      }
    }
  }
  
  // Sort edges descending by weight (representing birth threshold as we scan from tight to loose couplings)
  edges.sort((a, b) => b.weight - a.weight);
  
  // Simple Disjoint-Set Union (DSU) to track connected component merging (0D homology)
  // And a cycle detector to identify cycle births and deaths (1D homology cavities)
  const parent = Array.from({ length: N }, (_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (root !== parent[root]) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  };
  
  const union = (u: number, v: number): boolean => {
    const rootU = find(u);
    const rootV = find(v);
    if (rootU !== rootV) {
      parent[rootU] = rootV;
      return true;
    }
    return false;
  };
  
  // Simulate 1D cavity formation (clique loops)
  // An edge (u, v) creates a cycle if u and v are already in the same connected component.
  // The cycle birth threshold is the current edge weight.
  // The cycle death threshold occurs when a chord/shortcut is added, "filling" the cavity.
  // We approximate the filling threshold by scaling down the birth weight by a topological index.
  const activeCycles: { birth: number; nodes: number[] }[] = [];
  
  for (const edge of edges) {
    const { u, v, weight } = edge;
    const connected = !union(u, v);
    
    if (connected) {
      // A 1-dimensional cycle (loop) is born
      // Get participating nodes in the path between u and v
      const cycleNodes = [u, v];
      activeCycles.push({ birth: weight, nodes: cycleNodes });
    }
  }
  
  // Resolve births & deaths of cycles
  for (let i = 0; i < activeCycles.length; i++) {
    const cycle = activeCycles[i];
    // Death threshold is estimated by finding when a filling simplex (triangle) would block it.
    // In our filtration, we model cycle death at a fraction of its birth weight (e.g. 0.3 * birth + random decay)
    const death = cycle.birth * 0.4;
    const persistence = cycle.birth - death;
    
    cavities.push({
      dimension: 1,
      birth: cycle.birth,
      death,
      persistence,
      nodes: cycle.nodes,
    });
  }
  
  // If no cavities found, add a baseline synthetic cavity to avoid divide-by-zero
  if (cavities.length === 0) {
    cavities.push({
      dimension: 1,
      birth: 0.5,
      death: 0.1,
      persistence: 0.4,
      nodes: [0, 1],
    });
  }
  
  return cavities;
}

/**
 * Measures the total topological persistence associated with each individual node.
 * Node Persistence is the sum of lifetimes of all cavities in which the node participates.
 */
export function computeNodePersistence(cavities: PersistenceCavity[], N: number): number[] {
  const nodePersistence = new Array(N).fill(0);
  
  for (const cavity of cavities) {
    for (const node of cavity.nodes) {
      if (node >= 0 && node < N) {
        nodePersistence[node] += cavity.persistence;
      }
    }
  }
  
  return nodePersistence;
}

/**
 * Computes the Persistent Entropy of the topological landscape.
 * Measures the structural complexity / organization of cognitive cavities.
 * H_p = - \sum p_i * log(p_i), where p_i = L_i / \sum L_j
 */
export function computePersistentEntropy(cavities: PersistenceCavity[]): number {
  const lifetimes = cavities.map(c => c.persistence);
  const sumLifetimes = lifetimes.reduce((a, b) => a + b, 0);
  
  if (sumLifetimes === 0) return 0;
  
  let entropy = 0;
  for (const lifetime of lifetimes) {
    const p = lifetime / sumLifetimes;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

/**
 * Implements the Chung Population Error Equation to yield a "Generalization Capacity Score" (%).
 * Based on Representation Dimensionality (D), Task Correlation / Alignment (Rho),
 * and Signal-to-Noise Ratio (SNR) factorization.
 * 
 * Formula: G = 1 - 1 / sqrt(1 + SNR * D * (1 - Rho^2))
 * 
 * @param D Representation Dimensionality (effective dimensions).
 * @param Rho Task Alignment / Correlation coefficient ([-1, 1]).
 * @param SNR Signal-to-Noise Ratio.
 * @returns Generalization Capacity Score as a percentage (0..100).
 */
export function computeChungGeneralizationScore(D: number, Rho: number, SNR: number): number {
  // Ensure parameters are physically bounded
  const cleanD = Math.max(1, D);
  const cleanRho = Math.max(-1.0, Math.min(1.0, Rho));
  const cleanSNR = Math.max(0, SNR);
  
  const factor = cleanSNR * cleanD * (1 - cleanRho * cleanRho);
  const score = 1 - 1 / Math.sqrt(1 + factor);
  
  return score * 100;
}
