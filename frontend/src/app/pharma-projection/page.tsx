"use client";

import { useMemo, useState } from "react";
import { molecules } from "@/data/molecules";

const AXES = ["arousal", "dampening", "chaos", "repair"] as const;

export default function PharmaProjection() {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [hoverId, setHoverId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return molecules.filter((m) =>
      classFilter === "all"
        ? true
        : classFilter === "babelforge"
        ? !!m.isBabelForge
        : m.class === classFilter
    );
  }, [classFilter]);

  // Stable layout: parallel-coordinates style, x = axis index, y = vector value
  const W = 720;
  const H = 360;
  const padX = 60;
  const padY = 36;
  const ax = (i: number) => padX + (i * (W - 2 * padX)) / (AXES.length - 1);
  const ay = (v: number) => padY + ((2 - v) / 4) * (H - 2 * padY); // clamp -2..+2

  const counts = useMemo(() => {
    const total = molecules.length;
    const babel = molecules.filter((m) => m.isBabelForge).length;
    const classes = new Map<string, number>();
    for (const m of molecules) classes.set(m.class, (classes.get(m.class) ?? 0) + 1);
    return { total, babel, classes };
  }, []);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden lg:h-[calc(100vh-3rem)] bg-canvas">
      <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-line flex flex-col">
        <div className="clinical-card-header">
          <span className="section-label-strong">F7 · 4-VECTOR PROJECTION</span>
          <span className="text-micro text-ink-muted font-mono">{visible.length}/{counts.total}</span>
        </div>

        <div className="p-4 border-b border-line space-y-2">
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

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="section-label mb-2">Axis Legend</div>
          <ul className="space-y-2 text-2xs text-ink-muted leading-relaxed">
            <li><span className="text-ok">Arousal</span> · excitatory firing rate Δ</li>
            <li><span className="text-accent-400">Dampening</span> · GABAergic / inhibitory tone</li>
            <li><span className="text-crit">Chaos</span> · entropy / noise injection</li>
            <li><span className="text-info">Repair</span> · synaptogenesis / BDNF</li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            <span className="section-label-strong">PHARMACOLOGICAL VECTOR SPACE</span>
          </div>
          <h1 className="text-lg font-semibold text-ink mt-1">
            Parallel-Coordinates Projection — 4D Effects Manifold
          </h1>
        </div>

        <div className="p-6">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-surface-0 border border-line">
            {/* Axes */}
            {AXES.map((_, i) => (
              <line
                key={i}
                x1={ax(i)} y1={padY} x2={ax(i)} y2={H - padY}
                stroke="#2c3548" strokeWidth={1}
              />
            ))}
            {/* Zero baseline */}
            <line
              x1={padX} y1={ay(0)} x2={W - padX} y2={ay(0)}
              stroke="#454c5d" strokeDasharray="2 4" strokeWidth={1}
            />
            {/* Axis labels */}
            {AXES.map((name, i) => (
              <text
                key={name}
                x={ax(i)} y={H - 12}
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                fill="#6a7286"
                textAnchor="middle"
                style={{ letterSpacing: "0.18em" }}
              >
                {name.toUpperCase()}
              </text>
            ))}
            {/* Tick labels */}
            {[-2, -1, 0, 1, 2].map((v) => (
              <text
                key={v}
                x={padX - 10} y={ay(v) + 3}
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                fill="#454c5d"
                textAnchor="end"
              >
                {v > 0 ? `+${v}` : v}
              </text>
            ))}
            {/* Polylines */}
            {visible.map((m) => {
              const isHover = hoverId === m.id;
              const stroke = m.isBabelForge
                ? "#06b6d4"
                : m.class === "novel"
                ? "#9cc0ff"
                : m.class === "stimulant"
                ? "#f59e0b"
                : m.class === "ssri"
                ? "#4d8dff"
                : m.class === "antipsychotic"
                ? "#aab1c0"
                : m.class === "cannabinoid"
                ? "#10b981"
                : "#6a7286";
              const d = AXES.map((a, i) => `${i === 0 ? "M" : "L"}${ax(i)},${ay(m.effects[a] ?? 0)}`).join(" ");
              return (
                <path
                  key={m.id}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isHover ? 2.5 : 1}
                  strokeOpacity={hoverId && !isHover ? 0.12 : 0.55}
                />
              );
            })}
          </svg>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {visible.map((m) => (
              <div
                key={m.id}
                onMouseEnter={() => setHoverId(m.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`p-3 border text-2xs font-mono cursor-default transition-colors ${
                  hoverId === m.id
                    ? "border-accent-500 bg-accent-500/10"
                    : "border-line bg-surface-50 hover:border-line-strong"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-ink font-semibold uppercase">{m.name}</span>
                  {m.isBabelForge && (
                    <span className="bg-info/20 text-info px-1.5 py-0.5 text-[9px] font-bold">FORGE</span>
                  )}
                </div>
                <div className="text-ink-muted mb-2">{m.classLabel}</div>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {AXES.map((a) => (
                    <div key={a} className="flex flex-col items-center">
                      <span className="text-ink-dim uppercase">{a.slice(0, 3)}</span>
                      <span className={
                        (m.effects[a] ?? 0) > 0 ? "text-ok" : (m.effects[a] ?? 0) < 0 ? "text-crit" : "text-ink-muted"
                      }>
                        {(m.effects[a] ?? 0) > 0 ? "+" : ""}{(m.effects[a] ?? 0).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
