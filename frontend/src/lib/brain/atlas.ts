/**
 * babelForge — brain atlas.
 *
 * A curated, color-/motion-/frequency-coded atlas of brain regions tuned
 * for the babelForge dissection engine. Each region carries the metadata
 * needed to (a) render it consistently across NeuroCanvas + dissection
 * UI, (b) tokenize it for AI grounding, and (c) link it to the engines
 * (physics / neuron / chemistry / clinical) that operate on it.
 *
 * Region selection prioritises clinical and pharmacological yield: the
 * ~28 entries below cover the regions implicated in the disorders and
 * drug mechanisms the rest of the app references. Coordinates are MNI-
 * adjacent centroids (mm), approximated for visualisation, not for
 * registration.
 *
 * Sources for anatomy / function / connectivity:
 *   - Paxinos & Mai, *The Human Nervous System*, 4e (2023).
 *   - Yeo et al., J Neurophysiol 2011 (7-network parcellation).
 *     doi:10.1152/jn.00338.2011
 *   - Schaefer et al., Cereb Cortex 2018 (200-parcel atlas).
 *     doi:10.1093/cercor/bhx179
 *   - Mesulam, Ann Neurol 1990 (large-scale networks).
 *     doi:10.1002/ana.410280502
 *   - Buzsáki, *Rhythms of the Brain*, 2006 (oscillatory signatures).
 *
 * Disorder-region mappings cite primary lesion / fMRI / postmortem work:
 *   - Mayberg, Neuron 2005 (sgACC / BA25 in depression).
 *     doi:10.1016/j.neuron.2005.02.014
 *   - Kalivas & Volkow, Am J Psychiatry 2005 (NAc / addiction).
 *     doi:10.1176/appi.ajp.162.8.1403
 *   - Braak & Braak, Acta Neuropathol 1991 (AD entorhinal / HPC).
 *     doi:10.1007/BF00308809
 *   - Obeso et al., Mov Disord 2017 (basal ganglia in PD).
 *     doi:10.1002/mds.27115
 */

import { palette } from "@/lib/theme/palette";
import type { ScaleId } from "./scales";
import type { NeuromodulatorId } from "./neuromodulators";

/**
 * Atlas-level pathology tag. Broader than the engine's `Pathology` enum so
 * the descriptive atlas can mention conditions (schizophrenia, parkinsons,
 * anxiety, ocd, addiction, ...) that don't yet have engine-side composers.
 */
export type AtlasPathology =
  | "depression"
  | "anxiety"
  | "ptsd"
  | "adhd"
  | "ocd"
  | "addiction"
  | "schizophrenia"
  | "parkinsons"
  | "alzheimers"
  | "tourettes"
  | "withdrawal_opioid";

/** Yeo-7 superset extended with subcortical buckets for color routing. */
export type AtlasNetwork =
  | "Default"
  | "Control"
  | "Limbic"
  | "Visual"
  | "SomatoMotor"
  | "VentAttn"
  | "DorsalAttn"
  | "Subcortical"
  | "Brainstem"
  | "Cerebellum";

/** Canonical EEG bands we color-map onto. */
export type Band = "delta" | "theta" | "alpha" | "beta" | "gamma";

/** Motion semantics for animation + AI metaphor. */
export type MotionKind =
  | "pulse"      // rhythmic expansion/contraction
  | "ripple"     // travelling wave outward
  | "burst"      // brief high-amplitude transient
  | "shimmer"    // low-amplitude jitter
  | "drift"      // slow tonic envelope
  | "tremor"     // pathological 4-8 Hz oscillation
  | "spiral"     // rotating phase
  | "still";     // baseline / silent

export interface BrainRegion {
  /** Short token id used by AI + tokenizer; e.g. "R:HPC". */
  token: string;
  /** Internal id (lowercase, no prefix). */
  id: string;
  /** Display name. */
  name: string;
  /** Anatomical aliases / Brodmann areas etc. */
  aliases: string[];
  /** Approx. MNI centroid (x mm right+, y mm anterior+, z mm superior+). */
  mni: [number, number, number];
  /** Yeo-network bucket → primary color. */
  network: AtlasNetwork;
  /** Dominant EEG band → secondary color + motionHz. */
  band: Band;
  /** Characteristic frequency (Hz) for *visualisation* (mean of band range). */
  freqHz: number;
  /** Motion semantic. */
  motion: MotionKind;
  /** Primary neuromodulators this region produces or strongly receives. */
  modulators: NeuromodulatorId[];
  /** Dominant fast neurotransmitter(s). */
  fastNT: ("glutamate" | "GABA")[];
  /** Approximate gray-matter volume (cm³). */
  volumeCm3: number;
  /** Which scale rungs are most relevant when dissecting this region. */
  scales: ScaleId[];
  /** Pathologies in which this region is mechanistically central. */
  pathologies: AtlasPathology[];
  /** Lesion / dysfunction syndromes — one-line clinical strings. */
  syndromes: string[];
  /** One-line functional summary. */
  function: string;
}

// ---------------------------------------------------------------------------
// Color helpers — exposed so external callers (tokens, dissection, canvas)
// route through the same palette logic.
// ---------------------------------------------------------------------------

const NETWORK_COLOR: Record<AtlasNetwork, string> = {
  Default: palette.regions.Default,
  Control: palette.regions.Control,
  Limbic: palette.regions.Limbic,
  Visual: palette.regions.Visual,
  SomatoMotor: palette.regions.SomatoMotor,
  VentAttn: palette.regions.VentAttn,
  DorsalAttn: palette.regions.Control,
  Subcortical: palette.warn,
  Brainstem: palette.crit,
  Cerebellum: palette.info,
};

const BAND_COLOR: Record<Band, string> = palette.bands;

/** Band → mid-band frequency (Hz), the value we render motion at. */
export const BAND_HZ: Record<Band, number> = {
  delta: 2,
  theta: 6,
  alpha: 10,
  beta: 20,
  gamma: 45,
};

export function networkColor(n: AtlasNetwork): string {
  return NETWORK_COLOR[n];
}
export function bandColor(b: Band): string {
  return BAND_COLOR[b];
}

// ---------------------------------------------------------------------------
// Atlas — 28 high-yield regions. Tokens use a short stable mnemonic.
// ---------------------------------------------------------------------------

export const REGIONS: BrainRegion[] = [
  // ─── Frontal cortex ───────────────────────────────────────────────────────
  {
    token: "R:DLPFC",
    id: "dlpfc",
    name: "Dorsolateral prefrontal cortex",
    aliases: ["BA 9", "BA 46"],
    mni: [40, 35, 35],
    network: "Control",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: ["DA", "NE", "5HT"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 28,
    scales: ["column", "areal", "network", "behavioral"],
    pathologies: ["depression", "schizophrenia", "addiction"],
    syndromes: [
      "Executive dysfunction, perseveration, hypoactivity in depression",
      "TMS target for treatment-resistant depression (FDA-cleared 2008)",
    ],
    function: "Working memory, cognitive control, top-down attention",
  },
  {
    token: "R:VMPFC",
    id: "vmpfc",
    name: "Ventromedial prefrontal cortex",
    aliases: ["BA 10", "BA 11", "BA 25 (subgenual ACC)"],
    mni: [0, 45, -15],
    network: "Default",
    band: "alpha",
    freqHz: BAND_HZ.alpha,
    motion: "drift",
    modulators: ["5HT", "DA"],
    fastNT: ["glutamate"],
    volumeCm3: 22,
    scales: ["areal", "network", "behavioral"],
    pathologies: ["depression", "anxiety"],
    syndromes: [
      "Hyperactive sgACC (BA25) is a Mayberg DBS target for TRD",
      "Lesions disrupt value-based decision-making (Damasio)",
    ],
    function: "Self-referential thought, value integration, default-mode anchor",
  },
  {
    token: "R:ACC",
    id: "acc",
    name: "Anterior cingulate cortex",
    aliases: ["BA 24", "BA 32"],
    mni: [0, 30, 20],
    network: "VentAttn",
    band: "theta",
    freqHz: BAND_HZ.theta,
    motion: "ripple",
    modulators: ["DA", "NE", "5HT"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 14,
    scales: ["areal", "network", "behavioral"],
    pathologies: ["depression", "ocd", "addiction", "ptsd"],
    syndromes: [
      "Error-related negativity (ERN) generator; hyperactive in OCD",
      "Conflict monitoring (Botvinick et al. 2001)",
    ],
    function: "Conflict monitoring, error detection, autonomic-cognitive interface",
  },
  {
    token: "R:OFC",
    id: "ofc",
    name: "Orbitofrontal cortex",
    aliases: ["BA 11", "BA 13", "BA 47"],
    mni: [20, 35, -18],
    network: "Limbic",
    band: "alpha",
    freqHz: BAND_HZ.alpha,
    motion: "drift",
    modulators: ["DA", "5HT"],
    fastNT: ["glutamate"],
    volumeCm3: 16,
    scales: ["areal", "network", "behavioral"],
    pathologies: ["ocd", "addiction"],
    syndromes: [
      "Phineas Gage-type lesions → disinhibition, poor judgment",
      "Hyperactivity in OCD provocation paradigms",
    ],
    function: "Reward valuation, outcome representation, social-emotional regulation",
  },
  {
    token: "R:M1",
    id: "m1",
    name: "Primary motor cortex",
    aliases: ["BA 4", "precentral gyrus"],
    mni: [40, -20, 55],
    network: "SomatoMotor",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: ["DA"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 18,
    scales: ["column", "areal"],
    pathologies: ["parkinsons"],
    syndromes: [
      "Beta desynchronisation during movement initiation",
      "Pathological beta in Parkinson's (Brown 2003)",
    ],
    function: "Voluntary movement execution, motor map",
  },

  // ─── Sensory cortex ───────────────────────────────────────────────────────
  {
    token: "R:V1",
    id: "v1",
    name: "Primary visual cortex",
    aliases: ["BA 17", "striate cortex", "calcarine"],
    mni: [10, -85, 0],
    network: "Visual",
    band: "gamma",
    freqHz: BAND_HZ.gamma,
    motion: "shimmer",
    modulators: ["ACh"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 24,
    scales: ["microcircuit", "column", "areal"],
    pathologies: [],
    syndromes: [
      "Cortical blindness with lesion; preserved blindsight via colliculus",
      "Gamma rhythm generator (Hz scales with stimulus contrast)",
    ],
    function: "Edge / orientation / spatial-frequency analysis",
  },
  {
    token: "R:A1",
    id: "a1",
    name: "Primary auditory cortex",
    aliases: ["BA 41", "Heschl's gyrus"],
    mni: [50, -22, 8],
    network: "SomatoMotor",
    band: "gamma",
    freqHz: BAND_HZ.gamma,
    motion: "shimmer",
    modulators: ["ACh"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 6,
    scales: ["microcircuit", "column", "areal"],
    pathologies: ["schizophrenia"],
    syndromes: [
      "Tonotopic gradient",
      "Hyperactivity in auditory hallucinations (schizophrenia)",
    ],
    function: "Frequency / temporal-envelope decoding",
  },
  {
    token: "R:S1",
    id: "s1",
    name: "Primary somatosensory cortex",
    aliases: ["BA 1/2/3", "postcentral gyrus"],
    mni: [40, -30, 55],
    network: "SomatoMotor",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: ["ACh"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 16,
    scales: ["column", "areal"],
    pathologies: [],
    syndromes: ["Somatotopic homunculus; lesion → contralateral hemianesthesia"],
    function: "Touch / proprioception encoding",
  },

  // ─── DMN posterior ────────────────────────────────────────────────────────
  {
    token: "R:PCC",
    id: "pcc",
    name: "Posterior cingulate cortex",
    aliases: ["BA 23", "BA 31", "precuneus-adjacent"],
    mni: [0, -50, 30],
    network: "Default",
    band: "alpha",
    freqHz: BAND_HZ.alpha,
    motion: "drift",
    modulators: ["ACh"],
    fastNT: ["glutamate"],
    volumeCm3: 18,
    scales: ["areal", "network"],
    pathologies: ["depression"],
    syndromes: [
      "Earliest AD hypometabolism site (FDG-PET)",
      "DMN hub; high baseline metabolic demand",
    ],
    function: "Self-referential cognition, autobiographical memory retrieval",
  },
  {
    token: "R:AG",
    id: "ag",
    name: "Angular gyrus",
    aliases: ["BA 39", "TPJ-adjacent"],
    mni: [45, -65, 30],
    network: "Default",
    band: "alpha",
    freqHz: BAND_HZ.alpha,
    motion: "drift",
    modulators: [],
    fastNT: ["glutamate"],
    volumeCm3: 12,
    scales: ["areal", "network", "behavioral"],
    pathologies: [],
    syndromes: ["Gerstmann syndrome with left-AG lesion"],
    function: "Multimodal integration, theory of mind, semantic memory access",
  },

  // ─── Salience / insula ────────────────────────────────────────────────────
  {
    token: "R:INS",
    id: "insula",
    name: "Insular cortex",
    aliases: ["Anterior insula", "BA 13/14"],
    mni: [40, 10, 0],
    network: "VentAttn",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: ["DA", "5HT", "NE"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 14,
    scales: ["areal", "network", "behavioral"],
    pathologies: ["addiction", "anxiety", "depression"],
    syndromes: [
      "Smoking-cessation lesion case (Naqvi et al. 2007)",
      "Interoception hub (Craig 2009)",
    ],
    function: "Interoceptive awareness, salience detection, craving",
  },

  // ─── Limbic / medial temporal ─────────────────────────────────────────────
  {
    token: "R:HPC",
    id: "hippocampus",
    name: "Hippocampus",
    aliases: ["CA1", "CA3", "DG", "subiculum"],
    mni: [28, -22, -15],
    network: "Limbic",
    band: "theta",
    freqHz: BAND_HZ.theta,
    motion: "ripple",
    modulators: ["ACh", "5HT", "NE"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 7,
    scales: ["cellular", "microcircuit", "areal", "network"],
    pathologies: ["depression"],
    syndromes: [
      "H.M. case → anterograde amnesia after bilateral resection",
      "First atrophy site in Alzheimer's (Braak stage III)",
      "Sharp-wave ripples 140–200 Hz during consolidation",
    ],
    function: "Episodic memory encoding, spatial navigation, pattern separation",
  },
  {
    token: "R:AMY",
    id: "amygdala",
    name: "Amygdala",
    aliases: ["BLA (basolateral)", "CeA (central)", "MeA (medial)"],
    mni: [25, -5, -20],
    network: "Limbic",
    band: "gamma",
    freqHz: BAND_HZ.gamma,
    motion: "burst",
    modulators: ["NE", "5HT", "DA"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 3,
    scales: ["microcircuit", "areal", "network"],
    pathologies: ["anxiety", "ptsd", "depression"],
    syndromes: [
      "Hyperreactivity to threat in PTSD / anxiety (Etkin & Wager 2007)",
      "Klüver-Bucy with bilateral lesion",
    ],
    function: "Threat evaluation, emotional salience, fear conditioning",
  },
  {
    token: "R:ENT",
    id: "entorhinal",
    name: "Entorhinal cortex",
    aliases: ["BA 28"],
    mni: [25, -10, -28],
    network: "Limbic",
    band: "theta",
    freqHz: BAND_HZ.theta,
    motion: "ripple",
    modulators: ["ACh"],
    fastNT: ["glutamate"],
    volumeCm3: 4,
    scales: ["microcircuit", "areal"],
    pathologies: [],
    syndromes: [
      "Earliest tau pathology in AD (Braak stage I–II)",
      "Grid cells (Moser & Moser 2005)",
    ],
    function: "Gateway between neocortex and hippocampus; spatial coding",
  },

  // ─── Basal ganglia ────────────────────────────────────────────────────────
  {
    token: "R:STR",
    id: "striatum",
    name: "Striatum (caudate + putamen)",
    aliases: ["Dorsal striatum"],
    mni: [15, 5, 5],
    network: "Subcortical",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: ["DA", "ACh"],
    fastNT: ["GABA"],
    volumeCm3: 10,
    scales: ["cellular", "microcircuit", "network", "behavioral"],
    pathologies: ["parkinsons", "ocd", "addiction"],
    syndromes: [
      "Putaminal dopamine loss in Parkinson's (Kish 1988)",
      "Caudate atrophy in Huntington's",
    ],
    function: "Action selection, reinforcement learning, habit formation",
  },
  {
    token: "R:NAC",
    id: "nac",
    name: "Nucleus accumbens",
    aliases: ["Ventral striatum"],
    mni: [10, 8, -8],
    network: "Limbic",
    band: "gamma",
    freqHz: BAND_HZ.gamma,
    motion: "burst",
    modulators: ["DA", "5HT"],
    fastNT: ["GABA"],
    volumeCm3: 1.2,
    scales: ["microcircuit", "network", "behavioral"],
    pathologies: ["addiction", "depression"],
    syndromes: [
      "Ventral striatal DA release encodes RPE (Schultz 1997)",
      "DBS target for OCD and TRD (off-label)",
    ],
    function: "Reward, motivation, incentive salience",
  },
  {
    token: "R:GPi",
    id: "gpi",
    name: "Globus pallidus internus",
    aliases: ["GPi"],
    mni: [18, -5, 0],
    network: "Subcortical",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "pulse",
    modulators: [],
    fastNT: ["GABA"],
    volumeCm3: 0.5,
    scales: ["microcircuit", "network"],
    pathologies: ["parkinsons"],
    syndromes: ["DBS target for PD and dystonia (FDA-approved 2002)"],
    function: "Basal-ganglia output; tonic inhibition of thalamus",
  },
  {
    token: "R:STN",
    id: "stn",
    name: "Subthalamic nucleus",
    aliases: ["STN"],
    mni: [10, -12, -8],
    network: "Subcortical",
    band: "beta",
    freqHz: BAND_HZ.beta,
    motion: "tremor",
    modulators: [],
    fastNT: ["glutamate"],
    volumeCm3: 0.24,
    scales: ["cellular", "microcircuit", "network"],
    pathologies: ["parkinsons"],
    syndromes: [
      "Pathological beta synchrony in PD (Brown 2003)",
      "Gold-standard DBS target for PD",
    ],
    function: "Indirect-pathway 'stop signal'; gates motor output",
  },
  {
    token: "R:SNc",
    id: "snc",
    name: "Substantia nigra pars compacta",
    aliases: ["SNc"],
    mni: [10, -18, -12],
    network: "Brainstem",
    band: "delta",
    freqHz: BAND_HZ.delta,
    motion: "drift",
    modulators: ["DA"],
    fastNT: [],
    volumeCm3: 0.2,
    scales: ["cellular", "network"],
    pathologies: ["parkinsons"],
    syndromes: [
      "Dopaminergic neuron loss → motor symptoms emerge at ~60% loss",
      "Lewy body / α-synuclein aggregation",
    ],
    function: "Nigrostriatal dopamine source",
  },
  {
    token: "R:VTA",
    id: "vta",
    name: "Ventral tegmental area",
    aliases: ["VTA"],
    mni: [4, -16, -14],
    network: "Brainstem",
    band: "delta",
    freqHz: BAND_HZ.delta,
    motion: "burst",
    modulators: ["DA"],
    fastNT: ["glutamate"],
    volumeCm3: 0.15,
    scales: ["cellular", "network", "behavioral"],
    pathologies: ["addiction", "depression"],
    syndromes: [
      "Mesolimbic DA source; phasic burst on unexpected reward",
      "Optogenetic stim → place preference (Tsai 2009)",
    ],
    function: "Reward prediction error encoding; effort allocation",
  },

  // ─── Thalamus / hypothalamus ──────────────────────────────────────────────
  {
    token: "R:THA",
    id: "thalamus",
    name: "Thalamus",
    aliases: ["MD, VL, VPM/VPL, pulvinar, LGN, MGN, reticular"],
    mni: [10, -18, 8],
    network: "Subcortical",
    band: "alpha",
    freqHz: BAND_HZ.alpha,
    motion: "spiral",
    modulators: ["ACh", "NE"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 8,
    scales: ["microcircuit", "areal", "network"],
    pathologies: ["schizophrenia"],
    syndromes: [
      "Alpha rhythm generator (Hughes & Crunelli 2005)",
      "Sleep spindles (10–15 Hz) from reticular nucleus",
      "Anesthesia disrupts thalamocortical coupling (Alkire 2008)",
    ],
    function: "Sensory + motor relay, cortical rhythm pacemaker",
  },
  {
    token: "R:HYP",
    id: "hypothalamus",
    name: "Hypothalamus",
    aliases: ["PVN", "SCN", "Arcuate", "TMN", "Lateral hypothalamus"],
    mni: [4, -2, -10],
    network: "Subcortical",
    band: "delta",
    freqHz: BAND_HZ.delta,
    motion: "drift",
    modulators: ["HA", "OXY"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 4,
    scales: ["microcircuit", "behavioral"],
    pathologies: [],
    syndromes: [
      "SCN drives circadian rhythm",
      "Orexin loss → narcolepsy type 1",
    ],
    function: "Homeostasis: temperature, appetite, circadian, endocrine",
  },

  // ─── Brainstem nuclei (also covered in neuromodulators.ts) ───────────────
  {
    token: "R:LC",
    id: "lc",
    name: "Locus coeruleus",
    aliases: ["LC"],
    mni: [4, -36, -22],
    network: "Brainstem",
    band: "delta",
    freqHz: BAND_HZ.delta,
    motion: "drift",
    modulators: ["NE"],
    fastNT: ["glutamate"],
    volumeCm3: 0.05,
    scales: ["cellular", "network"],
    pathologies: ["ptsd", "anxiety", "depression"],
    syndromes: [
      "Earliest tau pathology site in AD (Braak 0/I, Theofilas 2017)",
      "Hyperactivity in PTSD startle response",
    ],
    function: "Brain-wide norepinephrine; adaptive gain (Aston-Jones)",
  },
  {
    token: "R:DRN",
    id: "drn",
    name: "Dorsal raphe nucleus",
    aliases: ["DRN", "B7"],
    mni: [0, -28, -18],
    network: "Brainstem",
    band: "delta",
    freqHz: BAND_HZ.delta,
    motion: "drift",
    modulators: ["5HT"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 0.08,
    scales: ["cellular", "network"],
    pathologies: ["depression", "anxiety", "ocd"],
    syndromes: [
      "Primary serotonergic source for forebrain",
      "5-HT1A autoreceptor desensitisation timeline matches SSRI onset delay",
    ],
    function: "Brain-wide serotonin; mood, patience, sleep modulation",
  },
  {
    token: "R:NBM",
    id: "nbm",
    name: "Nucleus basalis of Meynert",
    aliases: ["NBM", "Ch4"],
    mni: [15, 0, -10],
    network: "Subcortical",
    band: "theta",
    freqHz: BAND_HZ.theta,
    motion: "ripple",
    modulators: ["ACh"],
    fastNT: [],
    volumeCm3: 0.2,
    scales: ["cellular", "network"],
    pathologies: [],
    syndromes: [
      "Cholinergic neuron loss in AD (Whitehouse 1982)",
      "Target of cholinesterase-inhibitor pharmacotherapy",
    ],
    function: "Cortical acetylcholine source; attention and plasticity gating",
  },

  // ─── Cerebellum ───────────────────────────────────────────────────────────
  {
    token: "R:CBL",
    id: "cerebellum",
    name: "Cerebellum",
    aliases: ["Vermis", "Crus I/II", "Lobules"],
    mni: [25, -65, -30],
    network: "Cerebellum",
    band: "gamma",
    freqHz: BAND_HZ.gamma,
    motion: "shimmer",
    modulators: ["NE", "5HT"],
    fastNT: ["glutamate", "GABA"],
    volumeCm3: 150,
    scales: ["microcircuit", "areal", "network", "behavioral"],
    pathologies: [],
    syndromes: [
      "Schmahmann's cerebellar cognitive affective syndrome",
      "Implicated in autism, schizophrenia, ataxias",
    ],
    function: "Motor coordination, internal models, cognitive scaffolding",
  },
];

export const REGION_BY_TOKEN: Record<string, BrainRegion> = Object.fromEntries(
  REGIONS.map((r) => [r.token, r]),
);

export const REGION_BY_ID: Record<string, BrainRegion> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);
