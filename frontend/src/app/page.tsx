export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-2xl text-center bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
        <svg className="w-20 h-20 text-indigo-600 mx-auto mb-6 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">babelForge <span className="text-indigo-600 font-light">Next.js Migration</span></h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          The babelForge precision neuroscience engine is currently being refactored into a modular React/Next.js architecture. This will enable collaborative development between UI engineers, neuroscientists, and pharmacologists, paving the way for deployment to Google Cloud Platform.
        </p>
        <div className="flex gap-4 justify-center">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-sm">
            Phase 2: UI Componentization Active
          </div>
        </div>
      </div>
    </main>
  );
}