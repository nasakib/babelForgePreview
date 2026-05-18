"use client";

import NeuroCanvas from "@/components/NeuroCanvas";

export default function ElevenDProjection() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative bg-void">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Legacy Systems</span>
        </div>
        <h4 className="text-xl font-bold text-white drop-shadow-md">11D Algebraic Topology</h4>
        <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed drop-shadow">
          Visualizing the multi-dimensional cliques and cavities forming the baseline neurological structure.
        </p>
      </div>
      
      <div className="flex-1 bg-[#030008]">
        <NeuroCanvas />
      </div>
    </div>
  );
}