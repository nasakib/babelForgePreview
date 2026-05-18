"use client";

import { useState } from 'react';
import SignalCanvas from '@/components/SignalCanvas';

export default function SignalAnalyzer() {
  const [activeStimulus, setActiveStimulus] = useState<any>(null);

  const stimuli = [
    { category: 'Pharmacological', type: 'Stimulant', label: 'Stimulant (e.g. Amphetamine)', desc: 'Increases high-frequency power, lowers amplitude.' },
    { category: 'Pharmacological', type: 'Depressant', label: 'Depressant (e.g. Benzodiazepine)', desc: 'Increases low-frequency amplitude, reduces noise.' },
    { category: 'Pharmacological', type: 'Psychedelic', label: 'Psychedelic (e.g. Psilocybin)', desc: 'Increases broadband noise and global entropy.' },
    { category: 'Cognitive', type: 'Focus', label: 'Working Memory Task', desc: 'Induces beta/gamma bursts in localized regions.' },
    { category: 'Sensory', type: 'Visual', label: 'Photic Stimulation (Flash)', desc: 'Induces transient sharp-wave spikes.' },
    { category: 'Neuromodulatory', type: 'TMS', label: 'TMS (10Hz Alpha)', desc: 'Forces rhythmic phase-locking at 10Hz.' },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full h-[calc(100vh-3.5rem)]">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-[350px] bg-slate-50 border-r border-slate-200 flex-none overflow-y-auto custom-scrollbar p-6 shadow-sm shrink-0 flex flex-col">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Stimulus Application</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Select a stimulus to inject into the live simulated brain signal. Observe the real-time oscillatory response.
        </p>

        <div className="space-y-3 flex-grow">
          {stimuli.map((stim, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStimulus(stim)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeStimulus?.label === stim.label 
                  ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-1 ring-indigo-200' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{stim.category}</span>
                {activeStimulus?.label === stim.label && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </div>
              <h4 className={`text-sm font-bold ${activeStimulus?.label === stim.label ? 'text-indigo-900' : 'text-slate-800'}`}>{stim.label}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{stim.desc}</p>
            </button>
          ))}
        </div>

        <button 
          onClick={() => setActiveStimulus(null)}
          className="mt-6 w-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-colors"
        >
          Reset to Baseline
        </button>
      </div>

      {/* Main Signal Display */}
      <div className="flex-grow bg-slate-900 m-4 rounded-2xl shadow-xl flex flex-col overflow-hidden relative border border-slate-800">
        
        {/* Header Info */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Signal Analysis</span>
          </div>
          <h4 className="text-xl font-bold text-white drop-shadow-md">
            {activeStimulus ? `Simulated LFP + ${activeStimulus.type}` : 'Resting State LFP (Baseline)'}
          </h4>
        </div>

        <div className="flex-1 w-full relative">
          <SignalCanvas stimulus={activeStimulus} />
          
          {/* Scanline Effect Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20"></div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-900/90 border border-slate-700 rounded-xl backdrop-blur-xl shadow-2xl z-10 flex gap-6">
          <div className="flex-1">
            <span className="block text-[9px] uppercase font-bold text-indigo-400 mb-1 tracking-widest">Dominant Frequency</span>
            <span className="text-lg text-white font-mono font-bold">
              {activeStimulus?.type === 'Stimulant' ? '28.5 Hz (Beta)' :
               activeStimulus?.type === 'Depressant' ? '4.2 Hz (Theta)' :
               activeStimulus?.type === 'TMS' ? '10.0 Hz (Alpha)' :
               activeStimulus?.category === 'Cognitive' ? '40.0 Hz (Gamma)' :
               '12.5 Hz (Alpha)'}
            </span>
          </div>
          <div className="w-px bg-slate-700"></div>
          <div className="flex-1">
            <span className="block text-[9px] uppercase font-bold text-indigo-400 mb-1 tracking-widest">Signal Entropy</span>
            <span className="text-lg text-white font-mono font-bold">
              {activeStimulus?.type === 'Psychedelic' ? 'High (Chaotic)' :
               activeStimulus?.type === 'Depressant' ? 'Low (Ordered)' :
               activeStimulus?.type === 'TMS' ? 'Very Low (Locked)' :
               'Moderate'}
            </span>
          </div>
          <div className="w-px bg-slate-700"></div>
          <div className="flex-1">
            <span className="block text-[9px] uppercase font-bold text-indigo-400 mb-1 tracking-widest">Active Intervention</span>
            <span className={`text-sm font-bold ${activeStimulus ? 'text-rose-400' : 'text-slate-400'}`}>
              {activeStimulus ? activeStimulus.category : 'None (Healthy Baseline)'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}