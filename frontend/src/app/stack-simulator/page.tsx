import NeuroCanvas from "@/components/NeuroCanvas";

export default function StackSimulator() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar: Controls (Placeholder for Phase 2) */}
      <div id="left-sidebar" className="w-full lg:w-[350px] bg-slate-50 border-r border-slate-200 flex-none overflow-y-auto custom-scrollbar transition-all duration-500 z-20 flex flex-col p-4 shadow-sm shrink-0">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Pharmacopeia</h2>
        <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">
          Select molecules to build a simulated stack. The 3D engine computes complex, non-linear drug interactions.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Database Port Pending</h3>
            <p className="text-xs text-slate-500 mb-4">The pharmacological definitions are currently being migrated to the FastAPI backend via GCP.</p>
            <button className="w-full bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest py-3 rounded-lg shadow-sm cursor-not-allowed">
              + Add to Stack
            </button>
        </div>
      </div>

      {/* Right Panel: 3D Visualization */}
      <div className="flex-grow bg-white border border-slate-200 rounded-2xl m-4 p-1 shadow-sm flex flex-col relative min-h-[500px] lg:min-h-full">
        <NeuroCanvas />
        
        {/* Overlay Info */}
        <div className="absolute top-6 left-6 pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">React Three Fiber</span>
          </div>
          <h4 className="text-xl font-bold text-white drop-shadow-md">Next.js Migration Active</h4>
          <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed drop-shadow">The WebGL context has been successfully ported to a componentized React architecture.</p>
        </div>
      </div>
    </div>
  );
}