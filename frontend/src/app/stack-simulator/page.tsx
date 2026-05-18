"use client";

import { useState, useMemo, useEffect } from "react";
import NeuroCanvas from "@/components/NeuroCanvas";
import { molecules } from "@/data/molecules";
import { useAI } from "@/context/AIContext";

export default function StackSimulator() {
  const { setCurrentModule, setActiveStack, setIntegrityScore, triggerAIAnalysis } = useAI();

  useEffect(() => {
    setCurrentModule("stack-simulator");
  }, [setCurrentModule]);

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedMolId, setSelectedMolId] = useState(molecules[0]?.id || "");
  const [stack, setStack] = useState<any[]>([]);

  useEffect(() => {
    setActiveStack(stack);
  }, [stack, setActiveStack]);

  // Computed Properties
  const filteredMolecules = useMemo(() => {
    return molecules.filter((m) => {
      const matchClass = classFilter === "all" || m.class === classFilter;
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.classLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [searchQuery, classFilter]);

  const selectedMol = useMemo(() => molecules.find(m => m.id === selectedMolId), [selectedMolId]);

  // Physics Engine Calculations
  const simulationState = useMemo(() => {
    let net = { arousal: 0, dampening: 0, chaos: 0, repair: 0 };
    let classCounts: any = { ssri: 0, stimulant: 0, depressant: 0, antipsychotic: 0, cannabinoid: 0, novel: 0 };

    stack.forEach((mol) => {
      if (mol.currentIntensity > 0) {
        const tolMonths = mol.toleranceMonths || 0;
        let tolRate = 0.1;
        if (mol.class === "stimulant" || mol.class === "recreational") tolRate = 0.5;
        if (mol.class === "novel") tolRate = 0.05;
        if (mol.class === "cannabinoid") tolRate = 0.3;

        const tolFactor = 1 / (1 + Math.log1p(tolMonths * tolRate));
        const rawRatio = mol.currentIntensity / 2.0;
        const ratio = rawRatio * 1.0 * tolFactor; // Assuming 70kg weight

        const overDose = Math.max(0, ratio - 1);
        classCounts[mol.class] = (classCounts[mol.class] || 0) + ratio;

        net.arousal += mol.effects.arousal * Math.min(1, ratio);
        net.dampening += mol.effects.dampening * Math.min(1, ratio);
        net.repair += mol.effects.repair * Math.min(1, ratio);
        net.chaos += mol.effects.chaos * Math.min(1, ratio);

        if (overDose > 0) {
          if ((mol.class === "stimulant" || mol.class === "novel") && mol.effects.arousal > 0) {
            net.chaos += overDose * 1.5;
            net.arousal += overDose * 0.5;
            net.repair -= overDose * 0.5;
          } else if (mol.class === "antipsychotic" || mol.class === "depressant" || mol.class === "ssri") {
            net.dampening += overDose * 2.0;
            net.chaos += overDose * 0.5;
            net.repair -= overDose * 0.5;
          } else {
            net.chaos += overDose * 1.0;
            net.repair -= overDose * 0.5;
          }
        }
      }
    });

    let label = "Healthy Baseline";
    let desc = "Simulation is perfectly aligned with the healthy baseline template.";
    let subj = "Healthy Baseline: A sense of 'Flow.' Clear, baseline cognition.";
    let sync = 1.0;

    if (stack.length > 0) {
      if ((classCounts.ssri > 0 && classCounts.stimulant > 0) || classCounts.stimulant > 2.0 || classCounts.ssri > 2.0) {
        label = "Toxicity (Serotonin/Stimulant)";
        desc = "Dangerous overlapping toxicity. Severe chaotic structural fragmentation.";
        subj = "Baseline Shattered: Severe confusion, hyperthermia, and autonomic instability.";
        sync = 0.10;
      } else if (classCounts.depressant > 0 && classCounts.antipsychotic > 0) {
        label = "Severe CNS Depression";
        desc = "Overlapping dampening effects have dangerously suppressed global network amplitude.";
        subj = "Baseline Suppressed: Profound lethargy. Cognitive functions are shutting down.";
        sync = 0.20;
      } else if (net.repair > 1.0 && net.chaos <= 0) {
        label = "Topological Optimization";
        desc = "Precision compounds are expanding Arnold Tongues, aligning the network back toward baseline.";
        subj = "Baseline Restored: Lucid clarity. Effortless focus, emotional balance.";
        sync = 0.95;
      } else if (net.dampening > 2.0 && net.arousal <= 0) {
        label = "Severe Rigidity / Sedation";
        desc = "Excessive dampening has frozen the network, deviating severely from baseline variance.";
        subj = "Baseline Suppressed: Heavy physical sedation. Thoughts are sluggish.";
        sync = 0.30;
      } else if (net.arousal > 2.0 || net.chaos > 1.5) {
        label = "Hyper-Arousal Toxicity";
        desc = "Dangerous over-stimulation. Baseline cliques are shattering into chaotic fragments.";
        subj = "Baseline Shattered: Intense anxiety, jitteriness, and an inability to maintain focus.";
        sync = 0.15;
      } else if (net.arousal > 0.5 && net.dampening > 0.5 && net.chaos > 0.5) {
        label = "Polypharmacy Conflict";
        desc = "Competing mechanisms are creating uncoordinated signal propagation.";
        subj = "Baseline Distorted: A confusing mix of physical lethargy paired with mental racing ('tired but wired').";
        sync = 0.55;
      } else if (net.dampening > 0.5) {
        label = "Global Suppression";
        desc = "Network amplitude is blunted globally. Baseline topologies are preserved but sluggish.";
        subj = "Baseline Dampened: Calm and relaxed, but with noticeable cognitive slowing.";
        sync = 0.70;
      } else if (net.arousal > 0.5) {
        label = "Upregulated State";
        desc = "Network firing rates increased above healthy baseline.";
        subj = "Baseline Elevated: Heightened alertness and energy, though potentially tense.";
        sync = 0.80;
      }
    }

    return { net, label, desc, subj, sync };
  }, [stack]);

  useEffect(() => {
    setIntegrityScore(Math.round(simulationState.sync * 100));
  }, [simulationState.sync, setIntegrityScore]);

  // Actions
  const addToStack = () => {
    if (stack.length >= 10) {
      alert("Maximum stack size (10) reached.");
      return;
    }
    if (selectedMol && !stack.find(m => m.id === selectedMol.id)) {
      setStack([...stack, { ...selectedMol, currentIntensity: 2, toleranceMonths: 0 }]);
    }
  };

  const removeFromStack = (id: string) => {
    setStack(stack.filter(m => m.id !== id));
  };

  const updateMolAttr = (id: string, key: string, value: number) => {
    setStack(stack.map(m => m.id === id ? { ...m, [key]: value } : m));
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar: Stack Builder */}
      <div id="left-sidebar" className="w-full lg:w-[350px] bg-slate-50 border-r border-slate-200 flex-none overflow-y-auto custom-scrollbar z-20 flex flex-col p-4 shadow-sm shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-none mb-4">
          <div className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-widest mb-3">Database Connected</div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">NeuroStack Builder</h2>
          <p className="text-xs text-slate-500 mb-5">Simulate interactions across indexed compounds.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Search</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type to search..." className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Compound Class</label>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500">
                <option value="all">All Classes</option>
                <option value="novel">Novel Therapeutics (Precision)</option>
                <option value="ssri">SSRIs / SNRIs</option>
                <option value="stimulant">Stimulants (Amphetamines)</option>
                <option value="antipsychotic">Antipsychotics</option>
                <option value="cannabinoid">Cannabinoids</option>
                <option value="depressant">Depressants / Benzos</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-widest">Select Molecule</label>
              <select value={selectedMolId} onChange={(e) => setSelectedMolId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500">
                {filteredMolecules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <button onClick={addToStack} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-colors shadow-md shadow-indigo-200">
                + Add to Stack
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-grow flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-none">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Active Stack</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{stack.length}/10</span>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {stack.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <p className="text-xs font-medium text-slate-500">Stack is empty.</p>
              </div>
            ) : (
              stack.map(mol => {
                const isBabel = mol.isBabelForge;
                const isBlue = mol.isBlue;
                const isNovel = mol.class === 'novel' && !isBabel && !isBlue;
                const colorClass = isBabel ? 'text-purple-600' : (isBlue ? 'text-blue-600' : (isNovel ? 'text-indigo-600' : 'text-slate-600'));
                const bgClass = isBabel ? 'bg-purple-50 border-purple-200' : (isBlue ? 'bg-blue-50 border-blue-200' : (isNovel ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'));
                const themeColor = isBabel ? 'purple' : (isBlue ? 'blue' : 'indigo');
                const badge = isBabel ? <span className="bg-purple-100 text-purple-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded ml-2 align-middle">babelForge</span> : null;

                return (
                  <div key={mol.id} className={`stack-item flex flex-col p-3 rounded-xl border ${bgClass} shadow-sm gap-2`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-none opacity-80 ${colorClass}`} dangerouslySetInnerHTML={{ __html: mol.svg }} />
                            <div>
                                <h4 className="font-bold text-xs text-slate-900">{mol.name}</h4>
                                <p className={`text-[9px] uppercase tracking-widest font-bold ${colorClass}`}>{mol.classLabel}{badge}</p>
                            </div>
                        </div>
                        <button onClick={() => removeFromStack(mol.id)} className="text-slate-400 hover:text-red-500 p-1 self-start">
                            ✕
                        </button>
                    </div>
                    <div className="flex flex-col gap-2 w-full px-1 mt-1 border-t border-slate-100 pt-2">
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase w-12">Dose</span>
                            <input type="range" min="0" max="3" step="1" value={mol.currentIntensity} onChange={(e) => updateMolAttr(mol.id, 'currentIntensity', parseInt(e.target.value))} className={`flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${themeColor}-500`} />
                            <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">{['0', '1', '2', '3'][mol.currentIntensity]}</span>
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase w-12">Tol (Mo)</span>
                            <input type="range" min="0" max="120" step="1" value={mol.toleranceMonths} onChange={(e) => updateMolAttr(mol.id, 'toleranceMonths', parseInt(e.target.value))} className={`flex-grow h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${themeColor}-400`} />
                            <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">{mol.toleranceMonths}</span>
                        </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex-none">
              <div className="text-[9px] uppercase font-bold text-slate-400 mb-3 tracking-widest">Net Pharmacological Vectors</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between bg-slate-50 p-2 rounded"><span className="text-slate-500">Arousal</span><span className="font-bold text-slate-900">{(simulationState.net.arousal > 0 ? '+' : '') + simulationState.net.arousal.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded"><span className="text-slate-500">Dampening</span><span className="font-bold text-slate-900">{(simulationState.net.dampening > 0 ? '+' : '') + simulationState.net.dampening.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded"><span className="text-slate-500">Chaos</span><span className="font-bold text-slate-900">{(simulationState.net.chaos > 0 ? '+' : '') + simulationState.net.chaos.toFixed(1)}</span></div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded"><span className="text-slate-500">Repair</span><span className="font-bold text-slate-900">{(simulationState.net.repair > 0 ? '+' : '') + simulationState.net.repair.toFixed(1)}</span></div>
              </div>
          </div>
        </div>
      </div>

      {/* Right Panel: 3D Visualization */}
      <div className="flex-grow bg-white border border-slate-200 rounded-2xl m-4 p-1 shadow-sm flex flex-col relative min-h-[500px] lg:min-h-full">
        <NeuroCanvas activeStack={stack} vectors={simulationState.net} />
        
        {/* Overlay Info */}
        <div className="absolute top-6 left-6 pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">React Three Fiber Engine</span>
          </div>
          <h4 className="text-xl font-bold text-white drop-shadow-md">{simulationState.label}</h4>
          <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed drop-shadow">{simulationState.desc}</p>
          <div className="mt-2 pt-2 border-t border-indigo-500/30 max-w-sm">
              <span className="text-[9px] uppercase font-bold text-rose-400 block mb-1">Projected Subjective Experience</span>
              <p className="text-xs text-slate-300 italic leading-relaxed drop-shadow">{simulationState.subj}</p>
          </div>
          <button onClick={() => triggerAIAnalysis("Analyze the pharmacological interactions in my current stack.")} className="mt-4 bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-all border border-indigo-400/50 backdrop-blur-md shadow-lg flex items-center gap-2 pointer-events-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Ask babelAI
          </button>
        </div>

        <div className="absolute bottom-6 right-6 p-4 bg-slate-900/90 border border-slate-700 rounded-xl backdrop-blur-xl min-w-[200px] shadow-2xl z-10 flex flex-col gap-3">
            <div>
                <div className="text-[9px] uppercase font-bold text-indigo-400 mb-2 tracking-widest">Baseline Alignment (Healthy)</div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-slate-400">Order (r)</span>
                    <span className="text-lg text-emerald-400 font-mono font-bold">{simulationState.sync.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{width: `${simulationState.sync * 100}%`}}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}