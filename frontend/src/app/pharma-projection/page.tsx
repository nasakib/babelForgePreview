"use client";

import NeuroCanvas from "@/components/NeuroCanvas";

export default function PharmaProjection() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pharma Projection</span>
        </div>
        <h4 className="text-xl font-bold text-slate-900 drop-shadow-md bg-white/80 px-2 py-1 rounded backdrop-blur">Pipeline Analysis</h4>
      </div>
      
      <div className="flex-1 bg-slate-900">
        <NeuroCanvas />
      </div>
    </div>
  );
}