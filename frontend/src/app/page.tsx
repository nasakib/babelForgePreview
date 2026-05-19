"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAI } from "@/context/AIContext";
import NeuroCanvas from "@/components/NeuroCanvas";
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
import { autoOptimize, type RegimenItem } from "@/lib/engine/optimize";
import { molecules } from "@/data/molecules";
import PanelHeader from "@/components/palantir/PanelHeader";

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
  } = useAI();

  const [weight, setWeight] = useState(70);
  const [tolerance, setTolerance] = useState(0);
  const [age, setAge] = useState(35);

  const topo = useMemo(() => composeTopology(activePathologies as Pathology[]), [activePathologies]);

  const vectors: PharmaVectors = useMemo(() => {
    const v = { ...ZERO_VECTORS };
    for (const item of activeStack as RegimenItem[]) {
      const mol = molecules.find((m) => m.id === item.id);
      if (!mol) continue;
      const ratio = Math.min(1, item.dose / 2);
      v.arousal += mol.effects.arousal * ratio;
      v.dampening += mol.effects.dampening * ratio;
      v.chaos += mol.effects.chaos * ratio;
      v.repair += mol.effects.repair * ratio;
    }
    return v;
  }, [activeStack]);

  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [computing, setComputing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [liveR, setLiveR] = useState<number | null>(null);

  const [leftMinimized, setLeftMinimized] = useState(false);
  const [rightMinimized, setRightMinimized] = useState(false);

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
        });
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
      }, 16);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePathologies, vectors, weight, tolerance, age, setIntegrityScore]
  );

  useEffect(() => {
    runReport({ silent: true });
  }, [runReport]);

  const handleAutoOptimize = useCallback(() => {
    setComputing(true);
    setLog((l) => [
      `[${ts()}] Auto-optimizer engaged · greedy search across precision compounds…`,
      ...l,
    ]);
    setTimeout(() => {
      const result = autoOptimize(activePathologies as Pathology[], {
        weightKg: weight,
        toleranceMonths: tolerance,
        ageYears: age,
      });
      setActiveStack(result.regimen);
      setLog((l) =>
        [
          ...result.reasoning.map((line) => `   ${line}`),
          `[${ts()}] Auto-optimization complete · final Φ = ${result.integrity}%`,
          ...l,
        ].slice(0, 60)
      );
      setComputing(false);
    }, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePathologies, weight, tolerance, age, setActiveStack]);

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
    <div className="flex-1 relative overflow-hidden bg-canvas flex flex-col lg:block">
      {/* BACKGROUND CANVAS */}
      <div className="lg:absolute lg:inset-0 z-0 min-h-[50vh] lg:min-h-0 relative">
        <NeuroCanvas
          topology={topo}
          vectors={vectors}
          pathologies={activePathologies as Pathology[]}
          activeStack={activeStack}
          onCoherence={setLiveR}
        />
      </div>

      {/* LEFT PANEL */}
      <aside className={`w-full lg:absolute lg:left-4 lg:top-4 z-10 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${leftMinimized ? 'lg:w-auto h-auto' : 'lg:w-[320px] lg:bottom-4 overflow-y-auto'}`}>
        <PanelHeader 
          title="Patient State Modifiers" 
          subtitle={leftMinimized ? "" : "Compose pathological networks"}
          onToggle={() => setLeftMinimized(!leftMinimized)}
          minimized={leftMinimized}
        >
          {!leftMinimized && (
            <>
              <span className="status-dot ok" />
              <span className="section-label">Engine Online</span>
            </>
          )}
        </PanelHeader>

        {!leftMinimized && (
          <>
            <div className="p-4 border-b border-line space-y-2.5">
          {PATHOLOGIES.map((p) => {
            const meta = PATHOLOGY_META[p];
            const active = activePathologies.includes(p);
            return (
              <label
                key={p}
                className={`group flex items-start gap-3 p-2.5 rounded-clinical border cursor-pointer transition-all ${
                  active
                    ? "border-accent-500/60 bg-accent-500/[0.06]"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <input
                  type="checkbox"
                  className="checkbox-clinical mt-0.5"
                  checked={active}
                  onChange={() => togglePathology(p)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] text-ink font-medium">{meta.label}</span>
                    <span
                      className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                      style={{ background: REGION_COLOR[meta.region] }}
                    />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
                    {meta.tone}
                  </div>
                </div>
              </label>
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
          </>
        )}
      </aside>

      {/* RIGHT PANEL */}
      <aside className={`w-full lg:absolute lg:right-4 lg:top-4 z-10 border-t lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${rightMinimized ? 'lg:w-auto h-auto' : 'lg:w-[380px] lg:bottom-4 overflow-y-auto'}`}>
        <PanelHeader 
          title="Diagnostic AI" 
          subtitle={rightMinimized ? "" : "Topology + Pharmacology Analyzer"}
          onToggle={() => setRightMinimized(!rightMinimized)}
          minimized={rightMinimized}
        >
          {!rightMinimized && (
            <>
              <span className={`status-dot ${computing ? "warn" : "ok"}`} />
              <span className="section-label">{computing ? "Computing" : "Idle"}</span>
            </>
          )}
        </PanelHeader>

        {!rightMinimized && (
          <>
        <div className="p-4 border-b border-line grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => runReport()} disabled={computing}>
            Calculate Now
          </button>
          <button className="btn-secondary" onClick={handleAutoOptimize} disabled={computing}>
            Auto-Optimize
          </button>
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
            </div>
          ) : (
            <div className="text-[11px] text-ink-muted font-mono">Awaiting input…</div>
          )}
        </div>

        <div className="p-4 border-b border-line">
          <div className="section-label mb-2">Subjective Experience</div>
          {report?.subjective.map((s, i) => (
            <div key={i} className="text-[12px] text-ink-subtle italic leading-relaxed mb-1.5">
              &ldquo;{s}&rdquo;
            </div>
          ))}
        </div>

        <div className="p-4 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <div className="section-label">Active Regimen</div>
            <button onClick={clearStack} className="btn-ghost">Clear</button>
          </div>
          {activeStack.length === 0 ? (
            <div className="text-[11px] text-ink-muted font-mono">No compounds in stack.</div>
          ) : (
            <div className="space-y-1.5">
              {(activeStack as RegimenItem[]).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-line rounded-sharp px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] text-ink truncate">{item.name}</div>
                    <div className="text-[9.5px] font-mono uppercase tracking-widest2 text-ink-muted">
                      {item.classLabel}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-accent-400">DOSE {item.dose}</div>
                </div>
              ))}
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
          </>
        )}
      </aside>
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

