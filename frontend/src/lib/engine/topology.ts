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
import { type PharmaVectors } from "./stackVectors";

export type Region =
  | "Default"
  | "Control"
  | "Limbic"
  | "Visual"
  | "SomatoMotor"
  | "VentAttn";

export type BrainLayer = "Cortical" | "Subcortical" | "Deep";

export interface ForgeNode {
  id: number;
  hemi: "LH" | "RH";
  region: Region;
  layer: BrainLayer;
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

// Yeo brain network palette — sourced from the color engine so swatches
// match Tailwind's `bg-region-*` classes and CSS vars exposed by
// lib/theme/cssVars.ts. Re-tune in lib/theme/palette.ts.
import { palette as themePalette } from "../theme/palette";

export const REGION_COLOR: Record<Region, string> = themePalette.regions;

export const PATHOLOGIES = [
  "DEPRESSION",
  "PTSD",
  "ADHD",
  "TOURETTES",
  "WITHDRAWAL_OPIOID",
  "SCHIZOPHRENIA",
  "BIPOLAR",
  "OCD",
  "GAD",
  "AUTISM",
  "ADDICTION",
  "CRPS"
] as const;
export type Pathology = (typeof PATHOLOGIES)[number];

export interface PathologyMeta {
  label: string;
  region: Region;
  tone: string;
  subjective: string;
  dsm5Code: string;
  dsm5Criteria: string[];
}

export const PATHOLOGY_META: Record<Pathology, PathologyMeta> = {
  DEPRESSION: {
    label: "Major Depressive Disorder",
    region: "Default",
    tone: "DMN Hyper-stability",
    subjective:
      "Profound 'Grey' loss of emotional contrast; rumination loops; reward circuit blunting.",
    dsm5Code: "F32.9",
    dsm5Criteria: [
      "Depressed mood most of the day, nearly every day",
      "Markedly diminished interest or pleasure in all, or almost all, activities",
      "Significant weight loss or gain, or decrease or increase in appetite",
      "Insomnia or hypersomnia nearly every day",
      "Psychomotor agitation or retardation nearly every day",
      "Fatigue or loss of energy nearly every day",
      "Feelings of worthlessness or excessive or inappropriate guilt",
      "Diminished ability to think or concentrate, or indecisiveness",
      "Recurrent thoughts of death, recurrent suicidal ideation"
    ]
  },
  PTSD: {
    label: "Post-Traumatic Stress Disorder",
    region: "Limbic",
    tone: "Limbic Hyperarousal",
    subjective:
      "'Time collapse', intrusive somatic recall, hypervigilance, autonomic instability.",
    dsm5Code: "F43.10",
    dsm5Criteria: [
      "Exposure to actual or threatened death, serious injury, or sexual violence",
      "Presence of intrusion symptoms (e.g., distressing memories, nightmares, flashbacks)",
      "Persistent avoidance of stimuli associated with the traumatic event",
      "Negative alterations in cognitions and mood associated with the traumatic event",
      "Marked alterations in arousal and reactivity associated with the traumatic event",
      "Duration of the disturbance is more than 1 month"
    ]
  },
  ADHD: {
    label: "Attention-Deficit / Hyperactivity",
    region: "Control",
    tone: "Frontoparietal Hypo-connectivity",
    subjective:
      "Effortful focus 'wading through static'; rapid task-set switching; latent boredom intolerance.",
    dsm5Code: "F90.2",
    dsm5Criteria: [
      "Persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning",
      "Inattention: 6 or more symptoms (e.g., fails to give close attention, difficulty sustaining attention, easily distracted)",
      "Hyperactivity/Impulsivity: 6 or more symptoms (e.g., fidgets, unable to remain seated, talks excessively, interrupts)",
      "Several symptoms present prior to age 12 years",
      "Several symptoms present in two or more settings"
    ]
  },
  TOURETTES: {
    label: "Tourette Syndrome",
    region: "SomatoMotor",
    tone: "Motor Loop Rigidity",
    subjective:
      "Premonitory urge; pressure requiring motor discharge; tic-rebound after suppression.",
    dsm5Code: "F95.2",
    dsm5Criteria: [
      "Both multiple motor and one or more vocal tics have been present at some time during the illness",
      "Tics may wax and wane in frequency but have persisted for more than 1 year",
      "Onset is before age 18 years",
      "The disturbance is not attributable to the physiological effects of a substance or another medical condition"
    ]
  },
  WITHDRAWAL_OPIOID: {
    label: "Opioid Withdrawal",
    region: "Limbic",
    tone: "Reward Circuit Debt",
    subjective:
      "Anhedonia, autonomic storm, dysphoria, locus coeruleus hyperactivity.",
    dsm5Code: "F11.23",
    dsm5Criteria: [
      "Presence of either cessation/reduction in opioid use, or administration of an opioid antagonist",
      "Three or more symptoms developing within minutes to several days (e.g., dysphoric mood, nausea/vomiting, muscle aches)",
      "Lacrimation or rhinorrhea, pupillary dilation, piloerection, or sweating",
      "Diarrhea, yawning, fever, insomnia",
      "Symptoms cause clinically significant distress or impairment"
    ]
  },
  SCHIZOPHRENIA: {
    label: "Schizophrenia",
    region: "Control",
    tone: "Global Dysconnectivity",
    subjective:
      "Disorganized thought vectors, reality fracturing, salient misattribution.",
    dsm5Code: "F20.9",
    dsm5Criteria: [
      "Two or more active-phase symptoms present for a significant portion of time during a 1-month period",
      "At least one symptom must be delusions, hallucinations, or disorganized speech",
      "Other symptoms include grossly disorganized or catatonic behavior, and negative symptoms (e.g., diminished emotional expression)",
      "Level of functioning in one or more major areas is markedly below the level achieved prior to onset",
      "Continuous signs of the disturbance persist for at least 6 months"
    ]
  },
  BIPOLAR: {
    label: "Bipolar Disorder (Type I/II)",
    region: "Limbic",
    tone: "Cyclic Phase-Locking",
    subjective:
      "Rapid cycling between expansive hyperarousal (mania) and profound DMN collapse (depression).",
    dsm5Code: "F31.9",
    dsm5Criteria: [
      "Met criteria for at least one manic episode",
      "Manic episode: abnormally and persistently elevated, expansive, or irritable mood and increased activity/energy lasting at least 1 week",
      "Three or more symptoms present (e.g., inflated self-esteem, decreased need for sleep, flight of ideas, distractibility)",
      "The manic episode causes severe impairment or requires hospitalization"
    ]
  },
  OCD: {
    label: "Obsessive-Compulsive Disorder",
    region: "SomatoMotor",
    tone: "CSTC Loop Hyperactivity",
    subjective:
      "Intrusive persistent thoughts triggering ritualistic motor discharge to relieve tension.",
    dsm5Code: "F42.2",
    dsm5Criteria: [
      "Presence of obsessions, compulsions, or both",
      "Obsessions: recurrent and persistent thoughts, urges, or images that are intrusive and unwanted, causing anxiety or distress",
      "Compulsions: repetitive behaviors or mental acts that the individual feels driven to perform in response to an obsession",
      "The obsessions or compulsions are time-consuming (take more than 1 hour per day) or cause significant distress"
    ]
  },
  GAD: {
    label: "Generalized Anxiety Disorder",
    region: "VentAttn",
    tone: "Ventral Attention Hyper-vigilance",
    subjective:
      "Constant hum of threat detection, inability to downregulate autonomic arousal.",
    dsm5Code: "F41.1",
    dsm5Criteria: [
      "Excessive anxiety and worry, occurring more days than not for at least 6 months, about a number of events or activities",
      "The individual finds it difficult to control the worry",
      "The anxiety and worry are associated with three or more of six symptoms (e.g., restlessness, easily fatigued, muscle tension)",
      "The anxiety, worry, or physical symptoms cause clinically significant distress or impairment"
    ]
  },
  AUTISM: {
    label: "Autism Spectrum",
    region: "Visual",
    tone: "Local Hyperconnectivity",
    subjective:
      "Intense local sensory processing at the cost of global integration, high bottom-up data density.",
    dsm5Code: "F84.0",
    dsm5Criteria: [
      "Persistent deficits in social communication and social interaction across multiple contexts",
      "Deficits in social-emotional reciprocity, nonverbal communicative behaviors, and developing/maintaining relationships",
      "Restricted, repetitive patterns of behavior, interests, or activities (at least two symptoms)",
      "Symptoms must be present in the early developmental period",
      "Symptoms cause clinically significant impairment in social, occupational, or other important areas"
    ]
  },
  ADDICTION: {
    label: "Substance Use Disorder",
    region: "Limbic",
    tone: "Dopaminergic Hijacking",
    subjective:
      "Salience network strictly locked to substance-seeking, massive attenuation of baseline rewards.",
    dsm5Code: "F19.20",
    dsm5Criteria: [
      "A problematic pattern of substance use leading to clinically significant impairment or distress, manifested by at least two symptoms within a 12-month period",
      "Substance is often taken in larger amounts or over a longer period than intended",
      "Persistent desire or unsuccessful efforts to cut down or control use",
      "Great deal of time spent in activities necessary to obtain, use, or recover from substance",
      "Craving, or a strong desire or urge to use",
      "Tolerance and/or withdrawal symptoms"
    ]
  },
  CRPS: {
    label: "Complex Regional Pain (CRPS)",
    region: "SomatoMotor",
    tone: "S1 Somatotopy Blurring & Autonomic Dysregulation",
    subjective:
      "Severe mechanical allodynia, spatial blurring, localized vasoconstrictive/warm autonomic storms.",
    dsm5Code: "G90.50",
    dsm5Criteria: [
      "Continuing pain, which is disproportionate to any inciting event",
      "Must report at least one symptom in three of four categories: sensory, vasomotor, sudomotor/edema, motor/trophic",
      "Must display at least one sign at time of evaluation in two or more of those categories",
      "No other diagnosis can better explain the signs and symptoms"
    ]
  }
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
    
    // Assign Brain Layer based on relative distance from core
    const dist = Math.sqrt(x*x + y*y + z*z);
    let layer: BrainLayer = "Cortical";
    if (dist < 22) layer = "Deep";
    else if (dist < 35) layer = "Subcortical";

    nodes.push({
      id: i,
      hemi: x > 0 ? "RH" : "LH",
      region: classifyRegion(x, y, z),
      layer,
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
  SCHIZOPHRENIA: {
    removeCliques: 25,
    addCliques: 5,
    maxAddedDim: 4,
    biasRegion: "Control",
  },
  BIPOLAR: {
    removeCliques: 15,
    addCliques: 20,
    maxAddedDim: 7,
    biasRegion: "Limbic",
  },
  OCD: {
    removeCliques: 5,
    addCliques: 30,
    maxAddedDim: 10,
    biasRegion: "SomatoMotor",
  },
  GAD: {
    removeCliques: 10,
    addCliques: 15,
    maxAddedDim: 6,
    biasRegion: "VentAttn",
  },
  AUTISM: {
    removeCliques: 20,
    addCliques: 25,
    maxAddedDim: 8,
    biasRegion: "Visual",
  },
  ADDICTION: {
    removeCliques: 15,
    addCliques: 15,
    maxAddedDim: 6,
    biasRegion: "Limbic",
  },
  CRPS: {
    removeCliques: 10,
    addCliques: 25,
    maxAddedDim: 8,
    biasRegion: "SomatoMotor",
  }
};

export interface ComposedTopology extends Topology {
  /** Per-region density anomaly relative to healthy baseline, in [-1, 1]. */
  regionDelta: Record<Region, number>;
  /** Total edges added / removed by modifier composition. */
  edgeStats: { added: number; removed: number; total: number };
}

function getEdgeRandom(u: number, v: number): number {
  const a = Math.min(u, v);
  const b = Math.max(u, v);
  let seed = (a * 73856093) ^ (b * 19349663);
  seed = Math.imul(seed ^ (seed >>> 15), 1 - seed);
  seed = seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
  return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
}

export function composeTopology(
  states: Pathology[],
  targetedOperations: { nodeId: number, type: string }[] = [],
  simulationTimeMonths: number = 0,
  vectors: PharmaVectors = { arousal: 0, dampening: 0, chaos: 0, repair: 0 }
): ComposedTopology {
  const base = getBaselineTopology();
  // Deep-clone adjacency only (cheap O(N²)).
  const adjacency = new Uint8Array(base.adjacency);
  const nodes = base.nodes.map((n) => ({ ...n, hubness: n.hubness, cliques: n.cliques, omega: n.omega }));
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

  // 3. Apply Targeted Operations (Micro-level)
  for (const op of targetedOperations) {
    if (op.nodeId >= 0 && op.nodeId < N) {
      if (op.type === 'ablate') {
        // Sever all edges to this node
        for (let i = 0; i < N; i++) {
          if (adjacency[op.nodeId * N + i]) {
             adjacency[op.nodeId * N + i] = 0;
             adjacency[i * N + op.nodeId] = 0;
             edgesRemoved++;
          }
        }
        nodes[op.nodeId].omega = 0.01; // Effectively silenced
      } else if (op.type === 'stimulate') {
        nodes[op.nodeId].omega *= 2.0; // Boost intrinsic frequency
      } else if (op.type === 'inhibit') {
        nodes[op.nodeId].omega *= 0.5; // Dampen intrinsic frequency
      }
    }
  }

  // 4. Apply Temporal Connectome Decay & Intrinsic Frequency Drift
  const activePathologiesForRegion: Record<Region, number> = {
    Default: 0,
    Control: 0,
    Limbic: 0,
    Visual: 0,
    SomatoMotor: 0,
    VentAttn: 0,
  };
  for (const state of states) {
    const spec = MODIFIERS[state];
    if (spec && spec.biasRegion) {
      activePathologiesForRegion[spec.biasRegion]++;
    }
  }

  const regionPruneFraction: Record<Region, number> = {
    Default: 0,
    Control: 0,
    Limbic: 0,
    Visual: 0,
    SomatoMotor: 0,
    VentAttn: 0,
  };

  const basePruneRate = 0.005; // 0.5% per month of active pathology exposure
  const normalAgingRate = 0.0005; // 0.05% per month normal decay

  (Object.keys(regionPruneFraction) as Region[]).forEach((r) => {
    const count = activePathologiesForRegion[r];
    const chaosFactor = 1.0 + Math.max(0, vectors.chaos) * 0.5;
    const repairFactor = Math.max(0, 1.0 - Math.min(1.0, vectors.repair));
    const pathologyDecayRate = basePruneRate * count * chaosFactor * repairFactor;
    const decayRate = normalAgingRate + pathologyDecayRate;
    regionPruneFraction[r] = Math.min(0.6, decayRate * simulationTimeMonths);
  });

  if (simulationTimeMonths > 0) {
    // Edge Pruning
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (adjacency[i * N + j]) {
          const edgePruneFraction = (regionPruneFraction[nodes[i].region] + regionPruneFraction[nodes[j].region]) / 2;
          const rVal = getEdgeRandom(i, j);
          if (rVal < edgePruneFraction) {
            adjacency[i * N + j] = 0;
            adjacency[j * N + i] = 0;
            edgesRemoved++;
          }
        }
      }
    }

    // Node Intrinsic Frequency Drift
    for (let i = 0; i < N; i++) {
      const count = activePathologiesForRegion[nodes[i].region];
      if (count > 0) {
        const driftChaosFactor = 1.0 + Math.max(0, vectors.chaos) * 0.5;
        const driftRepairFactor = Math.max(0, 1.0 - Math.min(1.0, vectors.repair));
        const effectiveDriftRate = -0.005 * count * driftChaosFactor * driftRepairFactor;
        const frequencyMultiplier = Math.max(0.1, 1.0 + effectiveDriftRate * simulationTimeMonths);
        nodes[i].omega *= frequencyMultiplier;
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
