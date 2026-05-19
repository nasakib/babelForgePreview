"use client";

import { useState } from "react";
import { useAI } from "@/context/AIContext";
import NeuroCanvas from "@/components/NeuroCanvas";
import { babelforgeApi } from "@/lib/api/client";

export default function ExperienceSimulator() {
  const { activePathologies, setViewPerspective } = useAI();
  const [experience, setExperience] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (!experience.trim()) return;
    setIsSimulating(true);
    setResult(null);

    try {
      const data = await babelforgeApi.simulate(experience, { pathologies: activePathologies });
      setResult(data);
      setViewPerspective("pharma"); // Switch to effect view
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to simulate experience. Ensure backend is reachable and GEMINI_API_KEY is configured." });
    } finally {
      setIsSimulating(false);
    }
  };

  const vectors = result && !result.error ? {
    arousal: result.arousal,
    dampening: result.dampening,
    chaos: result.chaos,
    repair: result.repair
  } : { arousal: 0, dampening: 0, chaos: 0, repair: 0 };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas lg:block">
      {/* Background Canvas */}
      <div className="lg:absolute lg:inset-0 z-0 relative min-h-[50vh] lg:min-h-0">
        <NeuroCanvas vectors={vectors} />
      </div>

      {/* Left Sidebar: Simulator Input */}
      <aside className="w-full lg:w-[380px] lg:absolute lg:left-4 lg:top-4 lg:bottom-4 z-10 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col overflow-y-auto custom-scrollbar shadow-2xl pointer-events-auto">
        <div className="clinical-card-header">
          <span className="section-label-strong">SUBJECTIVE REACTION ENGINE</span>
          <span className="text-micro text-ink-muted font-mono">LLM-Physics Bridge</span>
        </div>

        <div className="p-4 flex flex-col gap-4 border-b border-line flex-none">
          <p className="text-xs text-ink-subtle leading-relaxed">
            Describe a subjective experience, intervention, or state in natural language. The engine will parse your description and map it onto the brain&apos;s topological physics engine in real-time.
          </p>
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full h-32 bg-surface-50 border border-line-strong rounded-clinical p-3 text-sm text-ink font-sans resize-none focus:outline-none focus:border-accent-500 custom-scrollbar"
              placeholder="e.g., 'I just ran a marathon and then sat in a sauna for 20 minutes', or 'I took 2mg of alprazolam during a panic attack...'"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
            <button
              onClick={handleSimulate}
              disabled={isSimulating || !experience.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Simulating Cortex Response...
                </>
              ) : (
                "Simulate Experience"
              )}
            </button>
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <div className="section-label mb-3">Objective & Subjective Projections</div>
          {isSimulating ? (
            <div className="flex flex-col gap-2 text-ink-muted font-mono text-[10px] animate-pulse">
              <span>&gt; Parsing natural language...</span>
              <span>&gt; Mapping to 4D pharmacological vector space...</span>
              <span>&gt; Applying perturbation to Kuramoto phase-oscillators...</span>
            </div>
          ) : result ? (
            result.error ? (
              <div className="text-crit text-xs border border-crit/30 bg-crit/10 p-3 rounded-clinical">
                {result.error}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <h4 className="text-lg font-bold text-ink mb-1">{result.label}</h4>
                  <p className="text-xs text-ink-subtle leading-relaxed">{result.desc}</p>
                </div>
                
                <div className="bg-surface-50 border border-line-strong rounded-clinical p-3">
                  <span className="text-[9px] uppercase font-bold text-accent-400 block mb-1 tracking-widest">Projected Subjective State</span>
                  <p className="text-xs text-ink italic leading-relaxed">&ldquo;{result.subj}&rdquo;</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Arousal (α)</span>
                    <span className={`text-base font-bold ${result.arousal > 0 ? 'text-warn' : 'text-ok'}`}>{result.arousal > 0 ? '+' : ''}{result.arousal.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Dampening (δ)</span>
                    <span className={`text-base font-bold ${result.dampening > 0 ? 'text-info' : 'text-ink'}`}>{result.dampening > 0 ? '+' : ''}{result.dampening.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Chaos (χ)</span>
                    <span className={`text-base font-bold ${result.chaos > 0 ? 'text-crit' : 'text-ok'}`}>{result.chaos > 0 ? '+' : ''}{result.chaos.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Repair (ρ)</span>
                    <span className={`text-base font-bold ${result.repair > 0 ? 'text-accent-400' : 'text-crit'}`}>{result.repair > 0 ? '+' : ''}{result.repair.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-[10px] text-ink-muted font-mono">Awaiting linguistic input.</div>
          )}
        </div>
      </aside>
    </div>
  );
}