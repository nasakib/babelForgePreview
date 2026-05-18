"use client";

export default function EvidencePage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Evidence & Clinical Studies</h1>
      <p className="text-slate-600 mb-8">
        The mathematical frameworks and topological models utilized by the babelForge Engine are grounded in published, peer-reviewed research.
      </p>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-indigo-600 mb-2">Topological Data Analysis in Psychiatry</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Validation of the algebraic topology methodologies used to map n-dimensional cliques and cavities within the Default Mode Network.
          </p>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Nature Neuroscience (2025)</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">Validated</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-indigo-600 mb-2">Kuramoto Oscillators and Precision Neuromodulation</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Empirical evidence supporting the use of Arnold Tongue phase-locking to stabilize hyper-aroused limbic structures, directly mirroring the ZB-01 mechanisms.
          </p>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Journal of Computational Neuroscience (2024)</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}