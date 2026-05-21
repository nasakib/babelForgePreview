"use client";

import DraggablePanel from "./DraggablePanel";
import { type DiagnosticReport } from "@/lib/engine/diagnosis";

interface SEEResultsPanelProps {
  report: DiagnosticReport | null;
}

export default function SEEResultsPanel({ report }: SEEResultsPanelProps) {
  return (
    <DraggablePanel
      id="see-results-panel"
      title="Subjective Experience Engine (SEE)"
      subtitle="Projected Cognitive Qualia"
      defaultPosition={{
        x: typeof window !== "undefined" && window.innerWidth > 1200 ? window.innerWidth - 840 : 380,
        y: 150,
      }}
      defaultSize={{ width: 380, height: 520 }}
    >
      <div className="p-4 space-y-3.5 h-full flex flex-col justify-start">
        {!report && (
          <div className="text-[11px] text-ink-muted font-mono italic">
            Awaiting neural mapping and subjective simulation run...
          </div>
        )}

        {report && !report.subjectiveProfile && report.subjective.length === 0 && (
          <div className="text-[11px] text-ink-muted font-mono italic">
            Awaiting neural mapping and subjective simulation run...
          </div>
        )}

        {report && (
          <>
            {report.subjectiveProfile && (
              <div className="space-y-3 animate-fade-in-up">
                {/* Qualia Class Display */}
                <div className="bg-surface-glass border border-line rounded-sharp p-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 blur-xl rounded-full" />
                  <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-0.5">Phenomenological Qualia</div>
                  <div className="text-[13px] text-white font-bold tracking-tight mb-1 flex items-center gap-1.5 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping" />
                    {report.subjectiveProfile.qualiaClass}
                  </div>
                  <div className="text-[11px] text-ink-subtle leading-relaxed italic">
                    &ldquo;{report.subjectiveProfile.qualiaDescription}&rdquo;
                  </div>
                </div>

                {/* State Badges / Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {report.subjectiveProfile.tags.map((tag) => {
                    const isPositive = ["Flow State", "Emotional Serenity", "Autonomic Balance", "Homeostasis"].includes(tag);
                    const isWarning = ["Anhedonia", "Cognitive Fatigue", "Tachycardia Risk", "Connectome Decay"].includes(tag);
                    const colorClass = isPositive 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : (isWarning ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-accent-500/10 border-accent-500/30 text-accent-400");
                    return (
                      <span 
                        key={tag} 
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${colorClass} uppercase tracking-wider`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>

                {/* Cognitive Domains */}
                <div className="bg-surface-dark border border-line rounded-sharp p-3 space-y-2.5">
                  <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Cognitive Domain Projection (SEE)</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {/* Focus */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                        <span>Executive Focus</span>
                        <span className="font-mono text-white font-semibold">{report.subjectiveProfile.domains.focus}%</span>
                      </div>
                      <div className="h-1 bg-line rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${report.subjectiveProfile.domains.focus}%` }}
                        />
                      </div>
                    </div>

                    {/* Affective Valence */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                        <span>Emotional Valence</span>
                        <span className="font-mono text-white font-semibold">{report.subjectiveProfile.domains.affectiveValence}%</span>
                      </div>
                      <div className="h-1 bg-line rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${report.subjectiveProfile.domains.affectiveValence}%` }}
                        />
                      </div>
                    </div>

                    {/* Perceptual Entropy */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                        <span>Perceptual Entropy</span>
                        <span className="font-mono text-white font-semibold">{report.subjectiveProfile.domains.perceptualEntropy}%</span>
                      </div>
                      <div className="h-1 bg-line rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-fuchsia-500 transition-all duration-500" 
                          style={{ width: `${report.subjectiveProfile.domains.perceptualEntropy}%` }}
                        />
                      </div>
                    </div>

                    {/* Autonomic Tone */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                        <span>Autonomic Balance</span>
                        <span className="font-mono text-white font-semibold">{report.subjectiveProfile.domains.autonomicTone}%</span>
                      </div>
                      <div className="h-1 bg-line rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white/40 left-1/2 -translate-x-1/2 z-10" 
                          title="Ideal Balance"
                        />
                        <div 
                          className={`h-full transition-all duration-500 ${
                            report.subjectiveProfile.domains.autonomicTone > 70 
                              ? "bg-rose-500" 
                              : (report.subjectiveProfile.domains.autonomicTone < 30 ? "bg-cyan-500" : "bg-amber-500")
                          }`} 
                          style={{ width: `${report.subjectiveProfile.domains.autonomicTone}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Narrative Paragraph */}
                <div className="text-[11.5px] text-ink-subtle leading-relaxed bg-surface-glass border border-line rounded-sharp p-3 font-sans relative overflow-hidden">
                  <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-1.5">Connectome Neuro-Narrative</div>
                  <p className="indent-4 text-justify select-text leading-relaxed">
                    {report.subjectiveProfile.narrative}
                  </p>
                </div>
              </div>
            )}

            {!report.subjectiveProfile && report.subjective.map((s, i) => (
              <div key={i} className="text-[12px] text-ink-subtle italic leading-relaxed mb-1.5 border border-line bg-surface-dark p-2.5 rounded-sharp">
                &ldquo;{s}&rdquo;
              </div>
            ))}
          </>
        )}
      </div>
    </DraggablePanel>
  );
}
