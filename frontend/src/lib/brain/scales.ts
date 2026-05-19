/**
 * babelForge — multiscale ladder of the nervous system.
 *
 * The brain is studied across ~12 orders of magnitude in space and ~15 in
 * time. Any honest "dissection" has to declare which scale each claim is
 * made at, because methods, observables, and even the laws that dominate
 * change with scale. This module catalogs the canonical ladder; the
 * dissection engine attaches per-region observations to the appropriate
 * rung.
 *
 * Scale conventions follow:
 *   - Sejnowski et al., Nat Neurosci 2014. doi:10.1038/nn.3839
 *   - Churchland & Sejnowski, *The Computational Brain*, 2nd ed.
 *   - Buzsáki, *Rhythms of the Brain*, 2006.
 *   - Bassett & Sporns, Nat Neurosci 2017 (network neuroscience).
 *     doi:10.1038/nn.4502
 */

export type ScaleId =
  | "subatomic"
  | "atomic"
  | "molecular"
  | "macromolecular"
  | "synaptic"
  | "cellular"
  | "microcircuit"
  | "column"
  | "areal"
  | "network"
  | "whole-brain"
  | "behavioral";

export interface ScaleRung {
  id: ScaleId;
  name: string;
  /** Characteristic spatial extent, metres (low, high). */
  space: [number, number];
  /** Characteristic temporal extent, seconds (low, high). */
  time: [number, number];
  /** Dominant physics / mathematics. */
  laws: string[];
  /** Canonical observables you measure at this scale. */
  observables: string[];
  /** Experimental / computational tools relevant at this scale. */
  methods: string[];
  /** Which babelForge engine primarily operates here. */
  engine: "physics" | "neuron" | "chemistry" | "clinical" | "wisdom" | "multiple";
}

/**
 * The 12-rung ladder. Boundaries are conventional, not hard. The user
 * request for "quantum" accuracy is honoured at the subatomic/atomic
 * rungs with proper caveats — Schrödinger-equation-level descriptions
 * dominate ion-channel permeation and neurotransmitter binding, while
 * Orch-OR-style proposals remain speculative and are flagged as such in
 * `quantum.ts`.
 */
export const SCALE_LADDER: ScaleRung[] = [
  {
    id: "subatomic",
    name: "Subatomic / quantum",
    space: [1e-15, 1e-12],
    time: [1e-18, 1e-12],
    laws: [
      "Schrödinger / Dirac equation",
      "Quantum tunnelling (kinetic isotope effects in MAO, COMT)",
      "Hydrogen-bond rearrangement",
    ],
    observables: [
      "Electron density",
      "Bond polarisation",
      "Tunnelling rates",
    ],
    methods: [
      "Density functional theory (DFT)",
      "QM/MM hybrid simulations",
      "Cryo-EM at near-atomic resolution",
    ],
    engine: "chemistry",
  },
  {
    id: "atomic",
    name: "Atomic",
    space: [1e-12, 1e-10],
    time: [1e-15, 1e-9],
    laws: [
      "Classical molecular mechanics force fields",
      "Born–Oppenheimer approximation",
      "Poisson–Boltzmann electrostatics",
    ],
    observables: [
      "Ion radius / hydration shell",
      "Channel pore residue conformations",
    ],
    methods: [
      "Molecular dynamics (NAMD, GROMACS)",
      "X-ray crystallography",
    ],
    engine: "chemistry",
  },
  {
    id: "molecular",
    name: "Molecular",
    space: [1e-10, 1e-8],
    time: [1e-12, 1e-3],
    laws: [
      "Mass-action kinetics",
      "Hill / Michaelis–Menten",
      "Markov-state ion-channel gating",
    ],
    observables: [
      "Receptor occupancy",
      "Channel open probability",
      "Neurotransmitter release probability",
    ],
    methods: [
      "Patch clamp",
      "FRET / single-molecule",
      "Radioligand binding",
    ],
    engine: "chemistry",
  },
  {
    id: "macromolecular",
    name: "Macromolecular assembly",
    space: [1e-8, 5e-8],
    time: [1e-6, 1e-1],
    laws: [
      "Allosteric coupling",
      "Cooperative binding",
    ],
    observables: [
      "Postsynaptic density composition",
      "Active-zone organisation",
    ],
    methods: [
      "Super-resolution (STORM, PALM)",
      "Cryo-electron tomography",
    ],
    engine: "chemistry",
  },
  {
    id: "synaptic",
    name: "Synapse",
    space: [5e-8, 1e-6],
    time: [1e-4, 1e0],
    laws: [
      "Quantal release (Dodge–Rahamimoff)",
      "Short-term plasticity (Tsodyks–Markram)",
      "STDP (Bi & Poo 1998)",
    ],
    observables: [
      "EPSP / IPSP amplitude",
      "Quantal content",
      "Paired-pulse ratio",
    ],
    methods: [
      "Whole-cell patch clamp",
      "Two-photon glutamate uncaging",
    ],
    engine: "neuron",
  },
  {
    id: "cellular",
    name: "Single neuron",
    space: [1e-6, 1e-4],
    time: [1e-3, 1e1],
    laws: [
      "Hodgkin–Huxley membrane equations",
      "Cable theory (Rall)",
    ],
    observables: [
      "Action potentials",
      "Subthreshold oscillations",
      "Calcium transients",
    ],
    methods: [
      "Patch clamp",
      "Calcium imaging (GCaMP)",
      "Juxtacellular recording",
    ],
    engine: "neuron",
  },
  {
    id: "microcircuit",
    name: "Microcircuit",
    space: [1e-4, 1e-3],
    time: [1e-3, 1e1],
    laws: [
      "Excitation / inhibition balance",
      "Recurrent dynamics (echo-state, ring attractors)",
    ],
    observables: [
      "Multi-unit firing patterns",
      "Local field potentials",
    ],
    methods: [
      "Multi-electrode arrays (Neuropixels)",
      "Optogenetic perturbation",
    ],
    engine: "physics",
  },
  {
    id: "column",
    name: "Cortical column",
    space: [1e-3, 1e-2],
    time: [1e-3, 1e1],
    laws: [
      "Canonical microcircuit (Douglas & Martin 2004)",
      "Layer-specific feed-forward / feedback",
    ],
    observables: [
      "Columnar LFP, current source density",
    ],
    methods: [
      "Laminar electrodes",
      "Voltage-sensitive dye imaging",
    ],
    engine: "physics",
  },
  {
    id: "areal",
    name: "Brain area",
    space: [1e-2, 5e-2],
    time: [1e-2, 1e2],
    laws: [
      "Mean-field rate equations (Wilson–Cowan)",
      "Neural mass models (Jansen–Rit)",
    ],
    observables: [
      "Evoked potentials",
      "Band-limited power",
    ],
    methods: [
      "ECoG, MEG/EEG source localisation",
      "fMRI BOLD per parcel",
    ],
    engine: "physics",
  },
  {
    id: "network",
    name: "Large-scale network",
    space: [5e-2, 1.5e-1],
    time: [1e-1, 1e3],
    laws: [
      "Kuramoto coupling on connectome",
      "Graph-theoretic metrics (modularity, small-world)",
    ],
    observables: [
      "Functional connectivity matrices",
      "Phase-locking value",
      "Network integration / segregation",
    ],
    methods: [
      "fMRI rs-FC",
      "MEG coherence",
      "Diffusion MRI tractography",
    ],
    engine: "physics",
  },
  {
    id: "whole-brain",
    name: "Whole brain",
    space: [1.5e-1, 2e-1],
    time: [1e0, 1e5],
    laws: [
      "Metastability, criticality (Deco & Kringelbach 2016)",
      "TVB whole-brain models",
    ],
    observables: [
      "Resting-state networks",
      "Global signal, dynamic FC",
    ],
    methods: [
      "Whole-brain fMRI / MEG",
      "The Virtual Brain (TVB) simulation",
    ],
    engine: "physics",
  },
  {
    id: "behavioral",
    name: "Behaviour & cognition",
    space: [2e-1, 2],
    time: [1e-1, 3e9],
    laws: [
      "Drift–diffusion, reinforcement learning",
      "Bayesian belief updating",
    ],
    observables: [
      "Reaction time, accuracy",
      "Clinical scale scores (PHQ-9, GAD-7, …)",
      "Patient-reported outcomes",
    ],
    methods: [
      "Psychophysics",
      "Validated clinical instruments",
      "Ecological momentary assessment",
    ],
    engine: "clinical",
  },
];

export const SCALE_BY_ID: Record<ScaleId, ScaleRung> = Object.fromEntries(
  SCALE_LADDER.map((s) => [s.id, s]),
) as Record<ScaleId, ScaleRung>;
