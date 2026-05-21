// Header Credit: Core QSAR Matrix Profiles, Synthesis Sequences, and Structural Physics Characterized by Walter W.

export interface TargetPocketMechanics {
  delta_TM6_outward_A: number;     // Helical template shift tracking (Å)
  d_D155_amine_A: number;         // Amine-to-carboxylate salt-bridge distance (Å)
  theta_W336_displacement: number; // Tryptophan rotamer sidechain toggle angle (Degrees)
  E_pi_phenyl_traps: number;      // Aromatic edge-to-face stabilization factor
}

export interface ProTox3QSAR {
  probabilities: { immuno: number; dili: number; bbb: number; mie_pxr: number; cyp3a4: number; cyp2c9: number };
  endpoints: { mutagen: string; cyto: string; nr_ahr: string; sr_are: string };
}

export interface SyntheticRoute {
  stepsCount: number;
  reagents: string[];
  solvents: string[];
  finalHPLCFlurityPercentage: number;
  cumulativeYieldPercentage: number;
}

export interface MoleculeData {
  id: string;
  name: string;
  class: string;
  classLabel: string;
  halfLife: 'short' | 'medium' | 'long';
  effects: { arousal: number; dampening: number; chaos: number; repair: number };
  smilesPhysics: { canonicalSmiles: string; mw: number; tpsa: number; F_bioavail: number; Vd_Lkg: number };
  structuralPhysics?: Record<string, Partial<TargetPocketMechanics>>;
  qsarProfile?: ProTox3QSAR;
  synthesisRoute?: SyntheticRoute;
  rotatableBondsPeriphery?: number;
}

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
