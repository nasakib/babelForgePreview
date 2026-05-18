"use client";

import { useAI } from "@/context/AIContext";
import NeuroCanvas from "@/components/NeuroCanvas";
import { useEffect } from "react";

export default function Home() {
  const { setCurrentModule, setIntegrityScore } = useAI();

  useEffect(() => {
    setCurrentModule("dashboard");
    setIntegrityScore(100);
  }, [setCurrentModule, setIntegrityScore]);

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative bg-slate-50">
      
      {/* Left Panel: Pathology Selectors */}
      <aside className="w-full lg:w-[320px] bg-white border-r border-slate-200 flex-none overflow-y-auto custom-scrollbar flex flex-col shadow-sm z-20 h-full shrink-0">
        <div className="p-6 border-b border-slate-100 flex-none bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Diagnostic Engine Online</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Patient State Modifiers</h2>
          <p className="text-xs text-slate-500 leading-relaxed">Overlap multiple pathological states to simulate complex psychiatric comorbidities.</p>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
           {/* Checkboxes would go here */}
           <p className="text-xs text-slate-400 italic">State Modifiers are being ported to the Next.js architecture.</p>
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 bg-white">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Topological Integrity</div>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">Baseline Alignment (Healthy)</span>
                <span id="integrity-score" className="text-indigo-600 font-mono font-bold text-lg">100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div id="integrity-bar" className="h-full bg-indigo-600 transition-all duration-700" style={{width: "100%"}}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Healthy Baseline.</p>
        </div>
      </aside>

      {/* Middle Panel: 3D Visualizer */}
      <section className="w-full h-[50vh] min-h-[400px] lg:min-h-0 lg:h-auto flex-1 relative bg-slate-900 overflow-hidden shrink-0">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h3 className="text-white/80 font-bold text-base md:text-lg">Network Topology</h3>
            <p className="text-white/50 text-[10px] md:text-xs font-mono">React Three Fiber Port</p>
        </div>
        <NeuroCanvas />
      </section>

      {/* Right Panel: AI & Regimen */}
      <aside className="w-full lg:w-[350px] bg-slate-50 border-l border-slate-200 flex-none flex flex-col z-20 h-full shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b border-slate-100 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Diagnostic AI</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">FastAPI Integration Pending</p>
        </div>
        <div className="p-6 flex-grow flex flex-col gap-4 overflow-y-auto">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                Auto-Optimize Protocol
            </button>
        </div>
      </aside>

    </main>
  );
}