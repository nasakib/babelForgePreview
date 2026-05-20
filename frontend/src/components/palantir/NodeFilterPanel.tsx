"use client";

import { useAI } from "@/context/AIContext";
import DraggablePanel from "./DraggablePanel";
import { useMemo, useState, useEffect } from "react";
import { composeTopology, type Pathology } from "@/lib/engine/topology";

export default function NodeFilterPanel() {
  const { activePathologies, selectedNodeIds, setSelectedNodeIds } = useAI();
  const [filterMode, setFilterMode] = useState<"none" | "region" | "hubness">("none");
  const [activeRegion, setActiveRegion] = useState<string>("Default");

  const topo = useMemo(() => composeTopology(activePathologies as Pathology[]), [activePathologies]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(topo.nodes.map(n => n.region))).sort();
  }, [topo]);

  // Apply filters
  useEffect(() => {
    if (filterMode === "none") {
      if (selectedNodeIds.length > 0) setSelectedNodeIds([]);
      return;
    }

    if (filterMode === "region") {
      const ids = topo.nodes.filter(n => n.region === activeRegion).map(n => n.id);
      setSelectedNodeIds(ids);
    } else if (filterMode === "hubness") {
      // Top 20% by hubness
      const sorted = [...topo.nodes].sort((a, b) => b.hubness - a.hubness);
      const top20PercentCount = Math.floor(sorted.length * 0.2);
      const ids = sorted.slice(0, top20PercentCount).map(n => n.id);
      setSelectedNodeIds(ids);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, activeRegion, topo]);

  return (
    <DraggablePanel
      id="node-filter-panel"
      title="Topological Filter"
      subtitle="Isolate Network Nodes"
      defaultPosition={{ x: 20, y: typeof window !== "undefined" ? window.innerHeight - 300 : 500 }}
      defaultSize={{ width: 340, height: 260 }}
    >
      <div className="p-4 flex flex-col gap-4">
        <p className="text-xs text-ink-subtle leading-relaxed">
          Isolate specific anatomical or structural subsets of the functional connectome. Nodes outside the filter will be structurally dimmed.
        </p>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 p-2 border border-line rounded-clinical cursor-pointer hover:bg-surface-50 transition-colors">
            <input 
              type="radio" 
              name="nodeFilter" 
              checked={filterMode === "none"} 
              onChange={() => setFilterMode("none")} 
              className="accent-accent-500"
            />
            <span className="text-xs font-medium text-ink">No Filter (Show All)</span>
          </label>

          <label className="flex items-center gap-3 p-2 border border-line rounded-clinical cursor-pointer hover:bg-surface-50 transition-colors">
            <input 
              type="radio" 
              name="nodeFilter" 
              checked={filterMode === "hubness"} 
              onChange={() => setFilterMode("hubness")} 
              className="accent-accent-500"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-ink block">Top Hubs (Rich Club)</span>
              <span className="text-[10px] text-ink-muted">Isolates the top 20% highest-degree nodes.</span>
            </div>
          </label>

          <div className={`p-2 border border-line rounded-clinical transition-colors ${filterMode === "region" ? 'bg-surface-50' : 'hover:bg-surface-50 cursor-pointer'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="nodeFilter" 
                checked={filterMode === "region"} 
                onChange={() => setFilterMode("region")} 
                className="accent-accent-500"
              />
              <span className="text-xs font-medium text-ink">Isolate Anatomical Region</span>
            </label>
            
            {filterMode === "region" && (
              <div className="mt-3 ml-7 grid grid-cols-2 gap-2">
                {uniqueRegions.map(region => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`text-left px-2 py-1 text-[10px] font-mono rounded border transition-colors ${activeRegion === region ? 'bg-accent-500/20 text-accent-400 border-accent-500/50' : 'bg-surface-0 text-ink-muted border-line hover:text-ink'}`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedNodeIds.length > 0 && filterMode !== "none" && (
          <div className="mt-2 text-[10px] font-mono text-accent-400">
            {selectedNodeIds.length} nodes isolated.
          </div>
        )}
      </div>
    </DraggablePanel>
  );
}
