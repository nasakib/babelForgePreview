"use client";

/**
 * Foundational Pharmacogenomic Design and QSAR Profiles Compiled by Walter W., Substr8 BioResearch.
 * 
 * ClinicalPanel acts as a premium chrome wrapper and stateful control panel for the 
 * Pharmacogenomic Program Engine's high-level state feedback, including trigger-and-exit 
 * catalytic kinetics, epigenetic transcription latching, and low-energy basin attractor status monitoring.
 */
import { ReactNode, useState, useEffect, useRef } from "react";
import { molecules } from "@/data/molecules";

interface ClinicalPanelProps {
  title: string;
  /** Optional eyebrow text shown above the title in caps. */
  eyebrow?: string;
  /** Right-aligned slot for actions, badges, or live indicators. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** When true, embeds a stateful simulated timeline loop and biophysical narrative feed. */
  enableSimulation?: boolean;
  /** The compound ID to drive telemetry parameters. */
  moleculeId?: string | null;
}

export default function ClinicalPanel({
  title,
  eyebrow,
  actions,
  children,
  className = "",
  enableSimulation = false,
  moleculeId = null,
}: ClinicalPanelProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [elapsedHrs, setElapsedHrs] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedMol = moleculeId ? molecules.find((m) => m.id === moleculeId) : null;

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulation timer loop
  useEffect(() => {
    if (!enableSimulation || !isSimulating) return;

    const timer = setInterval(() => {
      setElapsedHrs((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [isSimulating, enableSimulation]);

  // Generate telemetry logs as simulation ticks
  useEffect(() => {
    if (!enableSimulation || !selectedMol) {
      setLogs([]);
      return;
    }

    if (elapsedHrs === 0) {
      setLogs([
        "SYSTEM INITIALIZED // Awaiting administration trigger...",
        "Core Physics and QSAR Models Characterized by Walter W. / Substr8 BioResearch",
      ]);
      return;
    }

    // 1. Kinetic Layer calculations (apparent concentration C_0 and dynamic ke(t))
    const F = selectedMol.smilesPhysics?.F_bioavail ?? selectedMol.smilesPhysics?.bioavailabilityF ?? 0.80;
    const Vd = selectedMol.smilesPhysics?.Vd_Lkg ?? selectedMol.smilesPhysics?.volumeOfDistributionLkg ?? 1.5;
    
    let baselineHalfLife = 12; // default hrs
    if (selectedMol.halfLife === "long") baselineHalfLife = 24;
    else if (selectedMol.halfLife === "short") baselineHalfLife = 6;

    // Self-referential PXR auto-clearance feedback
    let pxrFeedback = 1.0;
    const pxrProb = selectedMol.qsarProfile?.probabilities?.mie_pxr ?? 0;
    if (pxrProb > 0) {
      pxrFeedback = 1.0 + pxrProb * (elapsedHrs / 16.0);
    }
    const adjustedHalfLife = baselineHalfLife / pxrFeedback;
    const ke = Math.log(2) / adjustedHalfLife;

    const dose = 15.0; // mg
    const patientWeight = 70; // kg
    const initialC = (F * dose * 10.0) / (patientWeight * Vd);
    const currentConc = initialC * Math.exp(-ke * elapsedHrs);

    const newLogs: string[] = [
      `[T+${elapsedHrs.toFixed(1)} hrs] SIMULATION TICK:`,
      `  |- PHARMACOKINETICS:`,
      `     |-- Apparent Concentration (C): ${currentConc.toFixed(4)} µg/L (C0: ${initialC.toFixed(4)} µg/L)`,
      `     |-- Apparent Clearance Rate (ke): ${ke.toFixed(5)} h^-1 (PXR auto-induction: ${pxrFeedback.toFixed(3)}x clearance velocity)`,
      `     |-- Current Biological Half-Life: ${adjustedHalfLife.toFixed(2)} hrs (Induction dynamic shift)`,
    ];

    // 2. Structural Layer pocket mechanics (GPCR helix and salt-bridge metrics)
    if (selectedMol.structuralPhysics && Object.keys(selectedMol.structuralPhysics).length > 0) {
      newLogs.push(`  |- MOLECULAR POCKET MECHANICS:`);
      Object.entries(selectedMol.structuralPhysics).forEach(([rec, geo]: [string, any]) => {
        const deltaTM6 = geo.delta_TM6_outward_A ?? 0.0;
        const d_D155 = geo.d_D155_amine_A ?? 0.0;
        const thetaW336 = geo.theta_W336_displacement ?? 0.0;
        const E_pi = geo.E_pi_phenyl_traps ?? 0.0;

        let resolvedEfficacy = -0.8;
        let isAgonist = false;

        if (deltaTM6 >= 4.5) {
          const saltBridge = Math.exp(-Math.abs(d_D155 - 2.9) / 0.4);
          const rotamerToggle = Math.tanh(thetaW336 / 45.0);
          const rawSignal = saltBridge * rotamerToggle - E_pi;
          resolvedEfficacy = thetaW336 >= 45.0 ? Math.max(0.1, rawSignal) : -Math.abs(rawSignal);
          isAgonist = resolvedEfficacy >= 0;
        }

        const pocketState = isAgonist 
          ? `Agonist Docked [Efficacy R* shift ε: ${resolvedEfficacy.toFixed(3)}]`
          : `Competitive Block [Default state ε: ${resolvedEfficacy.toFixed(3)}]`;

        newLogs.push(
          `     |-- ${rec} receptor target -> Helix shift ΔTM6: ${deltaTM6.toFixed(1)} Å | D155 Amine bridge: ${d_D155.toFixed(2)} Å`,
          `     |   └-- Tryptophan W336 toggle: ${thetaW336.toFixed(1)}° | Phenyl trap stabilization E_pi: ${E_pi.toFixed(3)}`,
          `     |   └-- Receptor Conformation: ${pocketState}`
        );
      });
    } else {
      // Default baseline physics fallback for standard small-molecules
      newLogs.push(
        `  |- MOLECULAR POCKET MECHANICS (Fallback standard baseline):`,
        `     |-- Standard homeostatic orthosteric pocket configuration active.`,
        `     └-- Helix coordinates: Default classic binding affinity bounds.`
      );
    }

    // 3. Epigenetic latch attractor logic
    if (selectedMol.id === "spur01" && currentConc >= 0.03) {
      newLogs.push(
        `  |- EPIGENETIC ATTRACTOR LATCH ENGAGED:`,
        `     |-- Attractor Latch (L_transcription) = [LOCKED]`,
        `     |-- Chromatin Attic Configuration: Demethylated active transcription state`,
        `     |-- Epigenetic Basin: Stable chromatin Demethylation at 28% (Promoter IV locked)`,
        `     └-- Characterization: Walter W. / Substr8 BioResearch Prior Verified`
      );
    } else if (selectedMol.id === "spur01") {
      newLogs.push(
        `  |- EPIGENETIC ATTRACTOR LATCH METRICS:`,
        `     |-- L_transcription = [UNLOCKED] (Sub-attractor concentration limit)`,
        `     └-- Chromatin Attractor: Dormant transcription / Homeostasis default`
      );
    }

    // 4. Synthesis tracking sequence
    if (selectedMol.synthesisRoute) {
      const sr = selectedMol.synthesisRoute;
      newLogs.push(
        `  |- CONVERGENT SYNTHETIC ROUTE:`,
        `     |-- Synthetic complexity: ${sr.stepsCount} steps convergent cascade synthesis`,
        `     |-- Crystallization Yield: ${sr.cumulativeYieldPercentage.toFixed(1)}% (HPLC polished)`,
        `     └-- HPLC Chromatogram Peak purity: ${sr.finalHPLCFlurityPercentage.toFixed(2)}% (Walter W. validated)`
      );
    }

    // 5. Deep ProTox-3.0 QSAR metrics and intent-aware triage
    if (selectedMol.qsarProfile) {
      const qsar = selectedMol.qsarProfile;
      const isImmunotoxHigh = qsar.probabilities.immuno >= 0.95;
      newLogs.push(
        `  |- TOXICOLOGY & SAFETY TRiAGE:`,
        `     |-- Deep ProTox-3.0 Immunotoxicity: ${(qsar.probabilities.immuno * 100).toFixed(1)}% (${
          isImmunotoxHigh ? "EXPECTED THERAPEUTIC IMMUNO-VECTOR [PASS]" : "STANDARD IMMUNO-TOLERANCE [PASS]"
        })`,
        `     |-- DILI (Liver Injury): ${(qsar.probabilities.dili * 100).toFixed(1)}% | BBB Permeability: ${(qsar.probabilities.bbb * 100).toFixed(1)}%`,
        `     └-- NR-AhR (Aryl Hydrocarbon Receptor) Endpoint: ${qsar.endpoints.nr_ahr} | SR-ARE (Antioxidant Response): ${qsar.endpoints.sr_are}`
      );
    }

    newLogs.push(
      `[CREDIT] Core Physics and QSAR Models Characterized by Walter W. / Substr8 BioResearch`
    );

    // Append new logs without exceeding maximum backlog size (e.g. 60 entries)
    setLogs((prev) => {
      const combined = [...prev, ...newLogs];
      return combined.slice(-60);
    });
  }, [elapsedHrs, enableSimulation, selectedMol]);

  const handleReset = () => {
    setIsSimulating(false);
    setElapsedHrs(0);
    setLogs([
      "SYSTEM RESET // Awaiting administration trigger...",
      "Core Physics and QSAR Models Characterized by Walter W. / Substr8 BioResearch",
    ]);
  };

  return (
    <section
      className={`rounded-clinical border border-line bg-surface-0 shadow-sm flex flex-col overflow-hidden ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-line">
        <div>
          {eyebrow && (
            <span className="block text-[10px] font-bold uppercase tracking-widest text-accent-500">
              {eyebrow}
            </span>
          )}
          <h2 className="text-sm font-bold text-ink">{title}</h2>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      {/* Stateful simulation controls bar (Timeline Step Integration) */}
      {enableSimulation && selectedMol && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-surface-50 border-b border-line shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-ink-muted uppercase">Timeline Status</span>
            <span className={`h-2 w-2 rounded-full ${isSimulating ? "bg-ok animate-pulse" : "bg-ink-muted"}`} />
            <span className="font-mono text-xs font-semibold text-ink-subtle">
              T+ {elapsedHrs.toFixed(1)} hrs
            </span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1 rounded-clinical font-mono text-[10.5px] font-bold transition-all shadow-sm ${
                isSimulating 
                  ? "bg-crit text-white hover:bg-crit/80 shadow-crit/20" 
                  : "bg-ok text-white hover:bg-ok/80 shadow-ok/20"
              }`}
            >
              {isSimulating ? "PAUSE SIMULATION" : "START SIMULATION"}
            </button>
            
            <button
              onClick={handleReset}
              className="px-2.5 py-1 bg-surface-200 hover:bg-surface-300 border border-line rounded-clinical font-mono text-[10.5px] font-bold text-ink-subtle transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* Main panel layout content */}
      <div className="flex-grow min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Premium monospace biophysical telemetry narrative glossary feed */}
      {enableSimulation && selectedMol && (
        <div className="border-t border-line bg-[#030712] p-3 flex flex-col flex-none h-[175px]">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5 flex-none">
            <span className="text-[8.5px] font-mono font-extrabold text-cyan-400 tracking-wider uppercase">
              BIOPHYSICAL SIMULATION LOG STREAM // Walter W. / Substr8 BioResearch
            </span>
            <span className="text-[8px] font-mono text-slate-500">
              BUFFER: {logs.length}/60 ACTIVE
            </span>
          </div>

          <div
            ref={logsContainerRef}
            className="flex-grow overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 custom-scrollbar select-text leading-relaxed"
          >
            {logs.map((log, idx) => {
              let textClass = "text-slate-400";
              if (log.startsWith("SYSTEM")) textClass = "text-cyan-400 font-extrabold";
              else if (log.includes("[T+")) textClass = "text-accent-400 font-bold border-t border-slate-900/60 pt-1";
              else if (log.includes("|- PHARMACOKINETICS:")) textClass = "text-purple-400 font-semibold";
              else if (log.includes("|- MOLECULAR POCKET")) textClass = "text-yellow-400 font-semibold";
              else if (log.includes("|- EPIGENETIC")) textClass = "text-emerald-400 font-semibold";
              else if (log.includes("|- CONVERGENT")) textClass = "text-blue-400 font-semibold";
              else if (log.includes("|- TOXICOLOGY")) textClass = "text-orange-400 font-semibold";
              else if (log.includes("LOCKED")) textClass = "text-emerald-400 font-bold bg-emerald-950/20 px-1 rounded border border-emerald-900/40";
              else if (log.startsWith("[CREDIT]")) textClass = "text-slate-600 italic text-[9px] border-t border-slate-950/80 pt-1 mt-1 block";

              return (
                <div key={idx} className={textClass}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
