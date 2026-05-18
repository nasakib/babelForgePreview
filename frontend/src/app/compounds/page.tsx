"use client";

import { useState, useMemo } from "react";
import { molecules } from "@/data/molecules";

export default function CompoundsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedMolId, setSelectedMolId] = useState<string | null>(null);

  const filteredMolecules = useMemo(() => {
    return molecules.filter((m) => {
      const matchClass = classFilter === "all" || m.class === classFilter;
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.classLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [searchQuery, classFilter]);

  const selectedMol = useMemo(() => molecules.find((m) => m.id === selectedMolId), [selectedMolId]);

  return (
    <div className="flex-grow max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-3.5rem)]">
      {/* Sidebar: Search and Filter */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex-none flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Compound Directory</h2>
          <p className="text-xs text-slate-500 mb-5">Search and inspect detailed pharmacological properties.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Search</label>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Molecule name..." 
                className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Class</label>
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Classes</option>
                <option value="novel">Novel Therapeutics</option>
                <option value="ssri">SSRIs / SNRIs</option>
                <option value="stimulant">Stimulants</option>
                <option value="antipsychotic">Antipsychotics</option>
                <option value="cannabinoid">Cannabinoids</option>
                <option value="depressant">Depressants / Opioids</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-0 shadow-sm overflow-hidden flex-grow flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex-none">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest text-center">Molecules ({filteredMolecules.length})</h3>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {filteredMolecules.map(mol => {
              const isBabel = mol.isBabelForge;
              const isBlue = mol.isBlue;
              const isNovel = mol.class === 'novel' && !isBabel && !isBlue;
              const colorClass = isBabel ? 'text-purple-600' : (isBlue ? 'text-blue-600' : (isNovel ? 'text-indigo-600' : 'text-slate-600'));
              
              return (
                <button 
                  key={mol.id}
                  onClick={() => setSelectedMolId(mol.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50 group ${selectedMolId === mol.id ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-8 h-8 flex-none opacity-60 group-hover:opacity-100 transition-opacity ${colorClass}`}
                      dangerouslySetInnerHTML={{ __html: mol.svg }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 transition-colors">{mol.name}</h4>
                      <p className={`text-[10px] uppercase tracking-widest font-bold ${colorClass}`}>
                        {mol.classLabel}
                        {isBabel && <span className="bg-purple-100 text-purple-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded ml-2 align-middle">babelForge</span>}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Panel: Detailed View */}
      <div className="w-full md:w-2/3 lg:w-3/4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative min-h-0">
        {!selectedMol ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 z-10 bg-white">
            <svg viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor">
              <path d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Compound Selected</p>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">Select a molecule from the list to view its pharmacological profile and topological targets.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 bg-slate-50">
              <div 
                className={`w-32 h-32 flex-none opacity-80 drop-shadow-sm ${
                  selectedMol.isBabelForge ? 'text-purple-600' : (selectedMol.isBlue ? 'text-blue-600' : (selectedMol.class === 'novel' ? 'text-indigo-600' : 'text-slate-600'))
                }`}
                dangerouslySetInnerHTML={{ __html: selectedMol.svg }}
              />
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedMol.name}</h2>
                <span className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${
                  selectedMol.isBabelForge ? 'border-purple-200 bg-purple-50 text-purple-600' : 
                  (selectedMol.isBlue ? 'border-blue-200 bg-blue-50 text-blue-600' : 
                  (selectedMol.class === 'novel' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-600'))
                }`}>
                  {selectedMol.classLabel}
                  {selectedMol.isBabelForge && <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded ml-2 align-middle border border-purple-500 shadow-sm">babelForge</span>}
                </span>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-center md:text-left shadow-sm">
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Half-life</span>
                    <span className="text-sm font-semibold text-slate-700 capitalize">{selectedMol.halfLife}</span>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-center md:text-left shadow-sm">
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Addiction Potential</span>
                    <span className={`text-sm font-bold ${selectedMol.addictionPotential && selectedMol.addictionPotential > 0.5 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {selectedMol.addictionPotential ? `${(selectedMol.addictionPotential * 100).toFixed(0)}%` : 'Negligible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vectors */}
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <h3 className="text-sm uppercase tracking-widest font-bold text-slate-800">Pharmacological Vectors</h3>
                </div>
                <div className="space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Arousal (Excitatory)</span><span className="font-mono">{selectedMol.effects.arousal > 0 ? `+${selectedMol.effects.arousal}` : selectedMol.effects.arousal}</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (selectedMol.effects.arousal + 2) / 4 * 100))}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Dampening (Inhibitory)</span><span className="font-mono">{selectedMol.effects.dampening > 0 ? `+${selectedMol.effects.dampening}` : selectedMol.effects.dampening}</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-indigo-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (selectedMol.effects.dampening + 2) / 4 * 100))}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Chaos (Entropy/Noise)</span><span className="font-mono">{selectedMol.effects.chaos > 0 ? `+${selectedMol.effects.chaos}` : selectedMol.effects.chaos}</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className={`${selectedMol.effects.chaos > 0 ? 'bg-rose-500' : 'bg-indigo-400'} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (selectedMol.effects.chaos + 2) / 4 * 100))}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Repair (Synaptogenesis)</span><span className="font-mono">{selectedMol.effects.repair > 0 ? `+${selectedMol.effects.repair}` : selectedMol.effects.repair}</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (selectedMol.effects.repair + 2) / 4 * 100))}%` }}></div></div>
                  </div>
                </div>
              </div>

              {/* Targets & Notes */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    <h3 className="text-sm uppercase tracking-widest font-bold text-slate-800">Primary Neural Targets</h3>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-lg shadow-sm">
                    {(() => {
                      if (selectedMol.class === 'stimulant' && selectedMol.effects.arousal > 1) return "Frontoparietal Control Network, Basal Ganglia";
                      if (selectedMol.class === 'depressant' || selectedMol.class === 'ssri') return "Default Mode Network, Limbic System";
                      if (selectedMol.id === 'zb01' || selectedMol.id === 'cbd') return "Global Phase-Locking Modulator (Systemic)";
                      if (selectedMol.id === 'sr17') return "Mu-Opioid Receptors (Biased), Brainstem";
                      if (selectedMol.class === 'novel' && selectedMol.effects.chaos > 1) return "Default Mode Network (Disruptive)";
                      return "Systemic / Network-wide";
                    })()}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h3 className="text-sm uppercase tracking-widest font-bold text-slate-800">Clinical Application</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-lg shadow-sm">
                    {(() => {
                      if (selectedMol.class === 'stimulant' && selectedMol.effects.arousal > 1) return "Primarily indicated for profound hypo-arousal or severe executive dysfunction (e.g., severe ADHD or narcolepsy). Carries high risk of structural entropy if misapplied.";
                      if (selectedMol.class === 'depressant' || selectedMol.class === 'ssri') return "Dampens high-frequency oscillatory noise. Often prescribed for rigid rumination loops (MDD) or hyper-arousal (severe anxiety), though prolonged use risks structural rigidity.";
                      if (selectedMol.id === 'zb01' || selectedMol.id === 'cbd') return "A precision tool for stabilizing chaotic cliques without inducing severe dampening. Ideal for conditions characterized by intense topological jittering like PTSD.";
                      if (selectedMol.id === 'sr17') return "A novel biased agonist designed specifically to halt opioid withdrawal chaos without inducing respiratory depression. Essential for stabilizing neurochemical debt.";
                      if (selectedMol.class === 'novel' && selectedMol.effects.chaos > 1) return "Intentionally induces high entropy to shatter rigid pathological cliques (e.g., treatment-resistant depression). Must be paired with a repair vector.";
                      return "Modulates global network states. Useful as a baseline or adjunctive therapy depending on specific vector strengths.";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}