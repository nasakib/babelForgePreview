"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
import { molecules } from "@/data/molecules";
import { useAI } from "@/context/AIContext";
import PanelHeader from "@/components/palantir/PanelHeader";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import { runDiagnosis } from "@/lib/engine/diagnosis";
import { computeStackVectors } from "@/lib/engine/stackVectors";
import type { Pathology } from "@/lib/engine/topology";
import { EMPTY_PROFILE, type PatientProfile } from "@/lib/patient/profile";
import TimeEnginePanel from "@/components/palantir/TimeEnginePanel";
import ReceptorOccupancy from "@/components/clinical/ReceptorOccupancy";

const STORAGE_KEY = "babelforge:stack-simulator:v1";

export default function StackSimulator() {
  const {
    setCurrentModule,
    setActiveStack,
    activeStack,
    setIntegrityScore,
    triggerAIAnalysis,
    viewPerspective,
    setViewPerspective,
    simulationTimeMonths,
    activePathologies,
  } = useAI();
  const [leftMinimized, setLeftMinimized] = useState(false);

  useEffect(() => {
    setCurrentModule("stack-simulator");
  }, [setCurrentModule]);

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [interventionMode, setInterventionMode] = useState<"pharma" | "vanilla" | "holistic">("holistic");
  const [selectedMolId, setSelectedMolId] = useState(molecules[0]?.id || "");
  const [startingAge, setStartingAge] = useState(35);
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  // Use activeStack from AIContext as the single source of truth for the stack.
  // We no longer need the local `stack` state variable.
  const stack = activeStack as any[];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.classFilter !== undefined) setClassFilter(parsed.classFilter);
        if (parsed.interventionMode !== undefined) setInterventionMode(parsed.interventionMode);
        if (parsed.selectedMolId !== undefined) setSelectedMolId(parsed.selectedMolId);
        if (parsed.startingAge !== undefined) setStartingAge(parsed.startingAge);
      }
      
      // Load active clinical heads-up scanner profile
      const rawProfile = localStorage.getItem("babelforge:anomaly:profile:v1");
      if (rawProfile) {
        const parsedProfile = JSON.parse(rawProfile);
        setProfile(parsedProfile);
        if (parsedProfile.demographics?.ageYears) {
          setStartingAge(parsedProfile.demographics.ageYears);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        searchQuery,
        classFilter,
        interventionMode,
        selectedMolId,
        startingAge
      }));
    } catch {
      /* ignore */
    }
  }, [searchQuery, classFilter, interventionMode, selectedMolId, startingAge, hydrated]);

  // Computed Properties
  const filteredMolecules = useMemo(() => {
    return molecules.filter((m) => {
      // Filter by intervention mode
      if (interventionMode === "pharma" && m.class === "lifestyle") return false;
      if (interventionMode === "vanilla" && m.class !== "lifestyle") return false;

      const matchClass = classFilter === "all" || m.class === classFilter;
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.classLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [searchQuery, classFilter, interventionMode]);

  const selectedMol = useMemo(() => molecules.find(m => m.id === selectedMolId), [selectedMolId]);

  // Physics Engine Calculations via runDiagnosis
  const simulationState = useMemo(() => {
    const net = computeStackVectors(stack);
    const report = runDiagnosis(
      activePathologies as Pathology[],
      net,
      {
        weightKg: profile.demographics?.weightKg ?? 70,
        toleranceMonths: 0,
        ageYears: startingAge,
        simulationTimeMonths: simulationTimeMonths,
        profile: profile,
      },
      stack
    );

    const sync = report.integrity / 100;

    return {
      net,
      label: report.label,
      desc: report.description,
      subj: report.subjective.join(" · "),
      warnings: report.warnings,
      sync,
      correctionConvergence: report.correctionConvergence,
      holisticSynergyBonus: report.holisticSynergyBonus,
      activeCorrections: report.activeCorrections,
      occupancies: report.occupancies,
    };
  }, [stack, activePathologies, startingAge, simulationTimeMonths, profile]);

  useEffect(() => {
    setIntegrityScore(Math.round(simulationState.sync * 100));
  }, [simulationState.sync, setIntegrityScore]);

  // Actions
  const addToStack = () => {
    if (stack.length >= 10) {
      alert("Maximum stack size (10) reached.");
      return;
    }
    if (selectedMol && !stack.find(m => m.id === selectedMol.id)) {
      setActiveStack([...stack, { ...selectedMol, currentIntensity: 2, toleranceMonths: 0 }]);
    }
  };

  const removeFromStack = (id: string) => {
    setActiveStack(stack.filter(m => m.id !== id));
  };

  const updateMolAttr = (id: string, key: string, value: number) => {
    setActiveStack(stack.map(m => m.id === id ? { ...m, [key]: value } : m));
  };

  return (
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0">
        <NeuroCanvas activeStack={stack} vectors={simulationState.net} />

        {/* Overlay Info (Centered/Top) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent-500/100 animate-pulse"></div>
            <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">React Three Fiber Engine</span>
          </div>
          <h4 className="text-xl font-bold text-ink font-semibold">{simulationState.label}</h4>
          <p className="text-xs text-ink-subtle mt-1 max-w-sm leading-relaxed drop-shadow">{simulationState.desc}</p>
          <div className="mt-2 pt-2 border-t border-accent-500/30 max-w-sm">
              <span className="text-[9px] uppercase font-bold text-crit block mb-1">Projected Subjective Experience (SEE)</span>
              <p className="text-xs text-ink-subtle italic leading-relaxed drop-shadow">{simulationState.subj}</p>
          </div>
          {simulationState.warnings && simulationState.warnings.length > 0 && (
            <div className="mt-2 pt-2 border-t border-crit/30 max-w-sm">
              <span className="text-[9px] uppercase font-bold text-crit block mb-1">Clinical Warnings</span>
              {simulationState.warnings.map((w, idx) => (
                <p key={idx} className="text-[10px] text-crit font-semibold leading-normal drop-shadow">{w}</p>
              ))}
            </div>
          )}
        </div>

        {/* View Controls (Bottom Center) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-10 flex justify-center">
          <div className="p-4 bg-surface-50/80 border border-line-strong rounded-clinical backdrop-blur-xl shadow-2xl flex flex-col gap-3 min-w-[280px] text-center">
            <div className="text-[9px] uppercase font-bold text-accent-400 mb-1 tracking-widest">Connectome Restoration Index</div>
            
            <div className="flex justify-between items-end mb-1 px-1">
                <span className="text-xs font-bold text-ink-muted">Order (r)</span>
                <span className="text-lg text-ok font-mono font-bold">{simulationState.sync.toFixed(2)}</span>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-1 mt-1 overflow-hidden">
                <div className="h-full bg-ok transition-all duration-300" style={{width: `${simulationState.sync * 100}%`}}></div>
            </div>

            <div className="flex justify-between items-end mb-1 px-1 mt-2">
                <span className="text-xs font-bold text-ink-muted">Convergence</span>
                <span className="text-lg text-clinical-400 font-mono font-bold">{simulationState.correctionConvergence}%</span>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-1 mt-1 overflow-hidden border border-line/10">
                <div className="h-full bg-gradient-to-r from-clinical-500 to-accent-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{width: `${simulationState.correctionConvergence}%`}}></div>
            </div>

            {simulationState.holisticSynergyBonus > 1.0 && (
              <div className="text-[9px] font-bold text-accent-400 uppercase tracking-widest bg-accent-500/10 py-1.5 rounded border border-accent-500/20 animate-pulse mt-1">
                ✨ {simulationState.holisticSynergyBonus.toFixed(2)}x Synergy Engaged
              </div>
            )}

            <button onClick={() => triggerAIAnalysis("Analyze the pharmacological interactions and holistic synergies in my current stack.")} className="mt-2 w-full bg-accent-500/80 hover:bg-accent-500/100 text-ink text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-all border border-accent-400/50 backdrop-blur-md shadow-lg flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Ask babelAI
            </button>
          </div>
        </div>
      </div>

      {/* Left Sidebar: Stack Builder -> Now Draggable */}
      <DraggablePanel
        id="stack-builder"
        title="Intervention Builder"
        subtitle="Simulate interventions and regimens"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 380, height: 600 }}
      >
        <div className="clinical-card p-4 flex-none border-b border-line bg-surface-50">
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-surface-100 rounded-clinical">
              {(["holistic", "pharma", "vanilla"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setInterventionMode(m)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors ${interventionMode === m ? 'bg-surface-0 text-accent-400 shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                >
                  {m === "vanilla" ? "Lifestyle" : m}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-ink-muted block mb-2 tracking-widest">Search</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type to search..." className="w-full bg-surface-0 border border-line text-sm font-semibold text-ink-subtle rounded-clinical p-2.5 focus:outline-none focus:border-accent-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-ink-muted block mb-2 tracking-widest">Category Filter</label>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full bg-surface-0 border border-line text-sm font-semibold text-ink-subtle rounded-clinical p-2.5 focus:outline-none focus:border-accent-500">
                <option value="all">All Classes</option>
                {interventionMode !== "pharma" && <option value="lifestyle">Lifestyle / Physical</option>}
                {interventionMode !== "vanilla" && (
                  <>
                    <option value="novel">Novel Therapeutics (Precision)</option>
                    <option value="corrective">Corrective Molecules</option>
                    <option value="ssri">SSRIs / SNRIs</option>
                    <option value="stimulant">Stimulants (Amphetamines)</option>
                    <option value="antipsychotic">Antipsychotics</option>
                    <option value="cannabinoid">Cannabinoids</option>
                    <option value="depressant">Depressants / Benzos</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Starting Age</span>
                <span className="font-mono text-xs text-ink font-semibold">{startingAge} <span className="text-ink-muted text-[10px]">Yrs</span></span>
              </div>
              <input
                type="range"
                className="slider-clinical w-full"
                min="18"
                max="100"
                step="1"
                value={startingAge}
                onChange={(e) => setStartingAge(parseInt(e.target.value))}
                style={{ accentColor: '#a855f7' }}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-ink-muted block mb-2 tracking-widest">Select Intervention</label>
              <select value={selectedMolId} onChange={(e) => setSelectedMolId(e.target.value)} className="w-full bg-surface-0 border border-line text-sm font-semibold text-ink-subtle rounded-clinical p-2.5 focus:outline-none focus:border-accent-500">
                {filteredMolecules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <button onClick={addToStack} className="w-full btn-primary text-ink text-xs font-bold uppercase tracking-widest py-3 rounded-clinical transition-colors shadow-md shadow-accent-500/20">
                + Add to Stack
            </button>
          </div>
        </div>

        <div className="clinical-card p-4 flex-grow flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-none">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-ink uppercase tracking-widest">Active Stack</h3>
                <span className="bg-surface-100 text-ink-muted text-[10px] font-bold px-2 py-0.5 rounded-full">{stack.length}/10</span>
              </div>
              {stack.length > 0 && (
                <button onClick={() => setActiveStack([])} className="text-[10px] font-bold text-ink-muted hover:text-crit uppercase tracking-widest transition-colors">
                  Clear
                </button>
              )}
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {stack.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <p className="text-xs font-medium text-ink-muted">Stack is empty.</p>
              </div>
            ) : (
              stack.map(mol => {
                const isCorrective = mol.class === 'corrective';
                const isBabel = mol.isBabelForge;
                const isBlue = mol.isBlue;
                const isNovel = mol.class === 'novel' && !isBabel && !isBlue;
                const isPurpleAccent = isBabel || isCorrective;

                const colorClass = isPurpleAccent ? 'text-accent-400' : ((isBlue || isNovel) ? 'text-clinical-400' : 'text-ink-subtle');
                const bgClass = isPurpleAccent ? 'bg-accent-500/10 border-accent-500/30' : ((isBlue || isNovel) ? 'bg-clinical-500/10 border-clinical-500/30' : 'bg-surface-50 border-line');
                // Use CSS accent-color (static -> not purged by Tailwind)
                const accentHex = isPurpleAccent ? '#a855f7' : ((isBlue || isNovel) ? '#3b82f6' : '#6366f1');
                const badge = isBabel ? (
                  <span className="bg-accent-500/20 text-accent-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded ml-2 align-middle border border-accent-500/30">babelForge</span>
                ) : (isCorrective ? (
                  <span className="bg-accent-500/20 text-accent-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded ml-2 align-middle border border-accent-500/30">corrective</span>
                ) : null);

                return (
                  <div key={mol.id} className={`stack-item flex flex-col p-3 rounded-clinical border ${bgClass} shadow-sm gap-2`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-none opacity-80 ${colorClass}`} dangerouslySetInnerHTML={{ __html: mol.svg }} />
                            <div>
                                <h4 className="font-bold text-xs text-ink">{mol.name}</h4>
                                <p className={`text-[9px] uppercase tracking-widest font-bold ${colorClass}`}>{mol.classLabel}{badge}</p>
                            </div>
                        </div>
                        <button onClick={() => removeFromStack(mol.id)} aria-label="Remove" className="text-ink-muted hover:text-crit p-1 self-start">
                            ✕
                        </button>
                    </div>
                    <div className="flex flex-col gap-2 w-full px-1 mt-1 border-t border-line pt-2">
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[9px] font-bold text-ink-muted uppercase w-12">Dose</span>
                            <input type="range" min="0" max="3" step="1" value={mol.currentIntensity} onChange={(e) => updateMolAttr(mol.id, 'currentIntensity', parseInt(e.target.value))} style={{ accentColor: accentHex }} className="flex-grow h-1.5 bg-surface-200 rounded-clinical appearance-none cursor-pointer" />
                            <span className="text-[10px] font-mono font-bold text-ink-subtle w-8 text-right">{['0', '1', '2', '3'][mol.currentIntensity]}</span>
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[9px] font-bold text-ink-muted uppercase w-12">Tol (Mo)</span>
                            <input type="range" min="0" max="120" step="1" value={mol.toleranceMonths} onChange={(e) => updateMolAttr(mol.id, 'toleranceMonths', parseInt(e.target.value))} style={{ accentColor: accentHex, opacity: 0.8 }} className="flex-grow h-1 bg-surface-200 rounded-clinical appearance-none cursor-pointer" />
                            <span className="text-[10px] font-mono font-bold text-ink-subtle w-8 text-right">{mol.toleranceMonths}</span>
                        </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-line flex-none">
              <div className="text-[9px] uppercase font-bold text-ink-muted mb-3 tracking-widest">Net Pharmacological Vectors</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between bg-surface-0 p-2 rounded"><span className="text-ink-muted">Arousal</span><span className="font-bold text-ink">{(simulationState.net.arousal > 0 ? '+' : '') + simulationState.net.arousal.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-surface-0 p-2 rounded"><span className="text-ink-muted">Dampening</span><span className="font-bold text-ink">{(simulationState.net.dampening > 0 ? '+' : '') + simulationState.net.dampening.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-surface-0 p-2 rounded"><span className="text-ink-muted">Chaos</span><span className="font-bold text-ink">{(simulationState.net.chaos > 0 ? '+' : '') + simulationState.net.chaos.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-surface-0 p-2 rounded"><span className="text-ink-muted">Repair</span><span className="font-bold text-ink">{(simulationState.net.repair > 0 ? '+' : '') + simulationState.net.repair.toFixed(1)}</span></div>
              </div>
          </div>
        </div>
      </DraggablePanel>

      {stack.length > 0 && (
        <DraggablePanel
          id="receptor-occupancy-panel"
          title="Receptor Occupancy"
          subtitle="Competitive PD Binding"
          defaultPosition={{ x: 420, y: 20 }}
          defaultSize={{ width: 360, height: 500 }}
        >
          <div className="p-4 h-full overflow-y-auto custom-scrollbar">
            <ReceptorOccupancy occupancyData={simulationState.occupancies} />
          </div>
        </DraggablePanel>
      )}

      <TimeEnginePanel />
    </div>
  );
}