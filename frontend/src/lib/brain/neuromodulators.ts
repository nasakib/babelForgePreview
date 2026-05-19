/**
 * babelForge — neuromodulator systems.
 *
 * Six brainstem / basal-forebrain nuclei whose long-range projections
 * shape the gain, learning rate, and arousal state of the entire cortex.
 * Each gets a token, a color (mapped from palette band hues so the AI
 * assistant can speak in consistent symbols), a characteristic firing
 * mode, and the clinical handles babelForge cares about.
 *
 * References:
 *   - Aston-Jones & Cohen, Annu Rev Neurosci 2005 (LC adaptive gain).
 *     doi:10.1146/annurev.neuro.28.061604.135709
 *   - Schultz, Annu Rev Psychol 2007 (dopamine RPE).
 *     doi:10.1146/annurev.psych.56.091103.070229
 *   - Hasselmo, Behav Brain Res 1995 (ACh and memory).
 *     doi:10.1016/0166-4328(95)00113-1
 *   - Müller et al., Neuron 2014 (serotonin firing modes).
 *     doi:10.1016/j.neuron.2014.03.001
 *   - Haas & Panula, Nat Rev Neurosci 2003 (histamine).
 *     doi:10.1038/nrn1034
 */

import { palette } from "@/lib/theme/palette";

export type NeuromodulatorId = "DA" | "5HT" | "NE" | "ACh" | "HA" | "OXY";

export type FiringMode = "tonic" | "phasic" | "burst" | "tonic+phasic" | "circadian";

export interface NeuromodulatorSystem {
  id: NeuromodulatorId;
  token: string;
  name: string;
  source: string[];
  /** Color used everywhere this modulator is rendered. */
  color: string;
  /** Hz characteristic for *visual motion*, not biophysics. */
  motionHz: number;
  /** Animation/motion semantic — drives canvas + AI metaphors. */
  motion: "pulse" | "ripple" | "burst" | "shimmer" | "drift" | "tremor";
  firingMode: FiringMode;
  /** Receptor families this NT engages. */
  receptors: string[];
  /** Behaviors / functions modulated. */
  functions: string[];
  /** Disorders implicated in dysregulation of this system. */
  disorders: string[];
}

export const NEUROMODULATORS: NeuromodulatorSystem[] = [
  {
    id: "DA",
    token: "M:DA",
    name: "Dopamine",
    source: ["Substantia nigra pars compacta (SNc)", "Ventral tegmental area (VTA)"],
    color: palette.bands.gamma, // honey/amber — fast reward/salience
    motionHz: 4,
    motion: "burst",
    firingMode: "tonic+phasic",
    receptors: ["D1 (Gs)", "D2 (Gi)", "D3", "D4", "D5"],
    functions: ["Reward prediction error", "Motor initiation", "Working memory gating", "Salience"],
    disorders: ["Parkinson's disease", "Schizophrenia", "Addiction", "ADHD"],
  },
  {
    id: "5HT",
    token: "M:5HT",
    name: "Serotonin",
    source: ["Dorsal raphe nucleus", "Median raphe nucleus"],
    color: palette.bands.alpha, // cyan-blue — calm, regulatory
    motionHz: 1,
    motion: "drift",
    firingMode: "tonic",
    receptors: ["5-HT1A (Gi)", "5-HT2A (Gq)", "5-HT2C", "5-HT3 (ion)", "5-HT4", "5-HT6", "5-HT7"],
    functions: ["Mood regulation", "Patience / temporal discounting", "Sleep–wake transitions", "Aggression dampening"],
    disorders: ["Major depression", "Anxiety", "OCD", "Serotonin syndrome (toxicity)"],
  },
  {
    id: "NE",
    token: "M:NE",
    name: "Norepinephrine",
    source: ["Locus coeruleus (LC)"],
    color: palette.bands.beta, // green — alert / vigilance
    motionHz: 10,
    motion: "pulse",
    firingMode: "tonic+phasic",
    receptors: ["α1 (Gq)", "α2 (Gi)", "β1 (Gs)", "β2", "β3"],
    functions: ["Arousal / vigilance", "Adaptive gain (Aston-Jones)", "Stress response", "Attention"],
    disorders: ["PTSD", "ADHD", "Depression", "Alzheimer's (earliest tau pathology)"],
  },
  {
    id: "ACh",
    token: "M:ACh",
    name: "Acetylcholine",
    source: ["Nucleus basalis of Meynert (NBM)", "Medial septum / diagonal band", "Pedunculopontine nucleus"],
    color: palette.bands.theta, // deep blue — encoding / theta
    motionHz: 6,
    motion: "ripple",
    firingMode: "phasic",
    receptors: ["nAChR (ion)", "M1 (Gq)", "M2 (Gi)", "M3", "M4", "M5"],
    functions: ["Memory encoding", "Attention", "REM sleep", "Synaptic plasticity gating"],
    disorders: ["Alzheimer's disease", "Lewy body dementia", "Myasthenia gravis (peripheral)"],
  },
  {
    id: "HA",
    token: "M:HA",
    name: "Histamine",
    source: ["Tuberomammillary nucleus (TMN)"],
    color: palette.bands.delta, // violet — slow/state
    motionHz: 0.5,
    motion: "shimmer",
    firingMode: "circadian",
    receptors: ["H1 (Gq)", "H2 (Gs)", "H3 (Gi autoreceptor)", "H4"],
    functions: ["Wakefulness", "Appetite regulation", "Itch / inflammation interface"],
    disorders: ["Narcolepsy (loss of orexin → loss of HA support)", "Sedation from H1 antagonists"],
  },
  {
    id: "OXY",
    token: "M:OXY",
    name: "Oxytocin",
    source: ["Paraventricular nucleus (PVN)", "Supraoptic nucleus (SON)"],
    color: palette.warn,
    motionHz: 0.1,
    motion: "drift",
    firingMode: "phasic",
    receptors: ["OXTR (Gq)"],
    functions: ["Social bonding", "Parturition / lactation (peripheral)", "Trust / in-group bias"],
    disorders: ["Investigated in autism, postpartum depression — evidence mixed"],
  },
];

export const NEUROMOD_BY_ID: Record<NeuromodulatorId, NeuromodulatorSystem> = Object.fromEntries(
  NEUROMODULATORS.map((m) => [m.id, m]),
) as Record<NeuromodulatorId, NeuromodulatorSystem>;
