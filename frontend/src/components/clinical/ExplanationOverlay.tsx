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
  }
};

interface ExplanationOverlayProps {
  componentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExplanationOverlay({ componentId, isOpen, onClose }: ExplanationOverlayProps) {
  if (!isOpen) return null;

  const data = EXPLANATIONS[componentId];
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-surface border border-line rounded-clinical shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-line bg-surface-50">
          <div>
            <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-widest block mb-1">
              SYSTEM EXPLANATION CORE
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{data.title}</h3>
            <p className="text-xs text-ink-muted mt-0.5">{data.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 border border-line flex items-center justify-center text-ink hover:text-white transition-colors"
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
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-extrabold text-ok uppercase tracking-widest">
              4. Why is it critical to the simulation pipeline?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {data.whyCritical}
            </p>
          </div>

        </div>

        {/* Footer Credit */}
        <div className="px-6 py-3.5 bg-[#070b12] border-t border-line flex items-center justify-between text-[9.5px] font-mono text-ink-muted">
          <span>{data.credit || "QSAR verification certified."}</span>
          <span className="text-[8.5px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Walter W. / Substr8 BioResearch Prior Verified
          </span>
        </div>
      </div>
    </div>
  );
}
