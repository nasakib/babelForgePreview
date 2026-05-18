// ----------------------------------------------------------------------------
// Topology Engine
// ----------------------------------------------------------------------------
// Generates a Schaefer-style cortical parcellation as nodes inside an
// ellipsoidal cortical envelope, assigns each node to a functional network
// (Default Mode, Frontoparietal Control, Limbic, Visual, Somatomotor, Ventral
// Attention) by anatomical convention, and builds a structural adjacency
// matrix from k-nearest-neighbor proximity plus high-dimensional cliques.
//
// Pathological State Modifiers compose by *additively* mutating the adjacency
// matrix (removing edges from collapsed cliques, adding edges from
// pathological hyperconnectivity). See Reimann et al. (2017) for the
// algebraic-topology framing and Tewarie et al. (2019) for the use of
// clique complexes as substrates for fMRI functional connectivity.
// ----------------------------------------------------------------------------

import { mulberry32 } from "./rng";

export type Region =
  | "Default"
  | "Control"
  | "Limbic"
  | "Visual"
  | "SomatoMotor"
  | "VentAttn";

export interface ForgeNode {
  id: number;
  hemi: "LH" | "RH";
  region: Region;
  x: number;
  y: number;
  z: number;
  hubness: number;
  cliques: number;
  omega: number; // intrinsic Kuramoto frequency (rad/s)
}

export interface Clique {
  nodes: number[];
  dimension: number;
}

export interface Topology {
  nodes: ForgeNode[];
  edges: [number, number][];
  cliques: Clique[];
  /** N×N symmetric adjacency, 0/1. */
  adjacency: Uint8Array;
  N: number;
}

export const REGION_COLOR: Record<Region, string> = {
  Default: "#6366f1", // indigo
  Control: "#06b6d4", // cyan
  Limbic: "#f59e0b", // amber
  Visual: "#a855f7", // violet
  SomatoMotor: "#10b981", // emerald
  VentAttn: "#ec4899", // rose
};

export const PATHOLOGIES = [
  "DEPRESSION",
  "PTSD",
  "ADHD",
  "TOURETTES",
  "WITHDRAWAL_OPIOID",
] as const;
export type Pathology = (typeof PATHOLOGIES)[number];

export const PATHOLOGY_META: Record<
  Pathology,
  { label: string; region: Region; tone: string; subjective: string }
> = {
  DEPRESSION: {
    label: "Major Depressive Disorder",
    region: "Default",
    tone: "DMN Hyper-stability",
    subjective:
      "Profound 'Grey' loss of emotional contrast; rumination loops; reward circuit blunting.",
  },
  PTSD: {
    label: "Post-Traumatic Stress Disorder",
    region: "Limbic",
    tone: "Limbic Hyperarousal",
    subjective:
      "'Time collapse', intrusive somatic recall, hypervigilance, autonomic instability.",
  },
  ADHD: {
    label: "Attention-Deficit / Hyperactivity",
    region: "Control",
    tone: "Frontoparietal Hypo-connectivity",
    subjective:
      "Effortful focus 'wading through static'; rapid task-set switching; latent boredom intolerance.",
  },
  TOURETTES: {
    label: "Tourette Syndrome",
    region: "SomatoMotor",
    tone: "Motor Loop Rigidity",
    subjective:
      "Premonitory urge; pressure requiring motor discharge; tic-rebound after suppression.",
  },
  WITHDRAWAL_OPIOID: {
    label: "Opioid Withdrawal",
    region: "Limbic",
    tone: "Reward Circuit Debt",
    subjective:
      "Anhedonia, autonomic storm, dysphoria, locus coeruleus hyperactivity.",
  },
};

// ----------------------------------------------------------------------------
// Baseline generation (deterministic, seed = 4242)
// ----------------------------------------------------------------------------
const SEED = 4242;
const N_NODES = 200; // Schaefer 200 atlas count
const ELLIPSOID = { a: 48, b: 38, c: 58 };

function classifyRegion(x: number, y: number, z: number): Region {
  if (z < -25) return "Visual";
  if (y > 18 && z >= -25 && z <= 20) return "SomatoMotor";
  if (z > 25 && y > 5) return "Control";
  if (z > 25 && y <= 5) return "Limbic";
  if (y < -5 && z >= -25 && z <= 20) return "VentAttn";
  return "Default";
}

let _baselineCache: Topology | null = null;

export function getBaselineTopology(): Topology {
  if (_baselineCache) return _baselineCache;
  const rng = mulberry32(SEED);
  const { a, b, c } = ELLIPSOID;
  const nodes: ForgeNode[] = [];

  for (let i = 0; i < N_NODES; i++) {
    let x = 0,
      y = 0,
      z = 0;
    // Rejection sample inside ellipsoid, excluding midline (interhemispheric)
    for (let tries = 0; tries < 200; tries++) {
      x = (rng() - 0.5) * 2 * a;
      y = (rng() - 0.5) * 2 * b;
      z = (rng() - 0.5) * 2 * c;
      if ((x / a) ** 2 + (y / b) ** 2 + (z / c) ** 2 <= 1 && Math.abs(x) > 4)
        break;
    }
    nodes.push({
      id: i,
      hemi: x > 0 ? "RH" : "LH",
      region: classifyRegion(x, y, z),
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      z: +z.toFixed(2),
      hubness: 0,
      cliques: 0,
      // Intrinsic Kuramoto frequency ~ N(0, 0.4) rad/s — narrow band typical
      // of resting-state alpha/theta in normalized neurolib simulations.
      omega: gaussian01(rng) * 0.4,
    });
  }

  // KNN structural backbone
  const edgeSet = new Set<number>();
  const K = 3;
  for (let i = 0; i < N_NODES; i++) {
    const dists = nodes
      .map((n, j) => ({
        j,
        d:
          (n.x - nodes[i].x) ** 2 +
          (n.y - nodes[i].y) ** 2 +
          (n.z - nodes[i].z) ** 2,
      }))
      .filter((e) => e.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, K);
    for (const { j } of dists) edgeSet.add(packEdge(i, j));
  }

  // High-dimensional functional cliques (Blue Brain: structures up to 11D)
  const cliques: Clique[] = [];
  for (let k = 0; k < 60; k++) {
    const dim = 2 + Math.floor(rng() * 10); // 2..11
    const size = dim + 1;
    const center = nodes[Math.floor(rng() * N_NODES)];
    const ranked = nodes
      .map((n, j) => ({
        j,
        d:
          (n.x - center.x) ** 2 +
          (n.y - center.y) ** 2 +
          (n.z - center.z) ** 2,
      }))
      .sort((p, q) => p.d - q.d)
      .slice(0, size);
    const cn = ranked.map((r) => r.j).sort((p, q) => p - q);
    cliques.push({ nodes: cn, dimension: dim });
    for (const nid of cn) {
      nodes[nid].cliques += 1;
      nodes[nid].hubness += size / 10.0;
    }
    for (let i = 0; i < cn.length; i++)
      for (let j = i + 1; j < cn.length; j++) edgeSet.add(packEdge(cn[i], cn[j]));
  }

  const adjacency = new Uint8Array(N_NODES * N_NODES);
  const edges: [number, number][] = [];
  edgeSet.forEach((p) => {
    const [u, v] = unpackEdge(p);
    edges.push([u, v]);
    adjacency[u * N_NODES + v] = 1;
    adjacency[v * N_NODES + u] = 1;
  });

  _baselineCache = { nodes, edges, cliques, adjacency, N: N_NODES };
  return _baselineCache;
}

// ----------------------------------------------------------------------------
// Pathology Modifier — composes additively on top of baseline
// ----------------------------------------------------------------------------
export interface ModifierSpec {
  removeCliques: number;
  addCliques: number;
  maxAddedDim: number;
  biasRegion: Region;
}

export const MODIFIERS: Record<Pathology, ModifierSpec> = {
  DEPRESSION: {
    removeCliques: 18,
    addCliques: 22,
    maxAddedDim: 6,
    biasRegion: "Default",
  },
  PTSD: {
    removeCliques: 30,
    addCliques: 10,
    maxAddedDim: 4,
    biasRegion: "Limbic",
  },
  ADHD: {
    removeCliques: 22,
    addCliques: 4,
    maxAddedDim: 5,
    biasRegion: "Control",
  },
  TOURETTES: {
    removeCliques: 8,
    addCliques: 24,
    maxAddedDim: 9,
    biasRegion: "SomatoMotor",
  },
  WITHDRAWAL_OPIOID: {
    removeCliques: 28,
    addCliques: 8,
    maxAddedDim: 5,
    biasRegion: "Limbic",
  },
};

export interface ComposedTopology extends Topology {
  /** Per-region density anomaly relative to healthy baseline, in [-1, 1]. */
  regionDelta: Record<Region, number>;
  /** Total edges added / removed by modifier composition. */
  edgeStats: { added: number; removed: number; total: number };
}

export function composeTopology(states: Pathology[]): ComposedTopology {
  const base = getBaselineTopology();
  // Deep-clone adjacency only (cheap O(N²)).
  const adjacency = new Uint8Array(base.adjacency);
  const nodes = base.nodes.map((n) => ({ ...n, hubness: n.hubness, cliques: n.cliques }));
  const cliques: Clique[] = base.cliques.map((c) => ({ ...c, nodes: c.nodes.slice() }));

  const rng = mulberry32(SEED + sumHash(states));
  const N = base.N;
  let edgesAdded = 0,
    edgesRemoved = 0;

  const baselineDensity: Record<Region, number> = {
    Default: 0,
    Control: 0,
    Limbic: 0,
    Visual: 0,
    SomatoMotor: 0,
    VentAttn: 0,
  };
  const liveDensity = { ...baselineDensity };

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (base.adjacency[i * N + j]) baselineDensity[nodes[i].region] += 1;
    }
  }

  for (const state of states) {
    const spec = MODIFIERS[state];
    // 1. Remove biased cliques (collapse)
    const biased = cliques
      .map((c, idx) => ({ idx, score: c.nodes.filter((nid) => nodes[nid].region === spec.biasRegion).length }))
      .filter((e) => e.score > 0)
      .sort((p, q) => q.score - p.score)
      .slice(0, spec.removeCliques);
    for (const { idx } of biased) {
      const cn = cliques[idx].nodes;
      for (let i = 0; i < cn.length; i++)
        for (let j = i + 1; j < cn.length; j++) {
          const a = cn[i],
            b = cn[j];
          if (adjacency[a * N + b]) {
            adjacency[a * N + b] = 0;
            adjacency[b * N + a] = 0;
            edgesRemoved += 1;
          }
        }
    }
    // 2. Add pathological hyperconnectivity
    for (let k = 0; k < spec.addCliques; k++) {
      const dim = 2 + Math.floor(rng() * (spec.maxAddedDim - 1));
      const size = dim + 1;
      const pool = nodes.filter((n) => n.region === spec.biasRegion);
      if (pool.length < size) continue;
      const picks = new Set<number>();
      while (picks.size < size) picks.add(pool[Math.floor(rng() * pool.length)].id);
      const cn = Array.from(picks).sort((p, q) => p - q);
      cliques.push({ nodes: cn, dimension: dim });
      for (let i = 0; i < cn.length; i++)
        for (let j = i + 1; j < cn.length; j++) {
          const a = cn[i],
            b = cn[j];
          if (!adjacency[a * N + b]) {
            adjacency[a * N + b] = 1;
            adjacency[b * N + a] = 1;
            edgesAdded += 1;
          }
        }
    }
  }

  // Recompute final density per region.
  let total = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (adjacency[i * N + j]) {
        total += 1;
        liveDensity[nodes[i].region] += 1;
      }
    }
  }

  const regionDelta: Record<Region, number> = { ...baselineDensity };
  (Object.keys(baselineDensity) as Region[]).forEach((r) => {
    const b = baselineDensity[r] || 1;
    regionDelta[r] = +((liveDensity[r] - b) / b).toFixed(3);
  });

  // Rebuild edge list lazily on demand (the canvas typically only needs N≤300
  // edges; building the full N² list is fine here).
  const edges: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (adjacency[i * N + j]) edges.push([i, j]);
    }
  }

  return {
    N,
    nodes,
    edges,
    cliques,
    adjacency,
    regionDelta,
    edgeStats: { added: edgesAdded, removed: edgesRemoved, total },
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function gaussian01(rng: () => number): number {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function packEdge(i: number, j: number): number {
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return a * 1024 + b;
}
function unpackEdge(p: number): [number, number] {
  return [Math.floor(p / 1024), p % 1024];
}
function sumHash(states: string[]): number {
  let h = 0;
  for (const s of states) for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
