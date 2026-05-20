"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
import { composeTopology } from "@/lib/engine/topology";
import DraggablePanel from "@/components/palantir/DraggablePanel";

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
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      <div className="absolute inset-0 z-0 pointer-events-auto">
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
      </div>

      <DraggablePanel
        id="11d-projection-sidebar"
        title="Algebraic Topology"
        subtitle="Higher-Order Structures"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 360, height: 600 }}
      >
        <div className="flex flex-col h-full bg-surface-50/80">

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
          <div className="section-label mb-1">Dimensionality Breakdown</div>
          <div className="text-2xs text-ink-subtle leading-relaxed space-y-2">
            <p><span className="text-ink font-bold">0D (Nodes):</span> Individual parcellated brain regions or distinct neuron clusters. The fundamental anchor points.</p>
            <p><span className="text-ink font-bold">1D (Edges):</span> Pairwise functional connections between two nodes. Synaptic pathways.</p>
            <p><span className="text-ink font-bold">2D (Triangles):</span> Three nodes fully connected, forming a closed loop. Localized functional triads.</p>
            <p><span className="text-ink font-bold">3D (Tetrahedrons):</span> Four interconnected nodes enclosing a volume. Complex local processing motifs.</p>
            <p><span className="text-ink font-bold">4D-11D (k-Simplices):</span> Higher-order geometric structures representing profound levels of neural synchrony and multidimensional information integration. An 11D clique means 12 neurons/regions are entirely interconnected, processing complex, abstract subjective experiences simultaneously.</p>
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
        </div>
      </DraggablePanel>
    </div>
  );
}
