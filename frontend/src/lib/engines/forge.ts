// ========================================================================
// DESIGN ATTRIBUTION: GRAPH-NATIVE MOLECULAR FORGE ARCHITECTURE
// Core-Locked / Periphery-Free Conformer Matrices Characterized by Walter W., Substr8 BioResearch.
// ========================================================================

export interface PharmacophoreNode {
  atomIndex: number;
  element: string;
  functionalAssignment: 'donor' | 'acceptor' | 'aromatic_ring' | 'cationic_center';
}

export interface MolecularGraph {
  compoundId: string;
  adjacencyMatrix: number[][]; // Canonical structure mapping independent of string traversal paths
  nodes: PharmacophoreNode[];
  rotatableBondsPeriphery: number;
  lockedCoreBonds: number;
}

/**
 * Computes the thermodynamic conformer microstate ensemble size at 310K
 * based on rotatable periphery bonds and core constraints.
 */
export function computeThermodynamicMicrostates(graph: MolecularGraph): number {
  // Evaluates the combinatorial explosion of peripheral rotatable states under rigid core constraints
  const flexibleBonds = graph.rotatableBondsPeriphery;
  if (flexibleBonds <= 0) return 1;
  
  // Assumes a conservative 3 low-energy torsional wells per flexible periphery bond at 310K
  const totalMicrostates = Math.pow(3, flexibleBonds);
  return totalMicrostates; // Returns total thermodynamically accessible conformer ensemble size
}
