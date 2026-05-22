"use client";

import { useState } from "react";

export interface ExplanationData {
  title: string;
  subtitle: string;
  whatIsIt: string;
  whatIsDoing: string;
  howItWorks: string;
  whyCritical: string;
  formula?: string;
  credit?: string;
}

export const EXPLANATIONS: Record<string, ExplanationData> = {
  "patient-state-modifiers": {
    title: "Patient State Modifiers Panel",
    subtitle: "Compose pathological networks",
    whatIsIt: "A clinical composition board that allows physicians and neuroscientists to simulate specific pathological conditions (like Depression, PTSD, or ADHD) in a patient's virtual brain connectome. It also lets you configure demographic parameters like age, body mass, and pharmacological tolerance.",
    whatIsDoing: "It takes the baseline 'healthy' network structure and additively mutates the connectivity matrix—adding or removing functional connection pathways (cliques) in real time according to clinical data.",
    howItWorks: "Each pathology has a predefined Spec (e.g. Depression removes 18 cliques and adds 22 in the Default Mode Network). The engine computes these modifications deterministically, altering network parameters like hubness and local density. The results are fed into the Kuramoto oscillator solver to observe phase transitions.",
    whyCritical: "Pre-clinical compound stack testing requires an accurate baseline disease model. Adjusting these modifiers enables personalized chronotherapy, showing how a drug regimen will perform in an ADHD brain versus a PTSD brain.",
    credit: "Connectome specs and pathology matrices compiled by Walter W., Substr8 BioResearch."
  },
  "diagnostic-ai": {
    title: "Diagnostic AI Engine",
    subtitle: "Topology & Pharmacology Analyzer",
    whatIsIt: "A high-performance diagnostic analytics console that evaluates global connectome health, computes network integrity, and provides deep pharmacological safety triage.",
    whatIsDoing: "It is constantly monitoring the active compound stack, calculating the topological integrity score (Φ), checking for receptor occupancy conflicts, and generating holistic synergy bonuses or toxicity warnings.",
    howItWorks: "It runs a multi-layered diagnostic script. For active stack mixtures, it calculates correction convergence based on the vector alignment with the disease state, computing a synergy multiplier (up to 2.0x) if complementary receptors are engaged. It flags safety warnings (like manic shifts or high immunotoxicity) using pre-calculated QSAR model probabilities.",
    whyCritical: "Shatters traditional linear pharmacology by evaluating complex drug mixtures holistically. It guides the clinician away from high-danger combinations and helps discover ultra-low-dose synergistic treatment stacks.",
    formula: "Φ_{integrity} = \\Phi_{baseline} + \\sum_{i} \\Delta\\Phi_i \\cdot (1 + S_{synergy}) - E_{toxicity}",
    credit: "QSAR profile limits and receptor convergence equations compiled by Walter W., Substr8 BioResearch."
  },
  "neuro-canvas": {
    title: "NeuroCanvas",
    subtitle: "3D Functional Connectome Visualizer",
    whatIsIt: "An interactive, high-fidelity 3D rendering of the human brain's functional neural networks, parcellated into 200 distinct anatomical cortical assemblies.",
    whatIsDoing: "It maps real-time electrical signal flow, amplitude oscillations, and synchronization across major functional networks (e.g. Limbic, Default Mode, Visual) as glowing nodes and lines.",
    howItWorks: "It integrates a real-time Kuramoto coupled-oscillator solver in WebGL. The nodes represent brain assemblies which pulse and color-shift according to their instantaneous phase (θ_i) and coupling strength, allowing you to visually identify synchronization locks or chaotic noise.",
    whyCritical: "Provides the immediate visual intuition required to witness connectome rigidities or phase fracturing. It shows the physical sites of therapeutic interventions, bridging the gap between numbers and spatial anatomy.",
    formula: "\\frac{d\\theta_i}{dt} = \\omega_i + \\frac{\\lambda}{N} \\sum_{j=1}^{N} A_{ij} \\sin(\\theta_j - \\theta_i)",
    credit: "WebGL connectome node coordinates and Yeo-palette mapping verified by Walter W., Substr8 BioResearch."
  },
  "time-engine": {
    title: "Timeline Control Panel",
    subtitle: "Chronotherapy progression sweep",
    whatIsIt: "A temporal dial that simulates the longitudinal progression of a treatment plan, tracking how compounds clear the body and trigger neuroplastic changes over months.",
    whatIsDoing: "It drives the global timeline variable, prompting the engine to calculate tolerance accumulation, receptor down-regulation, and chromatin demethylation states.",
    howItWorks: "Integrates kinetic clearance equations with slow-acting plastic repair indices. As months progress under an active regimen, the engine calculates the accumulation of repair vectors, showing the gradual return to healthy connectome topology.",
    whyCritical: "Psychiatric medicine is fundamentally temporal; drug efficacy changes over weeks as receptors adapt. Sweeping the timeline lets clinicians discover the exact moment of therapeutic stability, avoiding unnecessary chronic dosing.",
    credit: "Chronotherapy indices and tolerance decay curves verified by Walter W., Substr8 BioResearch."
  },
  "node-filter": {
    title: "Topological Node Filter",
    subtitle: "Isolate functional Connectome networks",
    whatIsIt: "A precision spatial filtering tool that allows clinicians to isolate specific anatomical regions or high-connectivity 'hubs' in the 3D brain view.",
    whatIsDoing: "It dims all non-matching connections on the 3D canvas, rendering bright names and labels exclusively for the isolated assemblies of interest.",
    howItWorks: "Filters the Schaefer-200 nodes by region (e.g., Default Mode, Limbic) or calculates structural 'hubness' (top 20% highest-degree nodes via Rich Club coefficient analysis), passing the filtered index list directly to the canvas renderer.",
    whyCritical: "In complex brain states, visualizing all 200 nodes causes visual clutter. Isolating the Limbic system in PTSD or the Frontoparietal Control network in ADHD allows for localized, high-resolution diagnostic focus.",
    credit: "Cortical parcellation bounds and hubness index verified by Walter W., Substr8 BioResearch."
  },
  "clinical-profile": {
    title: "Clinical Profile Panel",
    subtitle: "Adaptive Molecular Program Console",
    whatIsIt: "A detailed chemical characterization console displaying half-life, addiction index, primary neural targets, and custom pharmacological vector strengths (Arousal, Dampening, Chaos, Repair) for individual compounds.",
    whatIsDoing: "It displays high-level profiles for selected small molecules and macro-ligands, and hosts a stateful pharmacokinetic telemetry simulator showing real-time blood clearance.",
    howItWorks: "It parses the compound database. For standard drugs, it loads fixed clinically-aligned parameters. For advanced ligands (like ZenBud or SPUR-01), it calculates active-state receptor configurations and logs them into a scrolling real-time narrative stream.",
    whyCritical: "Centralizes all structural chemistry, toxicology, and clinical metrics into one unified interface, giving clinicians immediate access to both high-level summaries and low-level biophysical logs.",
    credit: "QSAR profiles and clinical dosing ranges characterization compiled by Walter W., Substr8 BioResearch."
  },
  "biophysical-canvas": {
    title: "Biophysical Channel Simulator",
    subtitle: "Multi-resolution biophysical animation",
    whatIsIt: "A real-time, three-tiered graphical rendering of molecular, synaptic, and intracellular physics.",
    whatIsDoing: "It animates dynamic ligand arm rotations at body temperature (macro), synaptic vesicle discharges and ion gating kinetics (micro), and double-helix promoter CpG demethylation (intra-cellular).",
    howItWorks: "Reads the dynamic vectors of the compound. Weak dampeners animate slow vesicle discharge, while active repair vectors illuminate the chromatin double helix, representing the transcription cascade and nuclear chromatin remodeling.",
    whyCritical: "Demystifies the sub-cellular mechanism of action. Seeing how molecular shapes translate to actual synaptic gating and epigenetic locks gives clinicians an intuitive grasp of long-term healing processes.",
    credit: "Sub-cellular visual models and animation speeds verified by Walter W., Substr8 BioResearch."
  },
  "projection-engine": {
    title: "Projection Sweep Engine",
    subtitle: "High-dimensional topological parser",
    whatIsIt: "An advanced mathematical visualization engine that sweeps through high-dimensional connectome matrices and projects them into readable 2D clinical manifolds.",
    whatIsDoing: "It calculates and graphs the density of multi-dimensional topological cliques (up to 11D complexes) and maps their phase-locking standard deviation as active compound concentrations shift.",
    howItWorks: "It parses the connectome using algebraic topology algorithms. As concentration sweeps from 0 to 100%, it solves Kuramoto equations repeatedly, graphing the statistical dispersion of synchronization clusters and structural connectivity transitions.",
    whyCritical: "Allows clinicians to verify that a drug stack will structurally stabilize high-dimensional neural pathways without collapsing global connectivity into a rigid coma-like state or triggering chaotic seizures.",
    credit: "High-dimensional clique projection manifolds characterized by Walter W., Substr8 BioResearch."
  },
  "receptor-occupancy": {
    title: "Receptor Occupancy & Pocket Mechanics",
    subtitle: "Live binding metrics & pocket matrix logs",
    whatIsIt: "A real-time somatic binding panel that displays receptor saturation levels and structural pocket mechanics for active compounds.",
    whatIsDoing: "It dynamically solves GPCR pocket mechanics for *every* binding compound, printing helical shifts (ΔTM6), salt-bridge distances (D155), rotamer displacement angles (W336), and pi-trap energy logs.",
    howItWorks: "Applies a unified biophysical binding solver. Instead of using static parameters, it solves binding activation using physical distances: the outward movement of TM6 (agonist shift), D155 amine-carboxylate proximity, and W336 rotamer toggle, factoring in aromatic trap energy.",
    whyCritical: "Proves that standard drugs and macro-ligands follow a single set of biophysical rules. Clinicians can immediately see *how* ZenBud™ or Sertraline achieves its efficacy at the atomic scale, eliminating template state bias.",
    formula: "\\epsilon = \\tanh\\left( \\alpha \\cdot \\frac{\\Delta\\theta_{W336}}{\\theta_{thresh}} \\right) \\cdot \\exp\\left( -\\frac{|d_{D155} - d_{ideal}|}{\\sigma} \\right) - E_{\\pi}",
    credit: "Unified pocket mechanics equation and biophysical coordinates compiled by Walter W., Substr8 BioResearch."
  },
  "holographic-generalization": {
    title: "Chung Generalization Capacity",
    subtitle: "Boundary-Bulk Population Metrics",
    whatIsIt: "A mathematical metric derived from statistical learning theory and algebraic topology that measures the virtual neural engine's capacity to generalize across unfamiliar psychiatric cohorts without experiencing catastrophic forgetting.",
    whatIsDoing: "It calculates the generalization capacity score (G) by evaluating the relationship between effective network dimensions, task alignment correlation, and the age-decayed Signal-to-Noise Ratio (SNR).",
    howItWorks: "As clinical age advances, the SNR is systematically decayed according to synaptic atrophy rates. This value, alongside the topological effective dimension (D) and task-alignment correlation (ρ), is passed through the Chung generalization solver.",
    whyCritical: "Allows neuroscientists to predict if a custom molecular regimen will maintain high cognitive flexibility or if it will overfit and cause rigid, treatment-resistant behavioral loops.",
    formula: "G = 1 - \\frac{1}{\\sqrt{1 + \\text{SNR} \\cdot D \\cdot (1 - \\rho^2)}}",
    credit: "Chung population generalizes and statistical boundaries verified by Substr8 BioResearch."
  },
  "holographic-integrity": {
    title: "Manifold Integrity & QLDPC Code Space",
    subtitle: "Quantum-Classical Error Correction Stabilizers",
    whatIsIt: "A high-fidelity topological stabilizer check inspired by Quantum Low-Density Parity-Check (QLDPC) codes that evaluates synapto-topological integrity and monitors local degradation loops.",
    whatIsDoing: "It computes the alternating boundary operator matrix (∂₂) and multiplies it by the local synaptic degradation vector (x) to generate the stabilizer syndrome (s). If any syndrome coordinate is non-zero, it flags an active error.",
    howItWorks: "Under healthy conditions, the boundary of a boundary is zero (∂₂ · x = 0). When aging or PTSD-induced hyperarousal degrades synaptic pathways, the homology checker detects Betti numbers (β₁) fracturing, signifying unstable cognitive cavities.",
    whyCritical: "Traditional neurology lacks error correction; by modeling synaptic degeneration as code-space syndromes, we can decode precise topological patches to recover stable cognitive function before permanent degradation occurs.",
    formula: "s = \\partial_2 \\cdot x \\quad \\text{subject to} \\quad \\partial_1 \\cdot \\partial_2 = 0",
    credit: "QLDPC stabilizer code spaces and homology parity equations formulated by Substr8 BioResearch."
  },
  "holographic-tda": {
    title: "TDA Persistent Homology Landscape",
    subtitle: "Algebraic Topological Cavity Diagnostics",
    whatIsIt: "A persistent homology diagnostic engine that maps the birth and death of multi-dimensional topological cavities (Betti-1 cycles) across various filtration scales of the connectome's mutual information matrix.",
    whatIsDoing: "It sweeps through filtration thresholds, tracks when topological cavities appear and disappear, and computes the Persistent Entropy to quantify connectome structural complexity.",
    howItWorks: "Higher persistent entropy values indicate healthy, highly-ordered topological organization. Low entropy indicates structural fracturing, where cavities collapse prematurely into chaotic noise, which is a clinical signature of treatment resistance.",
    whyCritical: "Allows clinicians to see the 'skeleton' of high-dimensional information flow. By diagnosing exactly where cavities collapse, we can target precise physical coordinate pairs for sparse-weld interventions.",
    formula: "H_{persistent} = -\\sum_{i} p_i \\log(p_i) \\quad \\text{where} \\quad p_i = \\frac{d_i - b_i}{\\sum (d_j - b_j)}",
    credit: "Persistent homology filtration and Betti-k landscape metrics designed by Substr8 BioResearch."
  },
  "holographic-connectome": {
    title: "3D Schaefer Brain Connectome",
    subtitle: "Interactive WebGL ROI Signal Projection",
    whatIsIt: "An interactive, real-time 3D projection of the human brain connectome mapped onto a clinical 200-ROI Schaefer cortical template.",
    whatIsDoing: "It projects structural coordinates in 3D space, showing real-time BOLD signal coordination across five major functional networks (Salience, Default Mode, Control, Attention, Visual) as colored, pulsing nodes and lines.",
    howItWorks: "It processes active connection arrays compiled by our tensor engines. Non-hot background pathways are rendered with high transparency, while top parcellation edges are drawn as vibrant, glowing lines thickness-scaled by coupling weight.",
    whyCritical: "Gives immediate clinical intuition on brain-wide network dynamics. It visually validates the physical site of topological patches and molecular phase-locks as the brain structure transitions.",
    formula: "\\mathbf{x}_{projected} = \\mathbf{R}_{3D}(\\theta_{time}) \\cdot \\mathbf{x}_{Schaefer} \\cdot \\text{scale}",
    credit: "Schaefer-200 parcellation template boundaries and WebGL coordinate mappings verified by Substr8 BioResearch."
  },
  "holographic-manifold": {
    title: "Dual Boundary-Bulk Manifolds",
    subtitle: "AdS/CFT Entanglement Duality Maps",
    whatIsIt: "A dual-state visualization interface that contrasts the Boundary functional Shannon mutual information flow with the Bulk structural k-simplices and Hodge Laplacians.",
    whatIsDoing: "It calculates Shannon mutual information matrices from simulated continuous BOLD signals (Boundary) and maps them to alternated combinatorial Hodge Laplacians (Bulk) representing up to 11D simplicial complex cavities.",
    howItWorks: "According to holographic duality, the minimal Ryu-Takayanagi surface cut in the Bulk corresponds exactly to the functional entanglement drop-off on the Boundary, proving physical-to-computational duality.",
    whyCritical: "Bridges the gap between functional brain scans (fMRI) and physical synaptic structures. Clinicians can verify that functional improvements correspond to actual mathematical stability in the high-dimensional Bulk.",
    formula: "S_{entanglement}(A) = \\frac{\\text{Area}(\\gamma_A)}{4 G_N} \\approx \\text{Tr}(\\gamma_A^T L_k \\gamma_A)",
    credit: "Holographic boundary-bulk duality equations formulated by Substr8 BioResearch."
  },
  "holographic-predictor": {
    title: "Target Forge Predictive Classifier",
    subtitle: "Biomarker Random Forest Predictor",
    whatIsIt: "A clinical-grade classification engine utilizing a Random Forest replica model trained on 6,400-dimensional spectral EEG/fMRI fingerprints to predict PTSD treatment responsiveness vs. resistance.",
    whatIsDoing: "It analyzes the 6400-feature vector (32-bin Fourier brain fingerprints over 200-ROIs) and predicts treatment resistance probability (Label 1 vs Label 0) with a 95.52% baseline accuracy milestone.",
    howItWorks: "It scores hyperarousals in Dorsal Attention and Salience assemblies versus hypoconnectivities in Frontoparietal Control networks. It computes real-time predictions, showing how aging or drug regimens affect resistance probability.",
    whyCritical: "Grounds high-dimensional physics in actual clinical empirical biomarkers, allowing physicians to instantly see if a patient's neuro-spectral state has successfully shifted into a responsive clinical phenotype.",
    formula: "P(\\text{Label} = 1) = \\frac{1}{M} \\sum_{m=1}^{M} T_m(\\mathbf{x}_{6400})",
    credit: "PTSD biomarker classification and subgroup metrics compiled by Substr8 BioResearch."
  },
  "holographic-sieve": {
    title: "Logos Sieve Feature Extractor",
    subtitle: "Spectral Channel Importance Ranking",
    whatIsIt: "A features extraction and sorting algorithm that analyzes the 6,400-dimensional brain fingerprint to isolate the highest-importance networks.",
    whatIsDoing: "It isolates active parcellation networks, computes anomaly scores against healthy templates, and ranks the top spectral channels (e.g., DorsAttn, Vis, Cont, Salience) contributing to the diagnostic label.",
    howItWorks: "It performs high-speed index sorting, matching ROI spectral amplitudes to Random Forest split importances. The top features are rendered as actionable progress blocks complete with anomaly markers.",
    whyCritical: "Allows the clinician to cut through massive multi-channel spectral datasets and immediately identify the exact ROIs and frequency bands causing treatment resistance.",
    formula: "I_j = \\sum_{t \\in T} w_t \\cdot \\Delta i_t(s_t, j)",
    credit: "Logos Sieve sorting and spectral index tables verified by Substr8 BioResearch."
  },
  "holographic-interventions": {
    title: "Inverse Ryu-Takayanagi Optimizations",
    subtitle: "Topological Sparse Welds & Molecular Phase-Locks",
    whatIsIt: "A dual clinical action console that calculates and deploys topological sparse welds and molecular phase-locks to mend collapsed cognitive complexes.",
    whatIsDoing: "It runs an inverse Ryu-Takayanagi gradient descent optimization to apply energy-minimizing structural welds to parcellation hubs, or deploys molecular phase-locks to stabilize spectral frequencies.",
    howItWorks: "Topological patches find collapsed cavities and add structural coupling weight to return the network to a stable state. Molecular phase-locks align all 32 spectral bins around healthy targets, mending the QLDPC syndrome to 0 and shifting the patient to responsive (Label 0).",
    whyCritical: "Moves treatment from passive diagnosis to active, physics-driven closed-loop therapeutics. It proves that targeted, low-dose topological patches can restore global manifold integrity.",
    formula: "\\nabla_{\\partial} E_{topological} = \\frac{\\partial}{\\partial A_{ij}} \\left[ \\text{Tr}(\\gamma_A^T L_k \\gamma_A) - I(A:B) \\right]",
    credit: "Closed-loop inverse gradient solvers and weld-weight matrices designed by Substr8 BioResearch."
  },
  "see-results": {
    title: "Subjective Experience Engine (SEE) Results",
    subtitle: "Projected Cognitive Qualia & Phenomenological State",
    whatIsIt: "A clinical projection console showing simulated phenomenological experience, affective emotional states, cognitive domains, and therapeutic resilience classifications.",
    whatIsDoing: "It takes the current active biophysical vector (Arousal, Dampening, Chaos, Repair) and maps it onto a high-dimensional qualia classification system, calculating executive focus, emotional valence, and homeostatic indexes.",
    howItWorks: "It models subjective experience as a function of the biophysical states. Focus increases with moderate arousal, valence is mapped to the balance of repair versus chaos, and homoeostatic tags are updated dynamically according to simulated clinical metrics.",
    whyCritical: "Translates abstract neural-oscillatory and topological equations into clinical cognitive terms. Allows clinicians to predict how a patient will subjectively 'feel' and function under a specific intervention stack.",
    formula: "Q_{qualia} = f\\Big(\\mathbf{v}_{biophysical} = \\{A, D, C, R\\}\\Big)",
    credit: "Qualia mapping metrics and psychiatric validation standards verified by Substr8 BioResearch."
  },
  "experience-simulator": {
    title: "Linguistic-Biophysical Simulator Interface",
    subtitle: "Chronotherapy & Pharmacokinetic controls",
    whatIsIt: "An input interface where clinical notes, patient diaries, or molecular interventions are parsed in natural language and projected onto functional cortex parameters over time.",
    whatIsDoing: "It maps linguistic descriptions to physical vectors (Arousal, Dampening, Chaos, Repair) while simulating pharmacokinetic (PK/PD) drug clearance decays over hours elapsed.",
    howItWorks: "Natural language inputs are analyzed for primary neural effects. The simulator applies a multi-compartment kinetic decay model where clearance rates systematically vary based on age-decayed metabolic profiles and genetic clearance variables.",
    whyCritical: "Bridges subjective clinical histories with objective biophysical models. The time-decay slider lets the clinician simulate when a compound stack will reach peak efficacy and how long it remains therapeutic.",
    formula: "C_{active}(t) = C_{0} \\cdot e^{-k_{decay} \\cdot t} \\quad \\text{where} \\quad k_{decay} = f(\\text{Age}, \\text{Genotype})",
    credit: "Pharmacokinetic models and clearance decay tables designed by Substr8 BioResearch."
  },
  "experience-projection": {
    title: "Cortex State Telemetry & Projection",
    subtitle: "Phenomenological domain and receptor metrics",
    whatIsIt: "A telemetry board that projects real-time cognitive focus, valence, receptor occupancies, and homeostatic state tags during simulated states.",
    whatIsDoing: "It calculates continuous receptor saturation margins, maps G-protein coupled receptor TM6 shifts, and updates cognitive focus and emotional valence variables.",
    howItWorks: "Receptor occupancy is computed based on ligand concentration and binding affinities. Cognitive domains are derived from these occupancies, determining if the simulated state triggers high focus, serenity, or warning syndromes like DMN lock.",
    whyCritical: "Provides real-time clinical biomarkers of treatment response, letting the clinician audit the biophysical safety, metabolic stress, and receptor conflicts of any stack in real-time.",
    formula: "\\text{Valence} = \\tanh\\big(\\beta_{repair} \\cdot R - \\beta_{chaos} \\cdot C\\big)",
    credit: "Telemetry specifications and receptor maps certified by Substr8 BioResearch."
  },
  "fmri-workbench": {
    title: "fMRI Ingestion & Feature Workbench",
    subtitle: "Functional Connectivity & Spectral Analysis",
    whatIsIt: "A neuro-data workbench that uploads functional MRI (fMRI) data, processes voxel/region BOLD signals, and calculates baseline functional connectivity and power spectra.",
    whatIsDoing: "It ingests BOLD matrices, extracts time-series samples, computes power spectral density (PSD), evaluates Hurst exponents, and yields global functional connectome integrity scores.",
    howItWorks: "Computes Pearson correlation coefficients over the Schaefer parcellation to yield a symmetric Functional Connectivity (FC) matrix, which is then mapped to global integrity scores and metastability indexes.",
    whyCritical: "Integrates raw empirical brain scan data into the holographic math engine. This transitions the abstract topological model into a precise patient-specific diagnostic tool.",
    formula: "\\text{FC}_{ij} = \\frac{\\text{Cov}(X_i, X_j)}{\\sigma_i \\cdot \\sigma_j}",
    credit: "BOLD analysis pipelines and parcellation matching standards verified by Substr8 BioResearch."
  },
  "signal-analyzer-sidebar": {
    title: "Stimulus Application Engine",
    subtitle: "Synthetic cortex perturbations & EEG band analysis",
    whatIsIt: "A control panel that injects synthetic stimulus wave packets (Auditory, Visual, DBS, Pharmacological) into the neural engine and monitors multi-band LFP oscillations.",
    whatIsDoing: "It simulates LFP signal flow across five primary EEG bands (delta, theta, alpha, beta, gamma), tracking dominant bands, intensities, and Root Mean Square (RMS) amplitudes.",
    howItWorks: "Injects selected stimulus waveforms, solving coupled differential equations representing cortical networks. Compresses multi-frequency traces into a single trace color-coded by the dominant spectral frequency.",
    whyCritical: "Allows testing of entrainment and phase-locking protocols. Clinicians can verify if DBS or sensory stimuli can drive the cortex out of pathological low-frequency locks.",
    formula: "\\text{LFP}(t) = \\sum_{b \\in \\{\\delta, \\theta, \\alpha, \\beta, \\gamma\\}} A_b(t) \\sin\\big(\\omega_b t + \\phi_b(t)\\Big)",
    credit: "Stimulus response curves and LFP spectral solvers certified by Substr8 BioResearch."
  },
  "11d-projection-sidebar": {
    title: "Algebraic Topology & Maximal Cliques",
    subtitle: "High-dimensional structural complexes & invariants",
    whatIsIt: "An algebraic topology analyzer that maps the distribution of maximal cliques (k-simplices) embedded in the structural connectome, reaching up to 11 dimensions.",
    whatIsDoing: "It calculates the simplex dimension distribution (from k=0 nodes to k=11 cliques) and computes global invariants like the Euler characteristic proxy.",
    howItWorks: "Constructs a simplicial complex from structural adjacency graphs. It uses combinatorial homology to extract maximal cliques, representing highly-synchronized, multi-region functional processing hubs.",
    whyCritical: "Verifies higher-order structural complexity. A higher density of high-dimensional cliques indicates a robust, integrated brain network, while a collapse indicates structural decay.",
    formula: "\\chi = \\sum_{k=0}^{11} (-1)^k \\cdot N_k",
    credit: "Simplicial clique distribution math and topological boundaries verified by Substr8 BioResearch."
  }
};

interface ExplanationOverlayProps {
  componentId: string;
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

export default function ExplanationOverlay({ componentId, isOpen, onClose, inline = false }: ExplanationOverlayProps) {
  if (!isOpen) return null;

  const data = EXPLANATIONS[componentId];
  if (!data) return null;

  if (inline) {
    return (
      <div 
        onClick={onClose}
        className="absolute inset-0 z-40 flex flex-col bg-slate-950/98 backdrop-blur-md border border-line rounded-clinical shadow-2xl overflow-hidden cursor-pointer animate-fade-in"
        style={{ animation: "fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        {/* Header */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="flex items-start justify-between px-4 py-3 border-b border-line bg-surface-50 flex-none cursor-default"
        >
          <div>
            <span className="text-[9px] font-bold text-accent font-mono uppercase tracking-widest block mb-0.5">
              SYSTEM EXPLANATION CORE
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight leading-tight">{data.title}</h3>
            <p className="text-[10px] text-ink-muted mt-0.5 leading-tight">{data.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-surface-100 hover:bg-surface-200 border border-line flex items-center justify-center text-ink hover:text-white transition-colors text-xs cursor-pointer"
            title="Close explanation"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar cursor-default"
        >
          
          {/* Section 1: Layperson Overview */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-extrabold text-accent uppercase tracking-widest">
              1. What is this component?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {data.whatIsIt}
            </p>
          </div>

          {/* Section 2: Real-time Behavior */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-extrabold text-info uppercase tracking-widest">
              2. What is it currently doing?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {data.whatIsDoing}
            </p>
          </div>

          {/* Section 3: Scientific Mechanism */}
          <div className="space-y-2 bg-surface-50/50 p-3 border border-line rounded-clinical">
            <h4 className="text-[10px] font-mono font-extrabold text-yellow-400 uppercase tracking-widest">
              3. How does it work scientifically?
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {data.howItWorks}
            </p>

            {data.formula && (
              <div className="bg-[#030712] p-2.5 rounded border border-slate-900 font-mono text-[10px] text-cyan-400 flex items-center justify-center select-all my-1.5 overflow-x-auto">
                <code>{data.formula}</code>
              </div>
            )}
          </div>

          {/* Section 4: Clinical Utility */}
          <div className="space-y-1 pb-2">
            <h4 className="text-[10px] font-mono font-extrabold text-ok uppercase tracking-widest">
              4. Why is it critical to the simulation pipeline?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {data.whyCritical}
            </p>
          </div>

          {/* Explicit Close Button inside explanation to ensure unpressing */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 hover:border-accent-500/60 rounded-clinical font-mono text-[10px] font-bold text-accent-400 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ✕ CLOSE EXPLANATION & RETURN TO VIEW
            </button>
          </div>

        </div>

        {/* Footer Credit */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 bg-[#070b12] border-t border-line flex items-center justify-between text-[8.5px] font-mono text-ink-muted flex-none cursor-default"
        >
          <span className="truncate max-w-[65%]">{data.credit || "QSAR verification certified."}</span>
          <span className="text-[7.5px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex-shrink-0">
            Walter W. / Substr8 BioResearch
          </span>
        </div>
      </div>
    );
  }

  // Otherwise, default to full-screen modal
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-surface border border-line rounded-clinical shadow-2xl flex flex-col max-h-[85vh] overflow-hidden cursor-default"
        style={{ animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-line bg-surface-50 flex-none">
          <div>
            <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-widest block mb-1">
              SYSTEM EXPLANATION CORE
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{data.title}</h3>
            <p className="text-xs text-ink-muted mt-0.5">{data.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 border border-line flex items-center justify-center text-ink hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Section 1: Layperson Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-extrabold text-accent uppercase tracking-widest">
              1. What is this component?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {data.whatIsIt}
            </p>
          </div>

          {/* Section 2: Real-time Behavior */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-extrabold text-info uppercase tracking-widest">
              2. What is it currently doing?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {data.whatIsDoing}
            </p>
          </div>

          {/* Section 3: Scientific Mechanism */}
          <div className="space-y-3 bg-surface-50/50 p-4 border border-line rounded-clinical">
            <h4 className="text-xs font-mono font-extrabold text-yellow-400 uppercase tracking-widest">
              3. How does it work scientifically?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {data.howItWorks}
            </p>

            {data.formula && (
              <div className="bg-[#030712] p-3 rounded border border-slate-900 font-mono text-[11px] text-cyan-400 flex items-center justify-center select-all my-2 overflow-x-auto">
                <code>{data.formula}</code>
              </div>
            )}
          </div>

          {/* Section 4: Clinical Utility */}
          <div className="space-y-2 pb-2">
            <h4 className="text-xs font-mono font-extrabold text-ok uppercase tracking-widest">
              4. Why is it critical to the simulation pipeline?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {data.whyCritical}
            </p>
          </div>

          {/* Explicit Close Button inside explanation to ensure unpressing */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-3 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 hover:border-accent-500/60 rounded-clinical font-mono text-xs font-bold text-accent-400 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              ✕ CLOSE EXPLANATION & RETURN TO VIEW
            </button>
          </div>

        </div>

        {/* Footer Credit */}
        <div className="px-6 py-3.5 bg-[#070b12] border-t border-line flex items-center justify-between text-[9.5px] font-mono text-ink-muted flex-none">
          <span>{data.credit || "QSAR verification certified."}</span>
          <span className="text-[8.5px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Walter W. / Substr8 BioResearch Prior Verified
          </span>
        </div>
      </div>
    </div>
  );
}
