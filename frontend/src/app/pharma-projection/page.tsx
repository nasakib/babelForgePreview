"use client";

import React, { useMemo, useState } from "react";
import { molecules } from "@/data/molecules";
import { analyzeNeurotoxicity } from "@/lib/engines/toxicology";
import Link from "next/link";

const AXES = ["arousal", "dampening", "chaos", "repair"] as const;

export default function PharmaProjection() {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return molecules.filter((m) =>
      classFilter === "all"
        ? true
        : classFilter === "babelforge"
        ? !!m.isBabelForge
        : m.class === classFilter
    );
  }, [classFilter]);

  const selectedMol = useMemo(() => {
    return molecules.find((m) => m.id === selectedId) || null;
  }, [selectedId]);

  const W = 720;
  const H = 360;
  const padX = 60;
  const padY = 36;
  const ax = (i: number) => padX + (i * (W - 2 * padX)) / (AXES.length - 1);
  const ay = (v: number) => padY + ((2 - v) / 4) * (H - 2 * padY);

  const counts = useMemo(() => {
    const total = molecules.length;
    const babel = molecules.filter((m) => m.isBabelForge).length;
    return { total, babel };
  }, []);

  const [leftMinimized, setLeftMinimized] = useState(false);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas lg:block">
      <aside className={`w-full lg:absolute lg:left-4 lg:top-4 z-10 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${leftMinimized ? 'lg:w-auto h-auto' : 'lg:w-[320px] lg:bottom-4 overflow-y-auto'}`}>
        <div className="clinical-card-header flex justify-between items-center cursor-pointer p-4" onClick={() => setLeftMinimized(!leftMinimized)}>
          <div className="flex flex-col">
            <span className="section-label-strong">F7 · 4-VECTOR PROJECTION</span>
            {!leftMinimized && <span className="text-micro text-ink-muted font-mono mt-0.5">{visible.length}/{counts.total} compounds</span>}
          </div>
          <svg className={`w-4 h-4 text-ink-subtle transition-transform ${leftMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>

        {!leftMinimized && (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
            <div className="p-4 border-b border-line space-y-2 flex-none">
              <div className="section-label mb-1">Filter</div>
              {[
                { id: "all", label: "All Compounds" },
                { id: "babelforge", label: "babelForge Pipeline" },
                { id: "novel", label: "Novel Therapeutics" },
                { id: "ssri", label: "SSRIs / SNRIs" },
                { id: "stimulant", label: "Stimulants" },
                { id: "antipsychotic", label: "Antipsychotics" },
                { id: "cannabinoid", label: "Cannabinoids" },
                { id: "depressant", label: "Depressants" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setClassFilter(opt.id)}
                  className={`w-full text-left px-3 py-2 border text-2xs font-mono uppercase tracking-widest transition-colors ${
                    classFilter === opt.id
                      ? "border-accent-500 bg-accent-500/10 text-accent-200"
                      : "border-line bg-surface-50 text-ink-muted hover:border-line-strong hover:text-ink-subtle"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="p-4 border-b border-line">
              <div className="section-label mb-2">Pipeline Composition</div>
              <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                <div className="flex flex-col p-2 border border-line bg-surface-50">
                  <span className="text-ink-muted">Total</span>
                  <span className="metric text-base">{counts.total}</span>
                </div>
                <div className="flex flex-col p-2 border border-line bg-surface-50">
                  <span className="text-ink-muted">babelForge</span>
                  <span className="metric text-base text-accent-400">{counts.babel}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-line bg-indigo-950/10">
              <div className="section-label mb-1.5 text-cyan-400">High-Dimensional Vector Sync</div>
              <p className="text-2xs text-ink-muted leading-relaxed">
                These 4-vector dynamics are unified with structural degree distributions and index-linked as **128-dimensional topological vector embeddings** in the Pinecone data lake for rapid similarity matching.
              </p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              <div className="section-label mb-2">Axis Legend</div>
              <ul className="space-y-2 text-2xs text-ink-muted leading-relaxed">
                <li><span className="text-ok">Arousal</span> · excitatory firing rate Δ</li>
                <li><span className="text-accent-400">Dampening</span> · GABAergic / inhibitory tone</li>
                <li><span className="text-crit">Chaos</span> · entropy / noise injection</li>
                <li><span className="text-info">Repair</span> · synaptogenesis / BDNF</li>
              </ul>
            </div>
          </div>
        )}
      </aside>

      <main className="lg:absolute lg:inset-0 z-0 relative flex flex-col min-h-[50vh] lg:min-h-0 bg-canvas p-4 lg:p-0">
        <div className="flex flex-col flex-1 rounded-clinical lg:rounded-none border lg:border-none border-line bg-surface-50 lg:bg-transparent overflow-hidden">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 lg:px-6 py-2.5 lg:pt-6 lg:pb-3 border-b border-line bg-surface-0/70 backdrop-blur z-10 lg:pl-[360px]">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                PHARMACOLOGICAL VECTOR SPACE
              </div>
              <h2 className="text-sm font-bold text-ink mt-1">
                Parallel-Coordinates Projection — 4D Effects Manifold
              </h2>
            </div>
          </header>

          <div className="p-4 lg:p-8 lg:pl-[380px] flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start items-center">
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 w-full lg:w-0 space-y-6">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-surface-0 border border-line rounded-clinical shadow-sm pointer-events-auto">
                  {AXES.map((_, i) => (
                    <line key={i} x1={ax(i)} y1={padY} x2={ax(i)} y2={H - padY} stroke="#2c3548" strokeWidth={1} />
                  ))}
                  <line x1={padX} y1={ay(0)} x2={W - padX} y2={ay(0)} stroke="#454c5d" strokeDasharray="2 4" strokeWidth={1} />
                  {AXES.map((name, i) => (
                    <text key={name} x={ax(i)} y={H - 12} fontSize={10} fontFamily="JetBrains Mono, monospace" fill="#6a7286" textAnchor="middle" style={{ letterSpacing: "0.18em" }}>
                      {name.toUpperCase()}
                    </text>
                  ))}
                  {[-2, -1, 0, 1, 2].map((v) => (
                    <text key={v} x={padX - 10} y={ay(v) + 3} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#454c5d" textAnchor="end">
                      {v > 0 ? `+${v}` : v}
                    </text>
                  ))}
                  {visible.map((m) => {
                    const isHover = hoverId === m.id;
                    const isSelected = selectedId === m.id;
                    const stroke = m.isBabelForge ? "#06b6d4" : m.class === "novel" ? "#9cc0ff" : m.class === "stimulant" ? "#f59e0b" : m.class === "ssri" ? "#4d8dff" : m.class === "antipsychotic" ? "#aab1c0" : m.class === "cannabinoid" ? "#10b981" : "#6a7286";
                    const d = AXES.map((a, i) => `${i === 0 ? "M" : "L"}${ax(i)},${ay(m.effects[a] ?? 0)}`).join(" ");

                    let opacity = 0.55;
                    if (selectedId) {
                      opacity = isSelected ? 1.0 : (isHover ? 0.45 : 0.08);
                    } else if (hoverId) {
                      opacity = isHover ? 1.0 : 0.12;
                    }

                    return (
                      <g key={m.id}>
                        {isSelected && <path d={d} fill="none" stroke={stroke} strokeWidth={5} strokeOpacity={0.3} className="animate-pulse" />}
                        <path d={d} fill="none" stroke={stroke} strokeWidth={isSelected ? 3.5 : isHover ? 2.5 : 1.2} strokeOpacity={opacity} className="transition-all duration-200" />
                      </g>
                    );
                  })}
                  {visible.map((m) => {
                    const d = AXES.map((a, i) => `${i === 0 ? "M" : "L"}${ax(i)},${ay(m.effects[a] ?? 0)}`).join(" ");
                    return (
                      <path
                        key={`catcher-${m.id}`}
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        className="cursor-pointer pointer-events-auto"
                        onMouseEnter={() => setHoverId(m.id)}
                        onMouseLeave={() => setHoverId(null)}
                        onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                      />
                    );
                  })}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visible.map((m) => (
                    <div
                      key={m.id}
                      onMouseEnter={() => setHoverId(m.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                      className={`p-3 border text-2xs font-mono cursor-pointer transition-all duration-200 pointer-events-auto ${
                        selectedId === m.id ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : hoverId === m.id ? "border-accent-500 bg-accent-500/10" : "border-line bg-surface-50 hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink font-semibold uppercase">{m.name}</span>
                        {m.isBabelForge && <span className="bg-accent-500/20 text-accent-400 px-1.5 py-0.5 text-[9px] font-bold rounded-sm border border-accent-500/30">babelForge</span>}
                      </div>
                      <div className="text-ink-muted mb-2">{m.classLabel}</div>
                      <div className="grid grid-cols-4 gap-1 text-[10px]">
                        {AXES.map((a) => (
                          <div key={a} className="flex flex-col items-center">
                            <span className="text-ink-dim uppercase">{a.slice(0, 3)}</span>
                            <span className={(m.effects[a] ?? 0) > 0 ? "text-ok" : (m.effects[a] ?? 0) < 0 ? "text-crit" : "text-ink-muted"}>
                              {(m.effects[a] ?? 0) > 0 ? "+" : ""}{(m.effects[a] ?? 0).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMol && (() => {
                const neuroTox = analyzeNeurotoxicity(selectedMol.id, selectedMol.class);
                return (
                  <aside className="w-full lg:w-[360px] flex-none bg-[#090f1d]/90 backdrop-blur-xl border border-line rounded-clinical p-5 space-y-5 shadow-2xl animate-fade-in pointer-events-auto">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">{selectedMol.classLabel}</span>
                        <h3 className="text-base font-bold text-cyan-400 mt-1 flex items-center gap-1.5 font-mono">
                          {selectedMol.name}
                          {selectedMol.isBabelForge && <span className="bg-accent-500/10 text-accent-400 border border-accent-500/20 px-1.5 py-0.5 rounded text-[8px] font-sans font-semibold tracking-wider">PIPELINE</span>}
                        </h3>
                      </div>
                      <button onClick={() => setSelectedId(null)} className="p-1 text-ink-muted hover:text-ink hover:bg-surface-100 rounded transition-colors font-sans text-xs">✕</button>
                    </div>

                    {selectedMol.svg && (
                      <div className="aspect-square w-full max-w-[200px] mx-auto border border-line bg-surface-100 rounded-clinical p-4 text-cyan-400 flex items-center justify-center relative overflow-hidden group shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/10 to-transparent" />
                        <div className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105" dangerouslySetInnerHTML={{ __html: selectedMol.svg }} />
                      </div>
                    )}

                    {selectedMol.smilesPhysics?.canonicalSmiles && (
                      <div className="p-2.5 bg-surface-100 border border-line rounded font-mono text-[9px] text-ink-muted break-all shadow-inner">
                        <span className="text-slate-500 font-bold block mb-0.5 uppercase tracking-wider text-[8px]">SMILES string:</span>
                        {selectedMol.smilesPhysics.canonicalSmiles}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase tracking-wider text-ink font-mono font-bold border-b border-line pb-1.5">4-Vector Projections</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {AXES.map((a) => {
                          const val = selectedMol.effects[a] ?? 0;
                          const pct = Math.min(100, Math.max(0, ((val + 2) / 4) * 100));
                          return (
                            <div key={a} className="p-2.5 bg-surface-100 border border-line rounded space-y-1.5 shadow-sm">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-ink-muted uppercase">{a}</span>
                                <span className={val >= 0 ? "text-ok font-bold" : "text-crit font-bold"}>{val >= 0 ? "+" : ""}{val.toFixed(2)}</span>
                              </div>
                              <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${a === "arousal" ? "bg-emerald-500" : a === "dampening" ? "bg-cyan-500" : a === "chaos" ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 bg-surface-100 border border-line rounded-clinical space-y-2.5 shadow-sm border-l-4 border-l-cyan-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-crit animate-pulse">⚡</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-ink font-mono">Neurotoxicity Alert</span>
                        </div>
                        <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${neuroTox.riskLevel === 'Severe' ? 'bg-red-500/10 text-red-400 border-red-500/25' : neuroTox.riskLevel === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/25' : neuroTox.riskLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'}`}>
                          {neuroTox.riskLevel}
                        </span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Identified Moiety:</span>
                          <span className="text-cyan-400 font-mono font-semibold">{neuroTox.structuralAlert}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-mono text-[8px] uppercase tracking-wider font-extrabold">Mechanistic Detail:</span>
                          <p className="text-ink-subtle leading-relaxed mt-0.5 font-sans text-xs">{neuroTox.explanation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Link href={`/experience-simulator?compound=${selectedId}`} className="py-2.5 px-2 border border-line bg-surface-100 hover:border-cyan-500 hover:text-cyan-300 rounded transition-colors text-ink-subtle">🚀 Simulator</Link>
                      <Link href={`/holographic-dashboard?compound=${selectedId}`} className="py-2.5 px-2 border border-line bg-surface-100 hover:border-accent-500 hover:text-accent-300 rounded transition-colors text-ink-subtle">🧠 Holograph</Link>
                    </div>
                  </aside>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
