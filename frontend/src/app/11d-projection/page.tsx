"use client";

import { useMemo } from "react";
import NeuroCanvas from "@/components/NeuroCanvas";
import { composeTopology } from "@/lib/engine/topology";

export default function ElevenDProjection() {
  const topo = useMemo(() => composeTopology([]), []);

  const dimHist = useMemo(() => {
    const h = new Array(12).fill(0);
    for (const c of topo.cliques) {
      if (c.dimension >= 0 && c.dimension <= 11) h[c.dimension] += 1;
    }
    return h;
  }, [topo]);

  const max = Math.max(1, ...dimHist);
  const totalCliques = topo.cliques.length;
  const eulerProxy = dimHist.reduce((acc, n, k) => acc + (k % 2 === 0 ? n : -n), 0);

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-3rem)] bg-canvas">
      <aside className="w-[360px] border-r border-line flex flex-col">
        <div className="clinical-card-header">
          <span className="section-label-strong">F6 · ALGEBRAIC TOPOLOGY</span>
          <span className="text-micro text-ink-muted font-mono">N={topo.N}</span>
        </div>

        <div className="p-4 border-b border-line">
          <div className="section-label mb-2">Simplex Dimension Distribution</div>
          <p className="text-2xs text-ink-muted leading-relaxed mb-4">
            Distribution of maximal cliques (k-simplices) embedded in the structural
            connectome. Higher-dimensional cliques (k≥4) correspond to densely
            interlocked neural cell assemblies (Reimann et al., 2017).
          </p>

          <div className="space-y-1.5 font-mono">
            {dimHist.map((n, k) => (
              <div key={k} className="flex items-center gap-2 text-2xs">
                <span className="w-8 text-ink-muted text-right">k={k}</span>
                <div className="flex-1 h-3 bg-surface-100 border border-line relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent-500"
                    style={{ width: `${(n / max) * 100}%`, opacity: 0.85 }}
                  />
                </div>
                <span className="w-10 text-ink-subtle text-right">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-line space-y-3">
          <div className="section-label mb-1">Aggregate Invariants</div>
          <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
            <div className="flex flex-col p-2 border border-line bg-surface-50">
              <span className="text-ink-muted">Σ cliques</span>
              <span className="metric text-base">{totalCliques}</span>
            </div>
            <div className="flex flex-col p-2 border border-line bg-surface-50">
              <span className="text-ink-muted">Euler χ (proxy)</span>
              <span className="metric text-base">{eulerProxy}</span>
            </div>
            <div className="flex flex-col p-2 border border-line bg-surface-50">
              <span className="text-ink-muted">Edges</span>
              <span className="metric text-base">{topo.edges.length}</span>
            </div>
            <div className="flex flex-col p-2 border border-line bg-surface-50">
              <span className="text-ink-muted">k-max</span>
              <span className="metric text-base">
                {dimHist.reduce((m, n, k) => (n > 0 ? k : m), 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="section-label mb-2">References</div>
          <ul className="space-y-2 text-2xs text-ink-muted leading-relaxed">
            <li>
              <span className="text-ink-subtle">Reimann et&nbsp;al. (2017)</span> ·
              Cliques of neurons bound into cavities provide a missing link
              between structure and function. <em>Front. Comput. Neurosci.</em>
            </li>
            <li>
              <span className="text-ink-subtle">Tewarie et&nbsp;al. (2019)</span> ·
              Structural degree predicts functional network connectivity through
              algebraic topology. <em>NeuroImage</em>.
            </li>
            <li>
              <span className="text-ink-subtle">Schaefer et&nbsp;al. (2018)</span> ·
              Local-global parcellation of the human cerebral cortex.
              <em> Cerebral Cortex</em>.
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 relative">
        <NeuroCanvas topology={topo} />
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            <span className="section-label-strong">11-DIMENSIONAL PROJECTION</span>
          </div>
          <h1 className="text-lg font-semibold text-ink mt-1">
            Baseline Connectome — Maximal Clique Complex
          </h1>
        </div>
      </main>
    </div>
  );
}
