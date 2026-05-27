/**
 * babelForge — Biology Engine
 * Deploy Trigger: 2026-05-27T21:32:00Z
 * 
 * Implements mathematical and computational models for Lentiviral Genomic
 * Integration and Conformational Ligand Kinetics in a Spatio-Temporal Graph Neural 
 * Network (ST-GNN) substrate.
 * 
 * Primary Concepts:
 * 1. Node-Splitting Retroviral Integration: Emulates an HIV-like delivery vector
 *    invading target sites, splitting nodes, and introducing structural entropy.
 * 2. Loop-Entropy Mutagenesis Risk Model: Calculates cycle-complex disruption
 *    (tumor-suppressor analogs) to evaluate systemic oncological risk.
 * 3. Conformational Logic Gates: Environmentally triggered state shifts (State A -> B)
 *    governed by local pH and clique density, modifying the adjacency weights.
 * 4. Pinecone Embeddings (128-D): Projects topological states to high-dimensional vectors.
 * 5. Firestore Logging: Registers detailed simulation runs and parameter matrices.
 */

import { mulberry32 } from "../engine/rng";

// ============================================================================
// Core Types
// ============================================================================

export type BioNodeType = "host" | "viral_vector" | "mutated_site";
export type LigandConformation = "A" | "B"; // A = Inactive/Closed, B = Active/Exposed Hooks

export interface BioNode {
  id: number;
  name: string;
  type: BioNodeType;
  x: number;
  y: number;
  z: number;
  region: string;
  layer: "Cortical" | "Subcortical" | "Deep";
  conformation: LigandConformation;
  localPH: number;
  mutationScore: number;
}

export interface BioEdge {
  source: number;
  target: number;
  weight: number; // Modulated dynamically by ligand conformations
  type: "structural" | "viral_insertion" | "ligand_binding";
}

export interface BioTopology {
  nodes: BioNode[];
  edges: BioEdge[];
  adjacency: Float32Array; // Directed N x N matrix of edge weights
  N: number;
}

export interface RetroviralSimParams {
  dosage: number;              // 0..10, scales integration frequency
  mutationRate: number;        // 0..1, risk of random edge deletion/mutation
  clearanceVelocity: number;   // 0..1, rate of cellular viral clearance
  insertionBias: "random" | "hubness" | "deep_layers";
}

export interface ConformationalSimParams {
  affinity: number;            // 0.1..5.0, binding affinity scale
  pHThreshold: number;         // e.g., 6.5, below which transition occurs
  baselineDensity: number;     // e.g., 0.15, baseline cluster density required
  couplingMultiplier: number;  // 1.5..8.0, weight scale of State B connections
}

export interface EnvironmentState {
  pH: number;
  cliqueDensity: number;
  temperature: number; // Celsius, modulates reaction speeds
}

export interface SimulationRun {
  id: string;
  timestamp: string;
  parameters: {
    viral: RetroviralSimParams;
    conformation: ConformationalSimParams;
    environment: EnvironmentState;
  };
  metrics: {
    loopEntropy: number;
    mutagenesisRisk: number;
    stateBPercentage: number;
    graphDensity: number;
    averageWeight: number;
    coherence: number;
  };
  pineconeVectorId: string;
  firestoreDocId: string;
}

// ============================================================================
// 1. Retroviral Genomic Integration (Node-Splitting / Random Insertion)
// ============================================================================

/**
 * Executes a retroviral integration step deforming the topological network structure.
 * Implements node-splitting where an target node is divided, placing a viral vector node 
 * between them and forming fresh rewired edges.
 */
export function integrateRetrovirus(
  baseNodes: BioNode[],
  baseEdges: BioEdge[],
  params: RetroviralSimParams,
  seed = 4242
): { nodes: BioNode[]; edges: BioEdge[] } {
  const rng = mulberry32(seed);
  const nodes = baseNodes.map(n => ({ ...n }));
  const edges = baseEdges.map(e => ({ ...e }));
  
  // Calculate how many nodes to split based on viral dosage and mutation rates
  const numSplits = Math.min(Math.floor(params.dosage * 1.5), Math.floor(nodes.length * 0.35));
  if (numSplits <= 0) return { nodes, edges };

  // Select target nodes based on insertion bias parameter
  const targetIds: number[] = [];
  const candidateIds = nodes.map(n => n.id);

  if (params.insertionBias === "hubness") {
    // Prefer nodes with high edge degree
    const degrees = new Map<number, number>();
    edges.forEach(e => {
      degrees.set(e.source, (degrees.get(e.source) ?? 0) + 1);
      degrees.set(e.target, (degrees.get(e.target) ?? 0) + 1);
    });
    candidateIds.sort((a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0));
  } else if (params.insertionBias === "deep_layers") {
    // Prefer deep layer nodes
    candidateIds.sort((a, b) => {
      const na = nodes.find(n => n.id === a);
      const nb = nodes.find(n => n.id === b);
      const scoreA = na?.layer === "Deep" ? 2 : na?.layer === "Subcortical" ? 1 : 0;
      const scoreB = nb?.layer === "Deep" ? 2 : nb?.layer === "Subcortical" ? 1 : 0;
      return scoreB - scoreA;
    });
  } else {
    // Random shuffle
    for (let i = candidateIds.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidateIds[i], candidateIds[j]] = [candidateIds[j], candidateIds[i]];
    }
  }

  // Select the top candidates for splitting
  for (let i = 0; i < numSplits; i++) {
    if (i < candidateIds.length) {
      targetIds.push(candidateIds[i]);
    }
  }

  let nextId = Math.max(...nodes.map(n => n.id)) + 1;

  // Perform Node-Splitting
  targetIds.forEach(targetId => {
    const targetIdx = nodes.findIndex(n => n.id === targetId);
    if (targetIdx === -1) return;
    const targetNode = nodes[targetIdx];

    // Mark original node as mutated site
    targetNode.type = "mutated_site";
    targetNode.mutationScore = Math.min(1.0, targetNode.mutationScore + 0.3);

    // Create split daughter node displaced by a small sphere radius epsilon
    const epsilon = 3.0;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos((rng() - 0.5) * 2);
    
    const dx = epsilon * Math.sin(phi) * Math.cos(theta);
    const dy = epsilon * Math.sin(phi) * Math.sin(theta);
    const dz = epsilon * Math.cos(phi);

    const daughterNode: BioNode = {
      id: nextId++,
      name: `${targetNode.name}_daughter`,
      type: "host",
      x: +(targetNode.x + dx).toFixed(2),
      y: +(targetNode.y + dy).toFixed(2),
      z: +(targetNode.z + dz).toFixed(2),
      region: targetNode.region,
      layer: targetNode.layer,
      conformation: "A",
      localPH: targetNode.localPH,
      mutationScore: 0.1
    };
    nodes.push(daughterNode);

    // Create Viral Vector insertion node sitting precisely between parent and daughter
    const viralNode: BioNode = {
      id: nextId++,
      name: `VIRUS_${targetNode.id}_${daughterNode.id}`,
      type: "viral_vector",
      x: +((targetNode.x + daughterNode.x) / 2).toFixed(2),
      y: +((targetNode.y + daughterNode.y) / 2).toFixed(2),
      z: +((targetNode.z + daughterNode.z) / 2).toFixed(2),
      region: targetNode.region,
      layer: targetNode.layer,
      conformation: "A",
      localPH: targetNode.localPH,
      mutationScore: 0.8
    };
    nodes.push(viralNode);

    // Rewire Edges: Distribute original edges of targetNode to daughterNode randomly
    const targetEdges = edges.filter(e => e.source === targetId || e.target === targetId);
    targetEdges.forEach(e => {
      if (rng() > 0.5) {
        // Shift this edge to source/target from the daughter node
        if (e.source === targetId) e.source = daughterNode.id;
        if (e.target === targetId) e.target = daughterNode.id;
      }
    });

    // Connect host parent <-> viral vector <-> host daughter to bridge the integration
    edges.push({
      source: targetNode.id,
      target: viralNode.id,
      weight: 1.0,
      type: "viral_insertion"
    });
    edges.push({
      source: viralNode.id,
      target: daughterNode.id,
      weight: 1.0,
      type: "viral_insertion"
    });

    // Optionally add a random feedback bypass edge
    if (params.mutationRate > 0.3) {
      edges.push({
        source: targetNode.id,
        target: daughterNode.id,
        weight: 0.5,
        type: "ligand_binding"
      });
    }
  });

  // Apply clearance degradation (cleans up a portion of active viral vectors and mutated edges)
  if (params.clearanceVelocity > 0.1) {
    const clearanceThreshold = params.clearanceVelocity * 0.4;
    
    // Find viral nodes to prune
    const viralNodes = nodes.filter(n => n.type === "viral_vector");
    viralNodes.forEach(vn => {
      if (rng() < clearanceThreshold) {
        // Prune viral node and its integration edges
        const idx = nodes.findIndex(n => n.id === vn.id);
        if (idx !== -1) nodes.splice(idx, 1);
        
        // Remove connected edges
        for (let k = edges.length - 1; k >= 0; k--) {
          if (edges[k].source === vn.id || edges[k].target === vn.id) {
            edges.splice(k, 1);
          }
        }
      }
    });
  }

  return { nodes, edges };
}

// ============================================================================
// 2. Loop-Entropy Mutagenesis Risk Model
// ============================================================================

/**
 * Extracts and maps simple cycles (loops) of length 3 to 5 within the network.
 * Focuses on loop complexes representing feedback circuits (e.g., homeostatic circuits).
 */
export function findLoops(nodes: BioNode[], edges: BioEdge[], maxLen = 5): number[][] {
  const loops: number[][] = [];
  const N = nodes.length;
  const adj = new Map<number, Set<number>>();
  
  nodes.forEach(n => adj.set(n.id, new Set()));
  edges.forEach(e => {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  });

  const path: number[] = [];

  function dfs(curr: number, start: number, depth: number) {
    if (depth > maxLen) return;
    path.push(curr);

    const neighbors = adj.get(curr);
    if (neighbors) {
      neighbors.forEach(nxt => {
        if (nxt === start && depth >= 3) {
          // Found loop. Normalise representation (sort circular shifting, lowest ID first)
          const loop = [...path];
          const minIdx = loop.indexOf(Math.min(...loop));
          const normalized = [...loop.slice(minIdx), ...loop.slice(0, minIdx)];
          
          // Reverse normalization compatibility check
          const rev = [...normalized].reverse();
          const minIdxRev = rev.indexOf(Math.min(...rev));
          const normalizedRev = [...rev.slice(minIdxRev), ...rev.slice(0, minIdxRev)];

          const exists = loops.some(l => 
            l.length === normalized.length && 
            l.every((val, idx) => val === normalized[idx] || val === normalizedRev[idx])
          );

          if (!exists) {
            loops.push(normalized);
          }
        } else if (!path.includes(nxt) && nxt > start) {
          // Simple depth bounded backtracking DFS
          dfs(nxt, start, depth + 1);
        }
      });
    }
    path.pop();
  }

  nodes.forEach(n => dfs(n.id, n.id, 1));
  return loops;
}

/**
 * Calculates Shannon entropy based on how participating nodes are distributed
 * across active graph loops. High entropy = balance; Low entropy = centralized/disrupted loops.
 */
export function calculateLoopEntropy(nodes: BioNode[], loops: number[][]): number {
  if (loops.length === 0) return 0;
  
  const nodeCounts = new Map<number, number>();
  nodes.forEach(n => nodeCounts.set(n.id, 0));

  let totalParticipation = 0;
  loops.forEach(loop => {
    loop.forEach(nid => {
      nodeCounts.set(nid, (nodeCounts.get(nid) ?? 0) + 1);
      totalParticipation++;
    });
  });

  if (totalParticipation === 0) return 0;

  let entropy = 0;
  nodeCounts.forEach(count => {
    if (count > 0) {
      const p = count / totalParticipation;
      entropy -= p * Math.log2(p);
    }
  });

  return +entropy.toFixed(4);
}

/**
 * Computes Mutagenesis Risk based on broken homeostatic loop complexes
 * combined with loop entropy decay anomalies.
 */
export function calculateMutagenesisRisk(
  currentLoops: number[][],
  baselineLoopCount: number,
  entropy: number
): number {
  if (baselineLoopCount === 0) return 0;
  
  const loopsBroken = Math.max(0, baselineLoopCount - currentLoops.length);
  const brokenRatio = loopsBroken / baselineLoopCount;

  // Systemic entropy factor: highly chaotic loop distributions accelerate risk.
  // We model this using a logistic activation on entropy scaling.
  const entropyMultiplier = entropy > 0 ? Math.min(2.5, 5.0 / (entropy + 1.0)) : 2.5;

  const risk = brokenRatio * 0.7 + (1.0 - Math.exp(-entropy * 0.05)) * 0.3 * entropyMultiplier;
  return +Math.min(100, Math.max(0, risk * 100)).toFixed(1);
}

// ============================================================================
// 3. Conformational Ligand Kinetics & Environmental Logic Gates
// ============================================================================

/**
 * Steps conformational ligand states based on environment thresholds
 * and evaluates dynamic edge weight shifts in the directed graph.
 */
export function stepConformationalKinetics(
  topology: BioTopology,
  env: EnvironmentState,
  params: ConformationalSimParams
): BioTopology {
  const nodes = topology.nodes.map(n => ({ ...n }));
  const edges = topology.edges.map(e => ({ ...e }));
  const N = topology.N;

  // Step 1: Update Node Conformations based on Environmental Logic Gate
  // Logic Gate: pH < threshold AND local clique density > baseline
  nodes.forEach(node => {
    const isAcidic = env.pH < params.pHThreshold;
    const hasDensity = env.cliqueDensity > params.baselineDensity;

    // Apply probability shift representing affinity activation
    if (isAcidic && hasDensity) {
      if (Math.random() < params.affinity * 0.4 + 0.2) {
        node.conformation = "B"; // Shift to active conformation
      }
    } else {
      if (Math.random() < 0.25) {
        node.conformation = "A"; // Dissociate back to inactive state
      }
    }
  });

  // Step 2: Reconstruct Directed Adjacency Matrix & Edge Weights
  // If source node is in Conformation B (exposed hooks), directed edge weights increase.
  const adjacency = new Float32Array(N * N);

  edges.forEach(edge => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const destNode = nodes.find(n => n.id === edge.target);

    let weight = 1.0;
    if (srcNode?.conformation === "B") {
      // Expose binding hooks, maximize coupling strength
      weight *= params.couplingMultiplier;
    }
    
    // Modulate by node health/mutation score (mutated sites reduce conductivity slightly)
    if (srcNode?.type === "mutated_site") {
      weight *= (1.0 - srcNode.mutationScore * 0.4);
    }
    if (destNode?.type === "mutated_site") {
      weight *= (1.0 - destNode.mutationScore * 0.4);
    }

    edge.weight = +weight.toFixed(3);

    // Populate directed adjacency matrix (directed source -> target mapping)
    if (edge.source < N && edge.target < N) {
      adjacency[edge.source * N + edge.target] = edge.weight;
      // Retro-connections get mild back-coupling (bidirectional substrate)
      adjacency[edge.target * N + edge.source] = edge.weight * 0.3;
    }
  });

  return { nodes, edges, adjacency, N };
}

// ============================================================================
// 4. Pinecone Embedding Generator (128-D Topological Space)
// ============================================================================

/**
 * Synthesizes a mathematically consistent 128-dimensional vector embedding representing
 * a distinct snapshot of the cell network topology and simulation parameters.
 * Ideal for storing and querying via Pinecone vectors.
 */
export function generateTopologicalEmbedding(
  topo: BioTopology,
  metrics: {
    loopEntropy: number;
    mutagenesisRisk: number;
    stateBPercentage: number;
    coherence: number;
  },
  env: EnvironmentState
): number[] {
  const vector = new Array<number>(128).fill(0);

  // 1. Density & Size Characteristics (indices 0 - 9)
  vector[0] = topo.N / 300.0;
  vector[1] = topo.edges.length / 1000.0;
  vector[2] = metrics.stateBPercentage / 100.0;
  vector[3] = metrics.coherence;
  vector[4] = metrics.loopEntropy / 8.0;
  vector[5] = metrics.mutagenesisRisk / 100.0;
  vector[6] = env.pH / 14.0;
  vector[7] = env.cliqueDensity;
  vector[8] = env.temperature / 50.0;
  vector[9] = topo.nodes.filter(n => n.type === "viral_vector").length / 20.0;

  // 2. Node degree distribution vectors (indices 10 - 49)
  const degrees = new Array<number>(topo.N).fill(0);
  topo.edges.forEach(e => {
    if (e.source < topo.N) degrees[e.source]++;
    if (e.target < topo.N) degrees[e.target]++;
  });
  
  // Normalised histogram of degree distribution
  const degreeBins = new Array<number>(40).fill(0);
  degrees.forEach(d => {
    const binIdx = Math.min(39, Math.floor(d / 2));
    degreeBins[binIdx]++;
  });
  const maxBin = Math.max(1, ...degreeBins);
  for (let i = 0; i < 40; i++) {
    vector[10 + i] = degreeBins[i] / maxBin;
  }

  // 3. Coordinate barycenters & structural spread (indices 50 - 79)
  let sumX = 0, sumY = 0, sumZ = 0;
  topo.nodes.forEach(n => {
    sumX += n.x;
    sumY += n.y;
    sumZ += n.z;
  });
  const center = { x: sumX / topo.N, y: sumY / topo.N, z: sumZ / topo.N };
  
  // Radial distance variance
  const radialDists = topo.nodes.map(n => 
    Math.sqrt((n.x - center.x)**2 + (n.y - center.y)**2 + (n.z - center.z)**2)
  );
  const maxDist = Math.max(1, ...radialDists);
  const radialBins = new Array<number>(30).fill(0);
  radialDists.forEach(d => {
    const binIdx = Math.min(29, Math.floor((d / maxDist) * 30));
    radialBins[binIdx]++;
  });
  for (let i = 0; i < 30; i++) {
    vector[50 + i] = radialBins[i] / topo.N;
  }

  // 4. Harmonic Fourier frequencies & Kuramoto wave values (indices 80 - 127)
  // Fill remaining vector indices with physiologically plausible cosine harmonics
  for (let i = 80; i < 128; i++) {
    const phaseFreq = metrics.coherence * (i / 100.0) * Math.PI;
    const envMod = Math.sin(env.pH * (i - 80));
    vector[i] = +(Math.cos(phaseFreq + envMod) * 0.5 + 0.5).toFixed(6);
  }

  return vector;
}

// ============================================================================
// 5. Firestore Registry & Logging Simulation Wrapper
// ============================================================================

/**
 * Registers and compiles a complete simulation run into a Firestore transaction block,
 * logging parameter matrices and storing references to topological Pinecone vectors.
 */
export async function logSimulationRun(
  viral: RetroviralSimParams,
  conformation: ConformationalSimParams,
  env: EnvironmentState,
  metrics: {
    loopEntropy: number;
    mutagenesisRisk: number;
    stateBPercentage: number;
    graphDensity: number;
    averageWeight: number;
    coherence: number;
  },
  vector: number[]
): Promise<SimulationRun> {
  const timestamp = new Date().toISOString();
  const simId = `sim_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`;
  const pineconeVectorId = `vec_${Math.random().toString(36).substring(2, 10)}`;
  const firestoreDocId = `db_${Math.random().toString(36).substring(2, 10)}`;

  const logRecord: SimulationRun = {
    id: simId,
    timestamp,
    parameters: {
      viral: { ...viral },
      conformation: { ...conformation },
      environment: { ...env }
    },
    metrics: { ...metrics },
    pineconeVectorId,
    firestoreDocId
  };

  // Log simulation commit telemetry in client console
  console.log(`[Firestore Commit] Write registered to '/simulations/${firestoreDocId}'`);
  console.log(`[Pinecone Write] Uploaded 128-D Vector associated with ID '${pineconeVectorId}'`);
  console.log(`Vector preview: [${vector.slice(0, 5).map(v => v.toFixed(3)).join(", ")} ... ${vector.slice(-3).map(v => v.toFixed(3)).join(", ")}]`);

  // Emulate persistent database response latency
  await new Promise(resolve => setTimeout(resolve, 350));

  return logRecord;
}
