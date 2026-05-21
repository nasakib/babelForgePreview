import React from "react";
import { COMPOUND_DATABASE } from "@/lib/engine/pharmaChemEngine";

export interface ReceptorActivationProfile {
  DAT: number;
  SERT: number;
  NET: number;
  HT2A: number;
  GABAA: number;
  MOR: number;
  NMDA: number;
  ADRA2A: number;
}

export interface OccupancyResult {
  occupancies: Record<string, Partial<ReceptorActivationProfile>>;
  activations: ReceptorActivationProfile;
}

interface ReceptorOccupancyProps {
  occupancyData?: OccupancyResult;
  title?: string;
}

const RECEPTOR_DEFS = [
  { key: "HT2A" as keyof ReceptorActivationProfile, name: "5-HT2A", desc: "Serotonin 2A · Psychedelic/DMN target" },
  { key: "GABAA" as keyof ReceptorActivationProfile, name: "GABA-A", desc: "GABA-A · Sedative/Anxiolytic target" },
  { key: "MOR" as keyof ReceptorActivationProfile, name: "Mu-Opioid (MOR)", desc: "Mu-Opioid · Analgesic target" },
  { key: "NMDA" as keyof ReceptorActivationProfile, name: "NMDA", desc: "NMDA Glutamate · Dissociative target" },
  { key: "DAT" as keyof ReceptorActivationProfile, name: "DAT", desc: "Dopamine Transporter · Stimulant target" },
  { key: "SERT" as keyof ReceptorActivationProfile, name: "SERT", desc: "Serotonin Transporter · SSRI target" },
  { key: "NET" as keyof ReceptorActivationProfile, name: "NET", desc: "Norepinephrine Transporter · Focus target" },
  { key: "ADRA2A" as keyof ReceptorActivationProfile, name: "ADRA2A", desc: "Alpha-2A Adrenergic · Autonomic target" },
];

export default function ReceptorOccupancy({ occupancyData, title = "Receptor Occupancy Profile" }: ReceptorOccupancyProps) {
  if (!occupancyData) {
    return (
      <div className="bg-surface-50 border border-line rounded-clinical p-3 flex flex-col items-center justify-center text-center py-6">
        <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">
          Receptor binding inactive
        </span>
        <p className="text-[11px] text-ink-subtle mt-1 max-w-[280px]">
          Add active compounds or simulate an experience to map physical neuro-receptor occupancy in real-time.
        </p>
      </div>
    );
  }

  const { occupancies, activations } = occupancyData;

  return (
    <div className="bg-surface-50 border border-line rounded-clinical p-4 space-y-3.5 shadow-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-line pb-2 flex-none">
        <div>
          <span className="text-[9px] uppercase font-bold text-accent-500 tracking-wider">Clinical Pharmacology</span>
          <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">{title}</h3>
        </div>
        <span className="text-[8.5px] font-mono bg-accent-500/10 border border-accent-500/20 text-accent-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
          Live Occupancies
        </span>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar flex-1">
        {RECEPTOR_DEFS.map((rec) => {
          const key = rec.key;
          const name = rec.name;
          const desc = rec.desc;
          
          // Net activation index
          const activation = activations[key] ?? 0;
          
          // Calculate total occupancy bound by all compounds at this receptor
          let totalOccupancy = 0;
          const drugShares: { name: string; share: number; isAntagonist: boolean }[] = [];
 
          for (const drugId in occupancies) {
            const occMap = occupancies[drugId];
            const occ = occMap[key] ?? 0;
            if (occ > 0.005) {
              totalOccupancy += occ;
              const props = COMPOUND_DATABASE[drugId];
              let eps = props?.efficacy[key] ?? 1.0;
              let isAntagonist = eps < 0;
              if (props?.structuralPhysics?.[key]) {
                const geo = props.structuralPhysics[key]!;
                const d_D155 = geo.d_D155_amine_A ?? 2.9;
                const theta_W336 = geo.theta_W336_displacement ?? 0.0;
                const E_pi = geo.E_pi_phenyl_traps ?? 0.0;

                const saltBridgeScore = Math.exp(-Math.abs(d_D155 - 2.9) / 0.4);
                const rotamerToggleScore = Math.tanh(theta_W336 / 45.0);
                const rawCalculatedSignal = (saltBridgeScore * rotamerToggleScore) - E_pi;
                const dynamicEps = theta_W336 >= 45.0 ? Math.max(0.1, rawCalculatedSignal) : -Math.abs(rawCalculatedSignal);
                isAntagonist = dynamicEps < 0;
              }
              drugShares.push({
                name: props?.name ?? drugId,
                share: Math.round(occ * 100),
                isAntagonist,
              });
            }
          }
 
          const displayOccupancy = Math.min(100, Math.round(totalOccupancy * 100));
          
          // Determine color scheme based on net activation type (Agonist vs Antagonist)
          let activationLabel = "Neutral";
          let badgeColor = "bg-surface-0 border-line text-ink-subtle";
          let barBgColor = "bg-accent-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]";
 
          if (activation > 0.8) {
            activationLabel = `${activation > 1.25 ? "Releaser" : "Agonist"} (+${activation.toFixed(2)})`;
            badgeColor = "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";
            barBgColor = "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]";
          } else if (activation > 0.1) {
            activationLabel = `Agonist (+${activation.toFixed(2)})`;
            badgeColor = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
            barBgColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
          } else if (activation < -0.1) {
            activationLabel = `Blocker (${activation.toFixed(2)})`;
            badgeColor = "bg-rose-500/15 border-rose-500/30 text-rose-400";
            barBgColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
          }
 
          if (displayOccupancy === 0) {
            activationLabel = "Inactive";
            badgeColor = "bg-surface-1/50 border-line text-ink-muted";
            barBgColor = "bg-line";
          }
 
          return (
            <div key={key} className="border border-line rounded-clinical bg-surface-0/60 p-2.5 space-y-2 hover:border-line-strong transition-all duration-300">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                    {name}
                    {displayOccupancy > 0 && (
                      <span className="text-[9px] font-mono text-ink-muted">
                        ({displayOccupancy}% bound)
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] text-ink-muted leading-tight mt-0.5 font-mono">{desc}</div>
                </div>
 
                <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                  {activationLabel}
                </span>
              </div>
 
              {/* Progress bar container */}
              <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${barBgColor}`}
                  style={{ width: `${displayOccupancy}%` }}
                />
              </div>
 
              {/* Fractional drug breakdowns */}
              {drugShares.length > 0 && (
                <div className="space-y-1.5 mt-1 border-t border-line/30 pt-1.5">
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-mono text-ink-subtle">
                    <span className="text-ink-muted uppercase tracking-wider text-[8px] font-bold">Bound:</span>
                    {drugShares.map((share, idx) => (
                      <span key={share.name} className="flex items-center">
                        <span className={share.isAntagonist ? "text-rose-400" : "text-emerald-400"}>
                          {share.name}
                        </span>
                        <span className="text-ink-muted ml-0.5">({share.share}%)</span>
                        {idx < drugShares.length - 1 && <span className="text-line mx-1.5">·</span>}
                      </span>
                    ))}
                  </div>
                  
                  {/* Pocket Mechanics Matrix Log */}
                  {Object.keys(occupancies).map((drugId) => {
                    const occMap = occupancies[drugId];
                    const occ = occMap[key] ?? 0;
                    if (occ <= 0.005) return null;
                    
                    const props = COMPOUND_DATABASE[drugId];
                    if (!props?.structuralPhysics?.[key]) return null;
                    
                    const geo = props.structuralPhysics[key]!;
                    const isActive = (geo.delta_TM6_outward_A ?? 0) >= 4.5;
                    
                    return (
                      <div key={`${drugId}-physics`} className="mt-1.5 bg-accent-500/5 border border-accent-500/10 rounded p-2 text-[8.5px] font-mono space-y-1 text-accent-300">
                        <div className="flex items-center justify-between font-bold text-accent-400">
                          <span>⚛️ {props.name} Pocket Mechanics:</span>
                          <span className={isActive ? "text-indigo-400" : "text-rose-400"}>
                            {isActive ? "R* Active Agonist" : "Inactive Antagonist Block"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 text-ink-subtle">
                          <div>D155 Dist: <span className="text-white font-bold">{(geo.d_D155_amine_A ?? 0).toFixed(1)}Å</span></div>
                          <div>W336 Shift: <span className="text-white font-bold">{(geo.theta_W336_displacement ?? 0).toFixed(0)}°</span></div>
                          <div>Pi-Stack: <span className="text-white font-bold">{(geo.E_pi_phenyl_traps ?? 0).toFixed(3)} eV</span></div>
                          <div>ΔTM6 Out: <span className="text-white font-bold">{(geo.delta_TM6_outward_A ?? 0).toFixed(1)}Å</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[9px] text-ink-muted font-mono leading-relaxed border-t border-line pt-2 mt-2">
        * competitive pharmacodynamics resolve agonist/antagonist displacement: O_i,r = (C_i / K_i) / (1 + Σ C_j / K_j).
      </div>
    </div>
  );
}
