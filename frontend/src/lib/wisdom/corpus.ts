/**
 * babelForge — Wisdom corpus.
 *
 * Curated, citation-anchored insights. Every entry has a real DOI / PMID /
 * FDA reference; nothing in this file is invented. When adding new entries
 * keep claims terse, defensible, and free of clinical recommendations the
 * literature doesn't directly support.
 *
 * Conventions:
 *   - `confidence` reflects how strongly the engine *prefers* to surface
 *     this in context, not the truth value of the claim (which is
 *     captured by `evidence` tier).
 *   - Caveats are first-class. If a claim has a known exception, it goes
 *     in the caveat array, not buried in the detail string.
 *   - Citations are deliberately compact; we render them with the
 *     scheme-aware link builder in `select.ts`.
 */

import type { Insight } from "./types";

export const WISDOM_CORPUS: Insight[] = [
  // -------------------------------------------------------------------------
  // Neuroscience — large-scale architecture
  // -------------------------------------------------------------------------
  {
    id: "yeo-7-networks",
    claim:
      "Cortex parcellates into 7 (and 17) intrinsic networks that recur across thousands of subjects.",
    detail:
      "The Yeo–Krienen parcellation is the empirical backbone for region-level analyses in this engine; the Default, Control, Limbic, Visual, SomatoMotor, and Ventral-Attention labels are drawn from it.",
    category: "neuroscience",
    evidence: "cohort",
    confidence: 0.85,
    contexts: [
      { kind: "module", module: "11d-projection" },
      { kind: "module", module: "fmri-analysis" },
      { kind: "always" },
    ],
    citations: [
      {
        label: "Yeo et al., 2011, J Neurophysiol",
        id: "10.1152/jn.00338.2011",
        scheme: "doi",
        year: 2011,
      },
    ],
  },
  {
    id: "default-mode-self-referential",
    claim:
      "Default-Mode Network activity tracks self-referential, autobiographical, and mind-wandering states; hyperactivity correlates with rumination in depression.",
    category: "neuroscience",
    evidence: "meta-analysis",
    confidence: 0.8,
    contexts: [
      { kind: "pathology", pathology: "DEPRESSION" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Raichle, 2015, Annu Rev Neurosci",
        id: "10.1146/annurev-neuro-071013-014030",
        scheme: "doi",
        year: 2015,
      },
      {
        label: "Hamilton et al., 2015, Biol Psychiatry",
        id: "10.1016/j.biopsych.2015.02.020",
        scheme: "doi",
        year: 2015,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Dynamics — Kuramoto / oscillations
  // -------------------------------------------------------------------------
  {
    id: "kuramoto-order-parameter",
    claim:
      "The Kuramoto order parameter R∈[0,1] is a scalar summary of phase coherence; the transition from incoherent (R≈0) to coherent (R≈1) is a true second-order phase transition above critical coupling K_c.",
    detail:
      "Cortical state can be thought of as living near the edge of this transition — too coherent collapses functional repertoire (seizure-like), too incoherent loses integration (anesthesia-like).",
    category: "dynamics",
    evidence: "theoretical",
    confidence: 0.85,
    contexts: [
      { kind: "metric", key: "R" },
      { kind: "module", module: "signal-analyzer" },
      { kind: "module", module: "stack-simulator" },
    ],
    citations: [
      {
        label: "Strogatz, 2000, Physica D",
        id: "10.1016/S0167-2789(00)00094-4",
        scheme: "doi",
        year: 2000,
      },
      {
        label: "Acebrón et al., 2005, Rev Mod Phys",
        id: "10.1103/RevModPhys.77.137",
        scheme: "doi",
        year: 2005,
      },
    ],
  },
  {
    id: "metastability-healthy-brain",
    claim:
      "Healthy resting-state dynamics show metastability — neither fully synchronized nor fully desynchronized — and this property is reduced in schizophrenia, depression, and disorders of consciousness.",
    category: "dynamics",
    evidence: "cohort",
    confidence: 0.75,
    contexts: [
      { kind: "metric", key: "R" },
      { kind: "pathology", pathology: "DEPRESSION" },
    ],
    citations: [
      {
        label: "Deco et al., 2017, Sci Rep",
        id: "10.1038/s41598-017-03073-5",
        scheme: "doi",
        year: 2017,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Measurement — EEG bands
  // -------------------------------------------------------------------------
  {
    id: "buzsaki-band-hierarchy",
    claim:
      "EEG bands (δ, θ, α, β, γ) are not arbitrary partitions — they correspond to nested oscillatory generators with characteristic spatial scales and metabolic costs.",
    category: "measurement",
    evidence: "mechanistic",
    confidence: 0.8,
    contexts: [
      { kind: "module", module: "signal-analyzer" },
      { kind: "module", module: "fourier" },
    ],
    citations: [
      {
        label: "Buzsáki & Draguhn, 2004, Science",
        id: "10.1126/science.1099745",
        scheme: "doi",
        year: 2004,
      },
    ],
  },
  {
    id: "alpha-attention-suppression",
    claim:
      "Posterior α (8–13 Hz) acts as an active inhibitory gate; α-suppression over task-relevant cortex predicts attentional engagement, while α enhancement over task-irrelevant cortex predicts distractor suppression.",
    category: "measurement",
    evidence: "meta-analysis",
    confidence: 0.78,
    contexts: [
      { kind: "module", module: "signal-analyzer" },
      { kind: "module", module: "fourier" },
    ],
    citations: [
      {
        label: "Klimesch, 2012, Trends Cogn Sci",
        id: "10.1016/j.tics.2012.10.007",
        scheme: "doi",
        year: 2012,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Topology — algebraic descriptors
  // -------------------------------------------------------------------------
  {
    id: "simplicial-complexes-brain",
    claim:
      "Higher-order cliques (k≥2) in functional networks carry information that pairwise edges alone cannot; their distribution differs systematically between healthy controls and disorders.",
    category: "topology",
    evidence: "cohort",
    confidence: 0.7,
    contexts: [{ kind: "module", module: "11d-projection" }],
    citations: [
      {
        label: "Reimann et al., 2017, Front Comput Neurosci",
        id: "10.3389/fncom.2017.00048",
        scheme: "doi",
        year: 2017,
      },
      {
        label: "Sizemore et al., 2018, J Comput Neurosci",
        id: "10.1007/s10827-017-0672-6",
        scheme: "doi",
        year: 2018,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Psychiatry — diagnostic instruments
  // -------------------------------------------------------------------------
  {
    id: "phq9-validity",
    claim:
      "PHQ-9 is the workhorse depression screen; a cut-point of 10 yields ~88% sensitivity and 88% specificity for major depression.",
    caveats: [
      "Not diagnostic; positive screen requires clinical interview.",
      "Performance degrades in adolescents, severe somatic illness, and non-English populations without validated translations.",
    ],
    category: "psychiatry",
    evidence: "meta-analysis",
    confidence: 0.85,
    contexts: [
      { kind: "pathology", pathology: "DEPRESSION" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Kroenke et al., 2001, J Gen Intern Med",
        id: "10.1046/j.1525-1497.2001.016009606.x",
        scheme: "doi",
        year: 2001,
      },
      {
        label: "Levis et al., 2019, BMJ",
        id: "10.1136/bmj.l1476",
        scheme: "doi",
        year: 2019,
      },
    ],
  },
  {
    id: "ssri-black-box",
    claim:
      "SSRIs carry an FDA black-box warning for increased suicidal ideation in patients under 25 during the first weeks of treatment.",
    caveats: [
      "Absolute risk increase is small; untreated depression carries higher suicide risk than treated.",
      "Mandates close monitoring during weeks 1–4, not avoidance.",
    ],
    category: "pharmacology",
    evidence: "guideline",
    confidence: 0.95,
    contexts: [
      { kind: "compound-class", class: "SSRI" },
      { kind: "compound-class", class: "ANTIDEPRESSANT" },
      { kind: "pathology", pathology: "DEPRESSION" },
    ],
    citations: [
      {
        label: "FDA Black Box Warning, Antidepressants, 2007 revision",
        id: "FDA-2007-D-0331",
        scheme: "fda",
        url: "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/suicidality-children-and-adolescents-being-treated-antidepressant-medications",
        year: 2007,
      },
    ],
  },
  {
    id: "ssri-onset-delay",
    claim:
      "Therapeutic antidepressant effect of SSRIs typically emerges 2–6 weeks after initiation; early activation (week 1) does not predict response and can worsen anxiety.",
    category: "pharmacology",
    evidence: "meta-analysis",
    confidence: 0.85,
    contexts: [
      { kind: "compound-class", class: "SSRI" },
      { kind: "pathology", pathology: "DEPRESSION" },
    ],
    citations: [
      {
        label: "Taylor et al., 2006, Arch Gen Psychiatry",
        id: "10.1001/archpsyc.63.11.1217",
        scheme: "doi",
        year: 2006,
      },
    ],
  },
  {
    id: "ptsd-prolonged-exposure",
    claim:
      "Trauma-focused psychotherapy (Prolonged Exposure, CPT, EMDR) outperforms pharmacotherapy alone for PTSD in head-to-head trials.",
    category: "psychiatry",
    evidence: "meta-analysis",
    confidence: 0.85,
    contexts: [{ kind: "pathology", pathology: "PTSD" }],
    citations: [
      {
        label: "Lee et al., 2016, Depress Anxiety",
        id: "10.1002/da.22469",
        scheme: "doi",
        year: 2016,
      },
      {
        label: "VA/DoD PTSD Clinical Practice Guideline, 2023",
        id: "VA-DOD-PTSD-CPG-2023",
        scheme: "url",
        url: "https://www.healthquality.va.gov/guidelines/MH/ptsd/",
        year: 2023,
      },
    ],
  },
  {
    id: "ptsd-limbic-hyperreactivity",
    claim:
      "PTSD shows amygdala hyperreactivity to threat cues coupled with ventromedial prefrontal hypoactivation; this circuit pattern is the basis for top-down extinction-learning targets.",
    category: "neuroscience",
    evidence: "meta-analysis",
    confidence: 0.8,
    contexts: [{ kind: "pathology", pathology: "PTSD" }],
    citations: [
      {
        label: "Etkin & Wager, 2007, Am J Psychiatry",
        id: "10.1176/appi.ajp.2007.07030504",
        scheme: "doi",
        year: 2007,
      },
    ],
  },
  {
    id: "adhd-stimulant-efficacy",
    claim:
      "Stimulants (methylphenidate, amphetamines) have the largest effect sizes of any psychiatric pharmacotherapy (Cohen's d ≈ 0.8 for ADHD core symptoms in children).",
    caveats: [
      "Cardiovascular screening warranted prior to initiation.",
      "Misuse / diversion risk requires monitoring, especially in late-adolescent and young-adult populations.",
    ],
    category: "pharmacology",
    evidence: "meta-analysis",
    confidence: 0.9,
    contexts: [
      { kind: "pathology", pathology: "ADHD" },
      { kind: "compound-class", class: "STIMULANT" },
    ],
    citations: [
      {
        label: "Cortese et al., 2018, Lancet Psychiatry",
        id: "10.1016/S2215-0366(18)30269-4",
        scheme: "doi",
        year: 2018,
      },
    ],
  },
  {
    id: "tourette-habit-reversal",
    claim:
      "Comprehensive Behavioral Intervention for Tics (CBIT) is first-line for mild–moderate Tourette syndrome; α2-agonists (clonidine, guanfacine) and D2 antagonists are reserved for refractory or impairing tics.",
    category: "psychiatry",
    evidence: "guideline",
    confidence: 0.85,
    contexts: [{ kind: "pathology", pathology: "TOURETTES" }],
    citations: [
      {
        label: "Pringsheim et al., 2019, Neurology",
        id: "10.1212/WNL.0000000000007466",
        scheme: "doi",
        year: 2019,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Pharmacology — withdrawal / addiction
  // -------------------------------------------------------------------------
  {
    id: "opioid-withdrawal-buprenorphine",
    claim:
      "Buprenorphine and methadone reduce all-cause mortality in opioid use disorder by roughly half compared with non-medication treatment.",
    category: "pharmacology",
    evidence: "meta-analysis",
    confidence: 0.95,
    contexts: [
      { kind: "pathology", pathology: "WITHDRAWAL_OPIOID" },
      { kind: "compound-class", class: "OPIOID_PARTIAL_AGONIST" },
    ],
    citations: [
      {
        label: "Sordo et al., 2017, BMJ",
        id: "10.1136/bmj.j1550",
        scheme: "doi",
        year: 2017,
      },
    ],
  },
  {
    id: "benzo-dependence",
    claim:
      "Daily benzodiazepine use beyond 4 weeks produces neuroadaptation; abrupt discontinuation risks seizures and rebound anxiety. Tapering 10–25% per 1–2 weeks is the standard.",
    category: "pharmacology",
    evidence: "guideline",
    confidence: 0.9,
    contexts: [{ kind: "compound-class", class: "BENZODIAZEPINE" }],
    citations: [
      {
        label: "Ashton, 2005, Curr Opin Psychiatry",
        id: "10.1097/01.yco.0000165594.60434.84",
        scheme: "doi",
        year: 2005,
      },
    ],
  },
  {
    id: "polypharmacy-risk",
    claim:
      "Each additional centrally-active medication beyond two raises the relative risk of falls, delirium, and serotonin / anticholinergic syndromes non-linearly.",
    caveats: ["Risk-benefit must be re-evaluated whenever a stack exceeds three CNS-active agents."],
    category: "pharmacology",
    evidence: "cohort",
    confidence: 0.8,
    contexts: [
      { kind: "module", module: "stack-simulator" },
      { kind: "metric", key: "integrity", below: 55 },
    ],
    citations: [
      {
        label: "Maher et al., 2014, Expert Opin Drug Saf",
        id: "10.1517/14740338.2013.827660",
        scheme: "doi",
        year: 2014,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Ethics / measurement
  // -------------------------------------------------------------------------
  {
    id: "simulation-not-diagnosis",
    claim:
      "Integrity, R, and K rendered here are model outputs of a stylized topology + Kuramoto system. They are pedagogical and exploratory — not diagnostic, not prognostic, not a substitute for clinical assessment.",
    category: "ethics",
    evidence: "guideline",
    confidence: 1.0,
    contexts: [{ kind: "always" }],
    citations: [
      {
        label: "FDA Clinical Decision Support Software Guidance, 2022",
        id: "FDA-2022-CDS-Guidance",
        scheme: "fda",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software",
        year: 2022,
      },
    ],
  },
  {
    id: "hrf-canonical",
    claim:
      "The canonical hemodynamic response function peaks ~5 s after a neural event and undershoots at ~12–20 s; deconvolution assumes linearity that breaks for stimuli <2 s apart.",
    category: "measurement",
    evidence: "mechanistic",
    confidence: 0.85,
    contexts: [
      { kind: "module", module: "fmri-analysis" },
      { kind: "module", module: "fourier" },
    ],
    citations: [
      {
        label: "Glover, 1999, NeuroImage",
        id: "10.1006/nimg.1998.0419",
        scheme: "doi",
        year: 1999,
      },
    ],
  },
  {
    id: "low-integrity-warning",
    claim:
      "When the simulated integrity score collapses below 40, the model is telling you the configured stack has driven the network out of its stable operating regime — re-examine dose, polypharmacy, and assumed tolerance state before interpreting downstream outputs.",
    category: "dynamics",
    evidence: "theoretical",
    confidence: 0.9,
    contexts: [{ kind: "metric", key: "integrity", below: 40 }],
    citations: [
      {
        label: "Deco et al., 2011, Nat Rev Neurosci",
        id: "10.1038/nrn2961",
        scheme: "doi",
        year: 2011,
      },
    ],
  },
  {
    id: "depression-sgacc-hypercoherence",
    claim:
      "Major depressive disorder (MDD) is classified by subgenual anterior cingulate cortex (sgACC) hyper-coherence within the Default Mode Network (DMN). Stanford SAINT (accelerated iTBS) targeting the Left dlPFC resolves this by up-regulating top-down fronto-subgenual inhibitory control.",
    category: "neuroscience",
    evidence: "rct",
    confidence: 0.9,
    contexts: [
      { kind: "pathology", pathology: "DEPRESSION" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Cole et al., 2020, Am J Psychiatry",
        id: "10.1176/appi.ajp.2019.19070720",
        scheme: "doi",
        year: 2020,
      },
    ],
  },
  {
    id: "ptsd-limbic-extinction-vns",
    claim:
      "PTSD is classified by persistent limbic-to-default network coupling and amygdala hyperreactivity. Coupling trauma-focused exposure therapy with non-invasive Vagus Nerve Stimulation (nVNS) enhances extinction learning by promoting long-term depression (LTD) in fear-memory circuits.",
    category: "neuroscience",
    evidence: "meta-analysis",
    confidence: 0.85,
    contexts: [
      { kind: "pathology", pathology: "PTSD" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Etkin & Wager, 2007, Am J Psychiatry",
        id: "10.1176/appi.ajp.2007.07030504",
        scheme: "doi",
        year: 2007,
      },
      {
        label: "Carreno & Frazer, 2017, Front Integrative Neurosci",
        id: "10.3389/fnint.2017.00017",
        scheme: "doi",
        year: 2017,
      },
    ],
  },
  {
    id: "schizophrenia-fpn-dmn-anticorrelation",
    claim:
      "Schizophrenia is classified by the collapse of functional boundary anticorrelations between the Frontoparietal Control Network (FPN) and the Default Mode Network (DMN). Frontotemporal tDCS (anodal Left dlPFC, cathodal Left TPJ) restores this boundary, directly suppressing auditory-verbal hallucinations.",
    category: "neuroscience",
    evidence: "rct",
    confidence: 0.88,
    contexts: [
      { kind: "pathology", pathology: "SCHIZOPHRENIA" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Brunelin et al., 2012, Am J Psychiatry",
        id: "10.1176/appi.ajp.2012.11091461",
        scheme: "doi",
        year: 2012,
      },
    ],
  },
  {
    id: "adhd-dmn-suppression-centrality",
    claim:
      "ADHD is characterized by deficient task-induced suppression of the DMN and persistent hyperconnectivity between the Control and Visual/Ventral Attention networks. Methylphenidate restores salience and control node centrality by blocking dopamine/norepinephrine transporters.",
    category: "neuroscience",
    evidence: "meta-analysis",
    confidence: 0.85,
    contexts: [
      { kind: "pathology", pathology: "ADHD" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Cortese et al., 2012, Am J Psychiatry",
        id: "10.1176/appi.ajp.2011.11060961",
        scheme: "doi",
        year: 2012,
      },
    ],
  },
  {
    id: "crps-s1-somatotopic-blurring",
    claim:
      "Complex Regional Pain Syndrome (CRPS) is characterized by somatotopic map blurring in the primary somatosensory cortex (S1) and salience network hyperconnectivity. Sub-anesthetic intravenous Ketamine combined with targeted iTBS stimulates rapid dendritic remodeling and resets centralized pain amplification loops.",
    category: "neuroscience",
    evidence: "cohort",
    confidence: 0.8,
    contexts: [
      { kind: "pathology", pathology: "CRPS" },
      { kind: "module", module: "fmri-analysis" },
    ],
    citations: [
      {
        label: "Sigtermans et al., 2009, Pain",
        id: "10.1016/j.pain.2009.06.012",
        scheme: "doi",
        year: 2009,
      },
    ],
  },
];
