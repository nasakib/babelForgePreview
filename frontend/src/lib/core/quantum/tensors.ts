/**
 * @file tensors.ts
 * @description Bi-directional Geometric Connectome Compiler
 * 
 * Biological Analogue: Cortical structural coordinate mappings linking Yeo 7Networks hubs.
 * Physics Principle: Symmetric relation tensor mapping; cross-hemispheric phase-locked pathways.
 * Runtime Complexity: O(N^2) to compile symmetric adjacency matrices.
 * Role in Prevention: Standardizes cross-hemispheric pathways to maintain connectome homeostatic balance.
 */

import { getSchaefer200ROIs, BrainNode } from "../data/harmonizer";

export interface ConnectomeEdge {
  nodeU: number;
  nodeV: number;
  label: string;
  networkU: string;
  networkV: string;
  weight: number;
}

/**
 * List of the 10 critical structural target connectome pairings from the notebook.
 * Represents essential cross-hemispheric and network-to-network hubs.
 */
export const TARGET_10_CONNECTIONS: { u: number; v: number; label: string }[] = [
  { u: 48,  v: 156, label: "LH SalVentAttn to RH SalVentAttn (Cross-Hemispheric Salience)" },
  { u: 50,  v: 118, label: "LH SalVentAttn to RH SomMot (Salience-Somatomotor Interface)" },
  { u: 68,  v: 118, label: "LH Cont to RH SomMot (Control-Somatomotor Pathway)" },
  { u: 67,  v: 109, label: "LH Cont to RH Vis (Control-Visual Coordination)" },
  { u: 95,  v: 153, label: "LH Default to RH SalVentAttn (DMN-Salience Control)" },
  { u: 96,  v: 189, label: "LH Default to RH Default (Cross-Hemispheric DMN)" },
  { u: 118, v: 146, label: "RH SomMot to RH DorsAttn (Somatomotor-Attention Hub)" },
  { u: 42,  v: 118, label: "LH DorsAttn to RH SomMot (Dorsal Attention-Somatomotor Path)" },
  { u: 9,   v: 109, label: "LH Vis to RH Vis (Cross-Hemispheric Visual Loop)" },
  { u: 52,  v: 145, label: "LH SalVentAttn to RH DorsAttn (Salience-Attention Gateway)" }
];

/**
 * Compiles a symmetric 200x200 relational adjacency matrix.
 * Starts with a K-Nearest-Neighbors (KNN) baseline structural connectome based on physical
 * Euclidean distances of Schaefer 200-ROI coordinates, and overlays the 10 targeted coordination hubs.
 * 
 * @param activeHubWeights Maps edge keys (e.g. "48,156") to custom weight values.
 * @returns 200 x 200 dense symmetric adjacency matrix.
 */
export function compileSymmetricConnectome(activeHubWeights: Map<string, number> = new Map()): number[][] {
  const N = 200;
  const nodes = getSchaefer200ROIs();
  
  const adjacency = Array.from({ length: N }, () => new Array(N).fill(0));
  
  // 1. Establish KNN structural baseline (K=5 nearest neighbors based on Euclidean distance)
  const K = 5;
  for (let i = 0; i < N; i++) {
    const nodeI = nodes[i];
    const distances = nodes
      .map((nodeJ, idx) => {
        if (i === idx) return { idx, d: Infinity };
        const dx = nodeI.x - nodeJ.x;
        const dy = nodeI.y - nodeJ.y;
        const dz = nodeI.z - nodeJ.z;
        return { idx, d: Math.sqrt(dx * dx + dy * dy + dz * dz) };
      })
      .sort((a, b) => a.d - b.d);
      
    for (let k = 0; k < K; k++) {
      const j = distances[k].idx;
      // Default baseline edge weight
      adjacency[i][j] = 0.55;
      adjacency[j][i] = 0.55;
    }
  }
  
  // 2. Inject the 10 critical structural target connectome pairings with symmetric properties
  for (const conn of TARGET_10_CONNECTIONS) {
    const u = conn.u - 1; // Convert 1-indexed ROI to 0-indexed index
    const v = conn.v - 1;
    
    // Retrieve custom weight if set, otherwise default to a strong coupling weight of 0.85
    const edgeKey = `${u},${v}`;
    const weight = activeHubWeights.get(edgeKey) ?? activeHubWeights.get(`${v},${u}`) ?? 0.85;
    
    adjacency[u][v] = weight;
    adjacency[v][u] = weight;
  }
  
  return adjacency;
}

/**
 * Returns a list of edges that represent active high-importance pathways.
 */
export function getActiveTargetEdges(adjacency: number[][]): ConnectomeEdge[] {
  const nodes = getSchaefer200ROIs();
  const activeEdges: ConnectomeEdge[] = [];
  
  for (const conn of TARGET_10_CONNECTIONS) {
    const u = conn.u - 1;
    const v = conn.v - 1;
    const weight = adjacency[u][v];
    
    activeEdges.push({
      nodeU: u,
      nodeV: v,
      label: conn.label,
      networkU: nodes[u].network,
      networkV: nodes[v].network,
      weight: parseFloat(weight.toFixed(4))
    });
  }
  
  return activeEdges;
}
