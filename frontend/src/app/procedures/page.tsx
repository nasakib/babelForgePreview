import { palette } from "@/lib/theme/palette";
import Link from "next/link";

const PROCEDURES = [
  {
    id: "tpr",
    name: "Topological Phase-Reset (TPR) Therapy",
    type: "Neuromodulation",
    duration: "45 Min",
    risk: "Low",
    description:
      "A non-invasive, precision-targeted magnetic stimulation protocol designed to reset entrenched pathological cliques in the Default Mode Network. Using real-time Kuramoto phase-tracking, TPR administers micro-pulses exactly at the trough of the network's oscillatory cycle, destabilizing rigid thought patterns without generalized suppression.",
    tags: ["DMN Target", "Phase-Locked", "Non-Invasive"],
    color: "accent",
  },
  {
    id: "kep",
    name: "Kuramoto Entrainment Protocol (KEP)",
    type: "Pharma-Acoustic",
    duration: "120 Min",
    risk: "Moderate",
    description:
      "A combinatorial procedure leveraging a sub-perceptual dose of ZB-01 (ZenBud™) alongside binaural beat entrainment. By scaffolding the dopaminergic pathways artificially, KEP forces a temporary, highly plastic state of hyper-synchrony across the frontoparietal control network, facilitating rapid trauma processing.",
    tags: ["Polypharmacy", "Plasticity", "Acoustic"],
    color: "clinical",
  },
  {
    id: "tcca",
    name: "Targeted Cliques-Complex Ablation (TCCA)",
    type: "High-Intensity Focused Ultrasound",
    duration: "60 Min",
    risk: "High",
    description:
      "For severe, treatment-resistant topographical rigidity (e.g., refractory MDD). TCCA utilizes real-time fMRI-guided focused ultrasound to safely ablate micro-structures acting as pathological 'hubs'. This forces the connectome to reroute through healthier, latent pathways.",
    tags: ["Ablation", "fMRI-Guided", "Refractory"],
    color: "warn",
  },
  {
    id: "sdi",
    name: "Synthetic Dampening Infusion",
    type: "Intravenous",
    duration: "30 Min",
    risk: "Low",
    description:
      "An acute pharmacological intervention for active hyperarousal (e.g., manic shift, severe PTSD triggers). Rapid-acting dampening vectors are introduced via IV, directly suppressing limbic hyper-connectivity while preserving executive functioning in the control network.",
    tags: ["Acute", "IV", "Limbic Target"],
    color: "ok",
  },
  {
    id: "dmnr",
    name: "DMN Resynchronization (DMN-R)",
    type: "Biofeedback",
    duration: "90 Min",
    risk: "Minimal",
    description:
      "A closed-loop biofeedback procedure where the patient's real-time topological integrity score (Φ) modulates a visual and auditory environment. The patient trains to consciously regulate their network entropy, guided by the engine's predictive projections.",
    tags: ["Biofeedback", "Conscious Regulation", "Entropy"],
    color: "info",
  },
];

export default function ProceduresPage() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar p-6 lg:p-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest2 text-accent-400">Clinical Interventions</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-ink tracking-tight mb-4">
              Procedural <span className="text-accent-400">Taxonomy</span>
            </h1>
            <p className="text-sm text-ink-subtle max-w-2xl leading-relaxed">
              babelForge provides predictive modeling for advanced neuromodulatory and pharmacological interventions. The following procedures represent our bleeding-edge clinical protocols, bridging mathematical topology with applied neuroscience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROCEDURES.map((proc) => {
              const borderColors: Record<string, string> = {
                accent: "border-accent-500/30",
                clinical: "border-clinical-500/30",
                warn: "border-warn/30",
                ok: "border-ok/30",
                info: "border-info/30",
              };
              const bgColors: Record<string, string> = {
                accent: "bg-accent-500/5",
                clinical: "bg-clinical-500/5",
                warn: "bg-warn/5",
                ok: "bg-ok/5",
                info: "bg-info/5",
              };
              const textColors: Record<string, string> = {
                accent: "text-accent-400",
                clinical: "text-clinical-400",
                warn: "text-warn",
                ok: "text-ok",
                info: "text-info",
              };

              return (
                <div 
                  key={proc.id} 
                  className={`clinical-card flex flex-col p-6 border ${borderColors[proc.color] || "border-line"} ${bgColors[proc.color] || "bg-surface-0"} hover:bg-surface-50 transition-colors cursor-default`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className={`text-[10px] font-mono uppercase tracking-widest2 font-bold mb-1 ${textColors[proc.color] || "text-ink-subtle"}`}>
                        {proc.type}
                      </div>
                      <h3 className="text-xl font-bold text-ink">{proc.name}</h3>
                    </div>
                    <div className="flex flex-col items-end text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
                      <span>{proc.duration}</span>
                      <span className={proc.risk === "High" ? "text-crit" : (proc.risk === "Low" || proc.risk === "Minimal" ? "text-ok" : "text-warn")}>
                        Risk: {proc.risk}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-ink-subtle leading-relaxed flex-grow mb-6">
                    {proc.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {proc.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded bg-surface-100 border border-line-strong text-[9px] font-mono uppercase tracking-widest2 text-ink-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}