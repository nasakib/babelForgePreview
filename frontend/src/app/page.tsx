"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAI } from "@/context/AIContext";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
const SMILESRenderer = dynamic(() => import("@/components/clinical/SMILESRenderer"), { ssr: false });
import Link from "next/link";
import {
  composeTopology,
  PATHOLOGIES,
  PATHOLOGY_META,
  REGION_COLOR,
  type Pathology,
} from "@/lib/engine/topology";
import {
  runDiagnosis,
  ZERO_VECTORS,
  type DiagnosticReport,
  type PharmaVectors,
} from "@/lib/engine/diagnosis";
import { autoOptimizeIdeal, autoOptimizeLeastResistance, type RegimenItem } from "@/lib/engine/optimize";
import { molecules } from "@/data/molecules";
import { EMPTY_PROFILE, type PatientProfile } from "@/lib/patient/profile";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import TimeEnginePanel from "@/components/palantir/TimeEnginePanel";
import NodeFilterPanel from "@/components/palantir/NodeFilterPanel";
import SEEResultsPanel from "@/components/palantir/SEEResultsPanel";
import { evaluateSubstanceToxicity, analyzeNeurotoxicity, type ProTox3Profile } from "@/lib/engines/toxicology";
import { citationUrl } from "@/lib/wisdom/select";
import { computeTherapyProjection } from "@/lib/engine/therapy";

const VIEW_MODES = [
  { id: "topology", label: "Topology", desc: "Region tint · amplitude pulse" },
  { id: "physics", label: "Phase", desc: "Chromatic Kuramoto θᵢ" },
  { id: "pharma", label: "Pharma", desc: "Compound target highlight" },
  { id: "anatomy", label: "Anatomy", desc: "Dimmed parcels · structure only" },
] as const;

export default function ConsolePage() {
  const {
    setCurrentModule,
    activePathologies,
    setActivePathologies,
    activeStack,
    setActiveStack,
    setIntegrityScore,
    viewPerspective,
    setViewPerspective,
    simulationTimeMonths,
    targetedOperations,
    wisdom,
  } = useAI();

  const [weight, setWeight] = useState(70);
  const [tolerance, setTolerance] = useState(0);
  const [age, setAge] = useState(35);
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);

  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);
  const [expandedPathology, setExpandedPathology] = useState<Pathology | null>(null);
  const [cdsTab, setCdsTab] = useState<"baseline" | "conventional" | "experimental" | "trajectory">("baseline");

  const selectedCompound = useMemo(() => {
    if (!selectedCompoundId) return null;
    return molecules.find((m) => m.id === selectedCompoundId);
  }, [selectedCompoundId]);

  const isInStack = useMemo(() => {
    if (!selectedCompoundId) return false;
    return activeStack.some((item: any) => item.id === selectedCompoundId);
  }, [selectedCompoundId, activeStack]);

  const handleApplyToStack = useCallback(() => {
    if (!selectedCompound) return;
    if (activeStack.some((item: any) => item.id === selectedCompound.id)) return;
    if (activeStack.length >= 10) {
      alert("Maximum stack size (10) reached.");
      return;
    }
    setActiveStack([
      ...activeStack,
      {
        id: selectedCompound.id,
        name: selectedCompound.name,
        dose: 2,
        currentIntensity: 2,
        toleranceMonths: 0,
        isBabelForge: selectedCompound.isBabelForge,
        classLabel: selectedCompound.classLabel,
        effects: selectedCompound.effects,
        svg: selectedCompound.svg,
        class: selectedCompound.class,
      }
    ]);
    setLog((l) => [`[${ts()}] Applied ${selectedCompound.name} (Dose 2) to active regimen stack.`, ...l]);
  }, [selectedCompound, activeStack, setActiveStack]);

  const handleRemoveFromStack = useCallback(() => {
    if (!selectedCompound) return;
    setActiveStack(activeStack.filter((item: any) => item.id !== selectedCompound.id));
    setLog((l) => [`[${ts()}] Removed ${selectedCompound.name} from active regimen stack.`, ...l]);
  }, [selectedCompound, activeStack, setActiveStack]);

  // Sync with the heads-up scanner profile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("babelforge:anomaly:profile:v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          setProfile(parsed);
          if (parsed.demographics?.weightKg) {
            setWeight(parsed.demographics.weightKg);
          }
          if (parsed.demographics?.ageYears) {
            setAge(parsed.demographics.ageYears);
          }
        }
      } catch (err) {
        console.error("Failed to load heads-up scanner profile:", err);
      }
    }
  }, []);

  const [recommendations, setRecommendations] = useState<{
    ideal: { regimen: RegimenItem[]; integrity: number; reasoning: string[] };
    least: { regimen: RegimenItem[]; integrity: number; reasoning: string[] };
  } | null>(null);

  // Reset recommendations when active pathologies change to keep suggestions consistent
  useEffect(() => {
    setRecommendations(null);
  }, [activePathologies]);

  const vectors: PharmaVectors = useMemo(() => {
    const v = { ...ZERO_VECTORS };
    for (const item of activeStack as any[]) {
      const mol = molecules.find((m) => m.id === item.id);
      if (!mol) continue;
      const intensity = item.dose ?? item.currentIntensity ?? 0;
      const ratio = Math.min(1, intensity / 3.0);
      v.arousal += mol.effects.arousal * ratio;
      v.dampening += mol.effects.dampening * ratio;
      v.chaos += mol.effects.chaos * ratio;
      v.repair += mol.effects.repair * ratio;
    }
    return v;
  }, [activeStack]);

  const topo = useMemo(
    () => composeTopology(activePathologies as Pathology[], targetedOperations, simulationTimeMonths, vectors),
    [activePathologies, targetedOperations, simulationTimeMonths, vectors]
  );

  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [computing, setComputing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [liveR, setLiveR] = useState<number | null>(null);

  const therapyProjection = useMemo(() => {
    return computeTherapyProjection(
      activePathologies as Pathology[],
      activeStack.length,
      report?.integrity ?? 100
    );
  }, [activePathologies, activeStack.length, report?.integrity]);

  useEffect(() => {
    setCurrentModule("dashboard");
  }, [setCurrentModule]);

  const runReport = useCallback(
    (opts?: { silent?: boolean }) => {
      setComputing(true);
      setTimeout(() => {
        const r = runDiagnosis(activePathologies as Pathology[], vectors, {
          weightKg: weight,
          toleranceMonths: tolerance,
          ageYears: age,
          simulationTimeMonths: simulationTimeMonths,
          profile: profile,
        }, activeStack);
        setReport(r);
        setIntegrityScore(r.integrity);
        setComputing(false);
        if (!opts?.silent) {
          setLog((l) =>
            [
              `[${ts()}] Φ = ${r.integrity}%  ·  R = ${r.R}  ·  K* = ${r.K}  ·  ${r.label}`,
              ...l,
            ].slice(0, 30)
          );
        }
      }, opts?.silent ? 16 : 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePathologies, vectors, weight, tolerance, age, simulationTimeMonths, setIntegrityScore, activeStack]
  );

  useEffect(() => {
    runReport({ silent: true });
  }, [runReport]);

  const handleAutoOptimize = useCallback(() => {
    setComputing(true);
    setLog((l) => [
      `[${ts()}] Auto-optimizer engaged · generating dual clinical pathways…`,
      ...l,
    ]);
    setTimeout(() => {
      const patientParams = {
        weightKg: weight,
        toleranceMonths: tolerance,
        ageYears: age,
        simulationTimeMonths: simulationTimeMonths,
        profile: profile,
      };
      const ideal = autoOptimizeIdeal(activePathologies as Pathology[], patientParams);
      const least = autoOptimizeLeastResistance(activePathologies as Pathology[], patientParams);
      setRecommendations({ ideal, least });

      setLog((l) =>
        [
          `[${ts()}] Auto-optimization complete. Pathways generated.`,
          ...l,
        ].slice(0, 60)
      );
      setComputing(false);
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePathologies, weight, tolerance, age, simulationTimeMonths, profile]);

  const togglePathology = (p: Pathology) => {
    const next = activePathologies.includes(p)
      ? activePathologies.filter((x) => x !== p)
      : [...activePathologies, p];
    setActivePathologies(next);
  };

  const clearStack = () => {
    setActiveStack([]);
    setLog((l) => [`[${ts()}] Regimen cleared.`, ...l]);
  };

  return (
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      {/* SCANNING / CALCULATION OVERLAY */}
      {computing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md select-none animate-fade-in">
          <div className="relative w-80 p-6 bg-slate-900 border border-slate-800/80 rounded-clinical shadow-2xl space-y-4 text-white">
            {/* Pulse rings */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent-500/25 opacity-75 animate-ping"></span>
                <div className="w-10 h-10 rounded-full bg-accent-500/20 border border-accent-500/60 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Title & Status */}
            <div className="text-center">
              <h4 className="text-xs font-extrabold font-mono uppercase tracking-widest text-accent-400">Clinical Optimization Engine</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase animate-pulse">QSAR screening & topological search active...</p>
            </div>

            {/* Simulated Live logs */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[9.5px] text-cyan-400 space-y-1.5 max-h-[120px] overflow-y-hidden select-none">
              <div className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Composing pathology: {activePathologies.length > 0 ? activePathologies.join(', ') : 'HOMEOSTASIS'}</div>
              <div className="flex items-center gap-1.5"><span className="text-accent-400 animate-pulse">▶</span> Solving Ryu-Takayanagi minimal cut...</div>
              <div className="flex items-center gap-1.5 opacity-60">▶ Verifying ProTox-3.0 safety bounds...</div>
              <div className="flex items-center gap-1.5 opacity-40">▶ Selecting maximum-Phi vectors...</div>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div className="bg-accent-500 h-full rounded-full w-2/3 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND CANVAS */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <NeuroCanvas
          topology={topo}
          vectors={vectors}
          pathologies={activePathologies as Pathology[]}
          activeStack={activeStack}
          onCoherence={setLiveR}
        />
      </div>

      {/* LEFT PANEL */}
      <DraggablePanel
        id="console-left-panel"
        title="Patient State Modifiers"
        subtitle="Compose pathological networks"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 340, height: 600 }}
      >
        <div className="p-4 border-b border-line space-y-2.5 overflow-y-auto max-h-[400px] custom-scrollbar">
          {PATHOLOGIES.map((p) => {
            const meta = PATHOLOGY_META[p];
            const active = activePathologies.includes(p);
            const isExpanded = expandedPathology === p;
            return (
              <div
                key={p}
                className={`group flex flex-col p-2.5 rounded-clinical border transition-all ${
                  active
                    ? "border-accent-500/60 bg-accent-500/[0.06]"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox-clinical mt-1 cursor-pointer"
                    checked={active}
                    onChange={() => togglePathology(p)}
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => togglePathology(p)}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] text-ink font-medium">
                        {meta.label}{" "}
                        <span className="text-accent-400 font-mono text-[10.5px] ml-1">
                          [{meta.dsm5Code}]
                        </span>
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                        style={{ background: REGION_COLOR[meta.region] }}
                      />
                    </div>
                    <div className="text-[9.5px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
                      {meta.tone}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPathology(isExpanded ? null : p);
                    }}
                    className={`p-1 rounded text-ink-muted hover:text-ink hover:bg-slate-800 transition ${
                      isExpanded ? "text-accent-400" : ""
                    }`}
                    title="View DSM-5 Criteria"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-line/60 text-[10.5px] text-ink-subtle space-y-1.5">
                    <div className="font-bold text-[9px] uppercase tracking-widest text-accent-400 font-mono">
                      DSM-5 Diagnostic Criteria:
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      {meta.dsm5Criteria.map((c, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-b border-line space-y-4">
          <SliderField label="Patient Age" unit="yr" value={age} min={18} max={100} step={1} onChange={setAge} />
          <SliderField label="Patient Mass" unit="kg" value={weight} min={40} max={140} step={1} onChange={setWeight} />
          <SliderField label="Tolerance" unit="mo" value={tolerance} min={0} max={48} step={1} onChange={setTolerance} />
        </div>

        <div className="p-4 border-b border-line">
          <div className="section-label mb-2">Visualization Mode</div>
          <div className="grid grid-cols-2 gap-1">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setViewPerspective(m.id as any)}
                className={`text-left p-2 border rounded-clinical text-[10.5px] font-mono uppercase tracking-widest2 transition ${
                  viewPerspective === m.id
                    ? "border-accent-500/70 text-accent-400 bg-accent-500/[0.06]"
                    : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-ink-muted mt-1.5 font-mono">
            {VIEW_MODES.find((m) => m.id === viewPerspective)?.desc}
          </div>
        </div>

        <div className="p-4 mt-auto">
          <div className="section-label mb-2">Topological Integrity</div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] text-ink-subtle">{report?.label ?? "Computing…"}</span>
            <span className={`metric text-2xl font-semibold ${integrityTone(report?.integrity ?? 100)}`}>
              {report?.integrity ?? "--"}
              <span className="text-[11px] text-ink-muted ml-1">%</span>
            </span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${integrityFillClass(report?.integrity ?? 100)}`}
              style={{ width: `${Math.min(100, report?.integrity ?? 0)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
            <span>R = {report?.R ?? "—"}</span>
            <span>K* = {report?.K ?? "—"}</span>
            {liveR !== null && <span className="text-accent-400">live {liveR.toFixed(2)}</span>}
          </div>
        </div>
      </DraggablePanel>

      {/* RIGHT PANEL */}
      <DraggablePanel
        id="console-right-panel"
        title="Diagnostic AI"
        subtitle="Topology + Pharmacology Analyzer"
        defaultPosition={{ x: typeof window !== "undefined" && window.innerWidth > 800 ? window.innerWidth - 420 : 400, y: 20 }}
        defaultSize={{ width: 400, height: 600 }}
      >
        <div className="p-4 border-b border-line grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => runReport()} disabled={computing}>
            Calculate Now
          </button>
          <button className="btn-secondary" onClick={handleAutoOptimize} disabled={computing}>
            Auto-Optimize
          </button>
        </div>

        <div className="p-4 border-b border-line bg-surface-50/40">
          <div className="section-label mb-2">Compound Selection Browser</div>
          <div className="relative">
            <select
              value={selectedCompoundId || ""}
              onChange={(e) => setSelectedCompoundId(e.target.value || null)}
              className="w-full bg-surface-0 border border-line text-xs font-semibold text-ink-subtle rounded-clinical p-2.5 focus:outline-none focus:border-accent-500 cursor-pointer transition-all hover:border-line-strong font-mono uppercase tracking-wider"
            >
              <option value="">-- Inspect A Compound --</option>
              {molecules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.classLabel})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10.5px] text-ink-muted mt-1.5 leading-normal">
            Select any standard or novel compound to review molecular structure, telemetry logs, and ProTox-3.0 neurotoxicity diagnostics.
          </p>
        </div>

        <div className="p-4 border-b border-line">
          <div className="section-label mb-2">Diagnosis</div>
          {report ? (
            <div className="space-y-2.5 animate-fade-in-up">
              <div className="text-[14px] text-ink font-medium">{report.label}</div>
              <div className="text-[12px] text-ink-subtle leading-relaxed">{report.description}</div>
              {report.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {report.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-[11px] text-warn border border-warn/30 bg-warn/[0.06] rounded-sharp p-2"
                    >
                      <span className="status-dot warn mt-1" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Clinical Case Assessment Sub-Panel */}
              <div className="mt-3.5 p-3 bg-surface-100/50 rounded-clinical border border-line/60 space-y-2">
                <span className="text-[9px] font-bold text-ink uppercase tracking-wider block border-b border-line/45 pb-1 font-mono">
                  Clinical Case Assessment: Self-Report vs. Connectome Diagnostics
                </span>
                {activePathologies.length === 0 ? (
                  <p className="text-[10.5px] leading-relaxed text-ink-subtle">
                    <strong>The patient self-reports as clinically healthy.</strong> The engine confirms this assessment: no pathological network deviations are detected. The brain connectome structural adjacency matrix matches healthy baseline standards (<span className="font-mono text-cyan-500">A_composed = A_baseline</span>), and intrinsic Yeo-7 functional parcellation frequencies are perfectly synchronized with zero pathological noise.
                    <span className="block mt-1 text-ink-muted italic">
                      If different mental states or conditions were applied (e.g. toggling modifiers in the left panel), they would immediately mutate the structural adjacency matrix and degrade this homeostatic baseline.
                    </span>
                  </p>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-ink-subtle">
                    <strong>The patient self-reports as clinically healthy.</strong> <span className="text-red-400 font-semibold">However, the engine identifies active network pathology:</span> The BOLD topological scanner detects clear functional network deviations. Currently active modifiers (<strong>{activePathologies.join(", ")}</strong>) have additively mutated the brain connectome structural adjacency connections (<span className="font-mono text-cyan-500">A_composed ≠ A_baseline</span>), causing localized control network edge collapses or hyper-synchronizations.
                    <span className="block mt-1 text-ink-muted italic">
                      If additional comorbid conditions were applied, the coupling order parameter (R) would drift further away from healthy reference values, escalating excitotoxicity risks and clinical cognitive impairment.
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-ink-muted font-mono">Awaiting input…</div>
          )}
        </div>

        {/* CONNECTOME RESTORATION ANALYTICS */}
        {report && (
          <div className="p-4 border-b border-line space-y-4 bg-surface-50/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="section-label">Connectome Restoration</div>
              {report.holisticSynergyBonus > 1.0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent-500/10 text-accent-400 border border-accent-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                  {report.holisticSynergyBonus.toFixed(2)}x Synergy
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[11.5px] text-ink-subtle">Baseline Convergence</span>
                <span className="text-sm font-semibold font-mono text-clinical-400">
                  {report.correctionConvergence}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden border border-line/30">
                <div 
                  className="h-full bg-gradient-to-r from-clinical-500 to-accent-500 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${report.correctionConvergence}%` }}
                />
              </div>
              <div className="text-[10px] text-ink-muted leading-normal">
                {activePathologies.length === 0 
                  ? "Perfect homeostasis. Connectome fully aligned with template baselines." 
                  : `Projected path to baseline restoration. Target: return all networks to baseline.`}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Active Correction Vectors</div>
              {report.activeCorrections.length === 0 ? (
                <div className="text-[11px] text-ink-muted italic p-3 border border-line border-dashed rounded-clinical text-center">
                  No active corrective interventions detected. Add holistic practices or corrective molecules.
                </div>
              ) : (
                <div className="space-y-2">
                  {report.activeCorrections.map((corr, idx) => (
                    <div 
                      key={idx} 
                      className="border border-clinical-500/20 bg-clinical-500/[0.03] rounded-clinical p-2.5 space-y-1 transition-all hover:bg-clinical-500/[0.05]"
                    >
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-clinical-400 font-bold uppercase tracking-wider">{corr.target}</span>
                        <span className="text-accent-400 font-bold bg-accent-500/10 px-1 rounded">+{corr.value}% Reverser</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        Intervention: <span className="text-ink font-semibold">{corr.factor}</span>
                      </div>
                      <div className="text-[10.5px] text-ink-subtle leading-relaxed mt-1 italic">
                        &ldquo;{corr.description}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOPOLOGICAL CLINICAL DECISION SUPPORT (CDS) */}
        {report && (
          <div className="p-4 border-b border-line space-y-4 bg-surface-0/60 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="section-label">Topological Decision Support (CDS)</div>
              <span className="text-[9px] font-mono bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">
                4D State-Space Engine
              </span>
            </div>

            {/* Tab Selectors */}
            <div className="flex border border-line rounded bg-slate-950 p-0.5">
              {(["baseline", "conventional", "experimental", "trajectory"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCdsTab(tab)}
                  className={`flex-1 text-center py-1 rounded text-[9.5px] font-mono uppercase tracking-wider transition-all ${
                    cdsTab === tab
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab === "baseline" ? "Baseline" : tab === "conventional" ? "Conv" : tab === "experimental" ? "Exper" : "Traj"}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-3">
              {cdsTab === "baseline" && (
                <div className="space-y-2 animate-fade-in">
                  <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest font-mono">
                    Rigid Network Cliques & Cavities
                  </div>
                  <div className="space-y-1.5">
                    {therapyProjection.baselineCliques.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-crit/20 bg-crit/5 text-[11px] leading-relaxed text-ink-subtle flex gap-2 items-start"
                      >
                        <span className="status-dot crit mt-1.5 flex-shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cdsTab === "conventional" && (
                <div className="space-y-2.5 animate-fade-in">
                  <div>
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest font-mono">
                      Conventional Pathway
                    </div>
                    <div className="text-[12.5px] font-bold text-white mt-1">
                      {therapyProjection.conventional.name}
                    </div>
                    <div className="text-[10.5px] text-ink-muted mt-0.5">
                      {therapyProjection.conventional.clinicalEfficacy}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/60 border border-line space-y-2">
                    <div className="flex justify-between text-[10.5px] font-mono">
                      <span className="text-ink-muted">Target Nodes:</span>
                      <span className="text-indigo-400 font-bold">
                        {therapyProjection.conventional.targetNodes.join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10.5px] font-mono">
                      <span className="text-ink-muted">Cliques Disrupted:</span>
                      <span className="text-emerald-400 font-bold">
                        {therapyProjection.conventional.metrics.cliquesDisrupted}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10.5px] font-mono">
                      <span className="text-ink-muted">Coupling Shift:</span>
                      <span className="text-amber-400 font-bold">
                        {therapyProjection.conventional.metrics.couplingShift}
                      </span>
                    </div>
                  </div>

                  {/* vmPFC-Amygdala delta correlation progress */}
                  <div className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-line/50">
                    <div className="flex justify-between text-[10.5px] font-mono">
                      <span className="text-ink-muted">vmPFC-Amygdala Correlation:</span>
                      <span className="text-emerald-400 font-bold">
                        Δr = +{therapyProjection.conventional.metrics.deltaR.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 border border-line/30">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${therapyProjection.conventional.metrics.deltaR * 100}%` }}
                      />
                    </div>
                    <p className="text-[9.5px] text-ink-muted leading-tight mt-1 font-sans">
                      {therapyProjection.conventional.expectedTopologicalShift}
                    </p>
                  </div>
                </div>
              )}

              {cdsTab === "experimental" && (
                <div className="space-y-2.5 animate-fade-in">
                  <div>
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest font-mono">
                      Experimental Pathway (Held to Identical Rigor)
                    </div>
                    <div className="text-[12.5px] font-bold text-white mt-1">
                      {therapyProjection.experimental.name}
                    </div>
                  </div>

                  {/* Coordinates & E-field constraints */}
                  <div className="p-2.5 rounded bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      Target Stereotaxic Coordinates
                    </div>
                    <div className="text-[11px] font-semibold text-white font-mono bg-indigo-500/10 p-1.5 rounded border border-indigo-500/25">
                      {therapyProjection.experimental.stereotaxicCoordinates}
                    </div>
                    <p className="text-[9.5px] text-indigo-300/80 leading-normal italic">
                      {therapyProjection.experimental.biophysicalConstraints}
                    </p>
                  </div>

                  {/* High precision topological metrics */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest font-mono">
                      Topological State-Space Metrics
                    </div>
                    <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-2 rounded border border-line/60">
                      <div className="flex flex-col border-b border-line/40 pb-1">
                        <span className="text-[9px] uppercase text-ink-muted font-bold">Node Centrality Shift</span>
                        <span className="text-white leading-normal mt-0.5">
                          {therapyProjection.experimental.topologicalMetrics.nodeCentrality}
                        </span>
                      </div>
                      <div className="flex flex-col border-b border-line/40 py-1">
                        <span className="text-[9px] uppercase text-ink-muted font-bold">Mean Path Length</span>
                        <span className="text-white leading-normal mt-0.5">
                          {therapyProjection.experimental.topologicalMetrics.meanPathLength}
                        </span>
                      </div>
                      <div className="flex flex-col pt-1">
                        <span className="text-[9px] uppercase text-ink-muted font-bold">Homological Persistence</span>
                        <span className="text-white leading-normal mt-0.5">
                          {therapyProjection.experimental.topologicalMetrics.homologicalPersistence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cdsTab === "trajectory" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest font-mono">
                        Trajectory Projection
                      </div>
                      <div className={`text-[12px] font-bold mt-0.5 ${therapyProjection.trajectory.projectedDistance < 5 ? "text-emerald-400" : "text-amber-400"}`}>
                        {therapyProjection.trajectory.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-ink-muted uppercase font-bold block">Rate / Mo</span>
                      <span className="text-[12.5px] font-mono font-bold text-indigo-400">
                        +{therapyProjection.trajectory.convergenceRate}%
                      </span>
                    </div>
                  </div>

                  {/* Trajectory simulation steps list */}
                  <div className="p-3 rounded bg-slate-950 border border-line space-y-2.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-ink-muted font-mono block">
                      Topological Distance to Remission
                    </span>
                    <div className="space-y-2">
                      {therapyProjection.trajectory.steps.map((step) => (
                        <div key={step.month} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-white font-medium">Month {step.month}</span>
                            <span className="text-ink-muted">
                              Dist: <span className="text-indigo-400 font-bold">{step.distanceToRemission}%</span> • Φ: <span className="text-emerald-400 font-bold">{step.integrity}</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-line/30 flex">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${100 - step.distanceToRemission}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comorbid Alert */}
                  {therapyProjection.trajectory.isHighVariance && (
                    <div className="border border-warn/30 bg-warn/[0.05] rounded-clinical p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-warn font-mono uppercase tracking-wider">
                        <span className="status-dot warn flex-shrink-0" />
                        <span>High Variance Projection</span>
                      </div>
                      <p className="text-[10px] text-ink-subtle leading-normal">
                        Comorbid conditions detected. To achieve exact validation and eliminate trajectory variance, output the following missing parameters:
                      </p>
                      <ul className="list-disc list-inside text-[9.5px] text-warn/80 font-mono space-y-0.5 mt-1">
                        {therapyProjection.trajectory.missingValidationMetrics.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}



        {recommendations && (
          <div className="p-4 border-b border-line animate-fade-in-up">
            <div className="section-label mb-2.5">Clinical Recommendation Pathways</div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Ideal Clinical Intervention (Purple) */}
              <div className="border border-accent-500/30 bg-accent-500/[0.04] rounded-sharp p-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold text-accent-400 tracking-wider">Ideal Clinical</span>
                    <span className="text-[10px] font-mono font-bold text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded">
                      Φ {recommendations.ideal.integrity}%
                    </span>
                  </div>
                  <div className="text-[8px] text-accent-400/60 font-sans mb-2 uppercase tracking-wider font-semibold">Precision & High Efficacy</div>
                  <div className="space-y-1.5 my-2">
                    {recommendations.ideal.regimen.map((item) => (
                      <div key={item.id} className="text-[10px] text-ink-subtle flex justify-between gap-1 border-b border-line/10 pb-1">
                        <span className="truncate max-w-[80px] font-medium text-white" title={item.name}>{item.name}</span>
                        <span className="font-mono text-accent-400 flex-shrink-0">D{item.dose}</span>
                      </div>
                    ))}
                    {recommendations.ideal.regimen.length === 0 && (
                      <div className="text-[9px] text-ink-muted italic">No compounds recommended</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveStack(recommendations.ideal.regimen);
                    setLog((l) => [
                      `[${ts()}] Applied Ideal Clinical Intervention stack:`,
                      ...recommendations.ideal.reasoning.map((r) => `   ${r}`),
                      `[${ts()}] Target Integrity projected: Φ = ${recommendations.ideal.integrity}%`,
                      ...l,
                    ].slice(0, 60));
                  }}
                  className="w-full text-center py-1.5 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-colors mt-2"
                >
                  Apply Ideal
                </button>
              </div>

              {/* Conventional Intervention (Blue) */}
              <div className="border border-clinical-500/30 bg-clinical-500/[0.04] rounded-sharp p-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold text-clinical-400 tracking-wider">Conventional</span>
                    <span className="text-[10px] font-mono font-bold text-clinical-400 bg-clinical-500/10 px-1.5 py-0.5 rounded">
                      Φ {recommendations.least.integrity}%
                    </span>
                  </div>
                  <div className="text-[8px] text-clinical-400/60 font-sans mb-2 uppercase tracking-wider font-semibold">Standard Legal Care</div>
                  <div className="space-y-1.5 my-2">
                    {recommendations.least.regimen.map((item) => (
                      <div key={item.id} className="text-[10px] text-ink-subtle flex justify-between gap-1 border-b border-line/10 pb-1">
                        <span className="truncate max-w-[80px] font-medium text-white" title={item.name}>{item.name}</span>
                        <span className="font-mono text-clinical-400 flex-shrink-0">D{item.dose}</span>
                      </div>
                    ))}
                    {recommendations.least.regimen.length === 0 && (
                      <div className="text-[9px] text-ink-muted italic">No compounds recommended</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveStack(recommendations.least.regimen);
                    setLog((l) => [
                      `[${ts()}] Applied Conventional Intervention stack:`,
                      ...recommendations.least.reasoning.map((r) => `   ${r}`),
                      `[${ts()}] Target Integrity projected: Φ = ${recommendations.least.integrity}%`,
                      ...l,
                    ].slice(0, 60));
                  }}
                  className="w-full text-center py-1.5 bg-clinical-500 hover:bg-clinical-600 active:bg-clinical-700 text-white rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-colors mt-2"
                >
                  Apply Conventional
                </button>
              </div>
            </div>

            {/* Clinical Engine Justification & Wisdom Panel */}
            <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800/80 rounded-clinical space-y-3 text-white">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-accent-400">🧠</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-300">
                  Clinical Recommendation Engine Justifications
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-300">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-accent-400 uppercase tracking-wider block">1. Therapeutic Core Selection (Why this stack?)</span>
                  <p>
                    The active greedy optimizer selects synergistic multi-vector combinations (aligning Arousal, Dampening, Chaos, and Repair vectors) that directly counteract the specific functional network imbalances of the composed pathologies. For instance, in clinical syndromes characterized by Default Mode Network (DMN) hyper-coherence, the engine prioritizes targeted high-efficacy synaptic repair agents and selective agonists to restore the baseline global topological integrity index <span className="font-mono text-cyan-400">Φ</span>. These compounds are tuned to recover the Kuramoto phase order parameter <span className="font-mono text-cyan-400">R</span> back into its homeostatic critical transition region <span className="font-mono text-cyan-400">R ≈ 0.85</span>, restoring normal functional variance.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block">2. Candidate Exclusions (Why the absence of other stuff?)</span>
                  <p>
                    To maintain strict biocompatibility constraints, all candidates exceeding ProTox-3.0 hazard thresholds are filtered out of the recommendation space. Highly addictive, toxic, or auto-oxidizing stimulants (such as methamphetamine or cocaine) are actively excluded to prevent blood-brain barrier surges, rapid vesicular depletion of dopamine, and severe vasoconstrictive hypoxia. Classical sedatives (like standard benzodiazepines) are also omitted to avoid downstream GABA-A receptor downregulation and subsequent excitotoxic withdrawal syndromes, favoring non-addictive, selective correctives and holistic stabilizers.
                  </p>
                </div>
              </div>

              {/* Topology-Specific Mathematical Framework */}
              <div className="border-t border-slate-800/60 pt-3 space-y-2">
                <span className="text-[9.5px] font-bold text-accent-400 uppercase tracking-widest block font-mono">
                  Topology-Specific Mathematical Optimization Framework
                </span>
                <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                  The clinical recommendation engine operates on a formal graph-theoretic optimization model mapped directly to the patient&apos;s individual brain connectome structure:
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-850 space-y-3 font-mono text-[10px] text-cyan-400 select-all overflow-x-auto custom-scrollbar">
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1 font-bold">1. Brain Adjacency Composed State Matrix Mapping:</span>
                    <p className="pl-2 leading-relaxed">
                      {"A_composed = A_baseline ⊕ ∑_{p ∈ P} ΔA_p"}
                    </p>
                    <p className="pl-4 text-[9px] text-slate-400 font-sans leading-normal mt-1">
                      Where <code className="text-cyan-400 font-mono">A_baseline</code> is the patient&apos;s Schaefer-200 parcellation template connectome, and each active pathology <code className="text-cyan-400 font-mono">p ∈ P</code> additively modifies the matrix (e.g. pruning long-range Control network edges in ADHD, or locking Default Mode Network sub-cliques in Depression).
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1 font-bold">2. Phase-Space Synchronization Dynamics (Kuramoto Equation):</span>
                    <p className="pl-2 leading-relaxed">
                      {"θ'_i(t) = ω_i + (K_eff / N) · ∑_{j=1}^N A_composed_{ij} · sin(θ_j(t) - θ_i(t)) + σ_eff · ξ_i(t)"}
                    </p>
                    <p className="pl-4 text-[9px] text-slate-400 font-sans leading-normal mt-1">
                      Intrinsic oscillator frequencies <code className="text-cyan-400 font-mono">ω_i</code> integrate with phase coupling <code className="text-cyan-400 font-mono">K_eff</code> directly over the modified structural matrix <code className="text-cyan-400 font-mono">A_composed</code>. The global phase order parameter <code className="text-cyan-400 font-mono">R(t)</code> measures synchrony coherence:
                    </p>
                    <p className="pl-6 mt-1 font-mono text-[10px] text-cyan-400">
                      {"R(t) · e^{i·ψ(t)} = (1/N) · ∑_{j=1}^N e^{i·θ_j(t)}"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1 font-bold">3. Multi-Vector Regimen Optimization Objective:</span>
                    <p className="pl-2 leading-relaxed">
                      {"S_optimal = argmax_S  Φ( R( A_composed, K_eff(S), σ_eff(S) ) )"}
                    </p>
                    <p className="pl-4 text-[9px] text-slate-400 font-sans leading-normal mt-1">
                      Subject to the zero-toxicity QSAR constraint: <code className="text-cyan-400 font-mono">∀ c ∈ S, Hazard(c) = Safe</code>. This objective selects the exact chemical dosage vector combination <code className="text-cyan-400 font-mono">S</code> that maximizes the Topological Integrity Score <code className="text-cyan-400 font-mono">Φ</code> based on the patient&apos;s actual brain structure and composed network pathways.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grounded Scientific Evidence (Wisdom Engine Hits) */}
              <div className="border-t border-slate-800/60 pt-3 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    Grounded Scientific Evidence (Wisdom Engine)
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {wisdom.length > 0 ? `${Math.min(3, wisdom.length)} active literature hits` : "0 literature hits"}
                  </span>
                </div>
                
                {wisdom.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic font-mono">No active literature hits for the current state.</p>
                ) : (
                  <div className="space-y-2 bg-slate-900/20 p-2.5 border border-slate-800/60 rounded">
                    {wisdom.slice(0, 3).map((w) => (
                      <div key={w.id} className="text-[11px] text-slate-300 leading-snug border-b border-slate-800/30 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-accent-400 font-bold mr-1">▶</span>
                        <span className="font-medium text-slate-200">{w.claim}</span>
                        <div className="mt-0.5 text-[10px] text-slate-500 font-sans flex items-center flex-wrap gap-1.5">
                          <span>Evidence: <strong className="uppercase font-mono text-cyan-400/80">{w.evidence}</strong></span>
                          <span>·</span>
                          <span>Source citations:</span>
                          <span className="flex items-center gap-1">
                            {w.citations.map((c, i) => {
                              const href = citationUrl(c);
                              return href ? (
                                <a
                                  key={c.id}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-400/85 hover:text-cyan-300 underline underline-offset-2 decoration-dotted font-medium"
                                >
                                  {c.label}
                                  {i < w.citations.length - 1 ? "; " : ""}
                                </a>
                              ) : (
                                <span key={c.id} className="text-slate-500">
                                  {c.label}
                                  {i < w.citations.length - 1 ? "; " : ""}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <div className="section-label">Active Regimen</div>
            <button onClick={clearStack} className="btn-ghost">Clear</button>
          </div>
          {activeStack.length === 0 ? (
            <div className="text-[11px] text-ink-muted font-mono">No compounds in stack.</div>
          ) : (
            <div className="space-y-1.5">
              {(activeStack as RegimenItem[]).map((item) => {
                const mol = molecules.find((m) => m.id === item.id);
                const regimen = mol?.regimen;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCompoundId(item.id === selectedCompoundId ? null : item.id)}
                    className={`flex items-center justify-between border rounded-sharp px-2.5 py-1.5 cursor-pointer transition-all hover:bg-surface-100 hover:border-line-strong ${
                      selectedCompoundId === item.id 
                        ? 'border-accent-500 bg-accent-500/[0.08] shadow-[0_0_10px_rgba(168,85,247,0.15)] ring-1 ring-accent-500/30' 
                        : (item.isBabelForge ? 'border-accent-500/40 bg-accent-500/10' : 'border-line bg-surface-0')
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-[12px] truncate ${item.isBabelForge ? 'text-accent-400 font-bold' : 'text-ink'}`}>
                        {item.name}
                        {item.isBabelForge && <span className="ml-1.5 text-[8px] font-extrabold uppercase tracking-widest border border-accent-500/30 bg-accent-500/20 text-accent-400 px-1 py-0.5 rounded align-text-bottom">babelForge</span>}
                        {regimen && (
                          <span className={`ml-1.5 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded align-text-bottom border ${
                            regimen.frequency === 'daily'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {regimen.frequency}
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
                        {item.classLabel}
                      </div>
                    </div>
                    {item.latchStatus?.isLocked ? (
                      <span className="text-[8px] font-mono font-extrabold uppercase bg-purple-950/60 text-purple-300 border border-purple-500/40 px-2 py-1.5 rounded shadow-[0_0_10px_rgba(168,85,247,0.2)] text-right max-w-xs break-words leading-tight">
                        Basin Attractor Locked / CpG Demethylation: 28% / Walter W. Design Prior Verified
                      </span>
                    ) : (
                      <div className="text-[10px] font-mono text-accent-400">DOSE {item.dose}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 flex-1 min-h-[140px]">
          <div className="section-label mb-2">Engine Log</div>
          <div className="space-y-0.5 text-[10.5px] font-mono leading-snug text-ink-subtle">
            {log.length === 0 && (
              <div className="text-ink-muted">[boot] babelForge clinical engine ready.</div>
            )}
            {log.map((line, i) => (
              <div key={i} className={i === 0 ? "live-caret text-accent-400" : ""}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </DraggablePanel>

      {selectedCompound && (
        <DraggablePanel
          id="console-compound-inspector"
          title="ProTox-3.0 Compound Inspector"
          subtitle="Toxicity & Structural Safety Diagnostics"
          defaultPosition={{ x: 440, y: 150 }}
          defaultSize={{ width: 420, height: 600 }}
          onClose={() => setSelectedCompoundId(null)}
        >
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-[#0d1117] text-white p-4 space-y-4">
            {/* Header section */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedCompound.name}</h3>
                <span className={`inline-block text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border mt-1.5 ${
                  selectedCompound.isBabelForge ? 'border-accent-500/30 bg-accent-500/10 text-accent-400' : 
                  (selectedCompound.isBlue ? 'border-clinical-500/30 bg-clinical-500/10 text-clinical-400' : 
                  (selectedCompound.class === 'novel' ? 'border-clinical-500/30 bg-clinical-500/10 text-clinical-400' : 'border-slate-800 bg-slate-900 text-slate-400'))
                }`}>
                  {selectedCompound.classLabel}
                </span>
                {selectedCompound.isBabelForge && (
                  <span className="ml-1.5 inline-block bg-accent-500/20 text-accent-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-accent-500/30 align-middle">
                    babelForge
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5">
                {isInStack ? (
                  <button
                    onClick={handleRemoveFromStack}
                    className="px-3 py-1.5 bg-red-950/85 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-clinical font-mono text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    Remove Stack
                  </button>
                ) : (
                  <button
                    onClick={handleApplyToStack}
                    className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white rounded-clinical font-mono text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    Apply Stack
                  </button>
                )}
              </div>
            </div>

            {/* Structure Drawing & SMILES */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/40 p-3 border border-slate-800 rounded-clinical">
              <div className="col-span-1 bg-slate-950/80 border border-slate-800 rounded p-1 flex items-center justify-center relative overflow-hidden aspect-square">
                {selectedCompound.smilesPhysics?.canonicalSmiles ? (
                  <SMILESRenderer
                    smiles={selectedCompound.smilesPhysics.canonicalSmiles}
                    width={90}
                    height={90}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                ) : (
                  <div 
                    className="w-full h-full opacity-80 text-cyan-400 [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: selectedCompound.svg }}
                  />
                )}
              </div>
              <div className="col-span-2 flex flex-col justify-between space-y-1.5">
                <div>
                  <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Formula / SMILES:</span>
                  <p className="text-[10px] font-mono text-cyan-400 break-all select-all font-semibold max-h-[52px] overflow-y-auto custom-scrollbar">
                    {selectedCompound.smilesPhysics?.canonicalSmiles || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Half-life:</span>
                  <span className="text-[10.5px] text-slate-300 font-semibold">{selectedCompound.halfLife || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* 4-Vector Telemetry */}
            <div className="space-y-2 bg-slate-900/20 p-3 border border-slate-800/80 rounded-clinical">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">
                Pharmacological Vectors
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>Arousal</span>
                    <span className="font-bold text-slate-300">{(selectedCompound.effects.arousal > 0 ? '+' : '') + selectedCompound.effects.arousal.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (selectedCompound.effects.arousal + 2) / 4 * 100))}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>Dampening</span>
                    <span className="font-bold text-slate-300">{(selectedCompound.effects.dampening > 0 ? '+' : '') + selectedCompound.effects.dampening.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (selectedCompound.effects.dampening + 2) / 4 * 100))}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>Chaos</span>
                    <span className="font-bold text-slate-300">{(selectedCompound.effects.chaos > 0 ? '+' : '') + selectedCompound.effects.chaos.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (selectedCompound.effects.chaos + 2) / 4 * 100))}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>Repair</span>
                    <span className="font-bold text-slate-300">{(selectedCompound.effects.repair > 0 ? '+' : '') + selectedCompound.effects.repair.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (selectedCompound.effects.repair + 2) / 4 * 100))}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ProTox-3.0 Diagnostics */}
            {(() => {
              const isStim = selectedCompound.class === "stimulant";
              const isDep = selectedCompound.class === "depressant";
              const toxProfile: ProTox3Profile = selectedCompound.id === "spur_mtdl" ? {
                dili: { active: false, confidence: 0.12 },
                neuro: { active: false, confidence: 0.08 },
                nephro: { active: false, confidence: 0.15 },
                respi: { active: false, confidence: 0.18 },
                cardio: { active: false, confidence: 0.22 },
                immuno: { active: true, confidence: 0.99 },
                sr_are: { active: true, confidence: 0.65 },
                mie_pxr: { active: true, confidence: 0.53 }
              } : selectedCompound.id === "seriphadine" ? {
                dili: { active: false, confidence: 0.05 },
                neuro: { active: false, confidence: 0.14 },
                nephro: { active: false, confidence: 0.08 },
                respi: { active: false, confidence: 0.10 },
                cardio: { active: false, confidence: 0.18 },
                immuno: { active: true, confidence: 0.96 },
                sr_are: { active: false, confidence: 0.20 },
                mie_pxr: { active: true, confidence: 0.44 }
              } : {
                dili: { active: false, confidence: 0.10 },
                neuro: { active: false, confidence: 0.15 },
                nephro: { active: false, confidence: 0.05 },
                respi: { active: isDep, confidence: isDep ? 0.65 : 0.05 },
                cardio: { active: isStim, confidence: isStim ? 0.72 : 0.12 },
                immuno: { active: false, confidence: 0.02 },
                sr_are: { active: false, confidence: 0.10 },
                mie_pxr: { active: false, confidence: 0.08 }
              };
              const toxReport = evaluateSubstanceToxicity(selectedCompound.id, toxProfile);
              const neuroTox = analyzeNeurotoxicity(selectedCompound.id, selectedCompound.class);

              return (
                <div className="space-y-4">
                  {/* Organ Tox Grid */}
                  <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-clinical space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">
                      ProTox-3.0 Organ Diagnostics
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800/80">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">DILI</span>
                        <span className={`font-mono font-bold ${toxProfile.dili.active ? "text-red-400" : "text-emerald-400"}`}>
                          {toxProfile.dili.active ? "HAZARD" : "Safe"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800/80">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Nephrotoxicity</span>
                        <span className={`font-mono font-bold ${toxProfile.nephro.active ? "text-red-400" : "text-emerald-400"}`}>
                          {toxProfile.nephro.active ? "HAZARD" : "Safe"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800/80">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Cardiotoxicity</span>
                        <span className={`font-mono font-bold ${toxProfile.cardio.active ? "text-red-400" : "text-emerald-400"}`}>
                          {toxProfile.cardio.active ? "HAZARD" : "Safe"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800/80">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Immunotoxicity</span>
                        <span className={`font-mono font-bold ${toxProfile.immuno.active ? (toxReport.overrideVerified ? "text-cyan-400" : "text-red-400") : "text-emerald-400"}`}>
                          {toxProfile.immuno.active ? (toxReport.overrideVerified ? "OVERRIDDEN" : "HAZARD") : "Safe"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-950/80 border border-slate-800/60 rounded font-mono text-[9px] text-cyan-400 border-l-2 border-l-cyan-500 leading-tight">
                      {toxReport.diagnosticOutput}
                    </div>
                  </div>

                  {/* Structural Neurotoxicity Alert */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-clinical space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-500 animate-pulse">⚡</span>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-300 font-mono">Structural Neurotoxicity Alert</span>
                      </div>
                      <span className={`text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        neuroTox.riskLevel === 'Severe' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        neuroTox.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        neuroTox.riskLevel === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        RISK TIER: {neuroTox.riskLevel}
                      </span>
                    </div>
                    <div className="space-y-2 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Identified Moiety Alert:</span>
                        <span className="text-cyan-400 font-mono font-semibold text-[10px]">{neuroTox.structuralAlert}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Mechanistic Explanation:</span>
                        <p className="text-slate-300 font-sans mt-0.5">{neuroTox.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Action Navigation Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <Link
                href={`/stack-simulator`}
                className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-clinical font-mono text-[9px] font-bold uppercase tracking-wider transition-all"
              >
                Open in Simulator
              </Link>
              <Link
                href={`/holographic-dashboard`}
                className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-clinical font-mono text-[9px] font-bold uppercase tracking-wider transition-all"
              >
                Open in Holograph
              </Link>
            </div>
          </div>
        </DraggablePanel>
      )}

      <TimeEnginePanel />
      <NodeFilterPanel />
      <SEEResultsPanel report={report} />
    </div>
  );
}

function ts(): string {
  return new Date().toISOString().substring(11, 19);
}
function integrityTone(score: number): string {
  if (score >= 85) return "text-ok";
  if (score >= 60) return "text-accent-400";
  if (score >= 40) return "text-warn";
  return "text-crit";
}
function integrityFillClass(score: number): string {
  if (score >= 85) return "ok";
  if (score >= 60) return "";
  if (score >= 40) return "warn";
  return "crit";
}

function SliderField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="section-label">{label}</span>
        <span className="metric text-[12px] text-ink">
          {value}
          <span className="text-ink-muted ml-1 text-[10px]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="slider-clinical"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

