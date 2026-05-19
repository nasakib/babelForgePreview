"use client";

import type { Stimulus } from "@/lib/signal/bands";

export const DEFAULT_STIMULI: Stimulus[] = [
  {
    category: "Pharmacological",
    type: "Stimulant",
    label: "Stimulant (e.g. Amphetamine)",
    desc: "Increases high-frequency power, lowers amplitude.",
  },
  {
    category: "Pharmacological",
    type: "Depressant",
    label: "Depressant (e.g. Benzodiazepine)",
    desc: "Increases low-frequency amplitude, reduces noise.",
  },
  {
    category: "Pharmacological",
    type: "Psychedelic",
    label: "Psychedelic (e.g. Psilocybin)",
    desc: "Increases broadband noise and global entropy.",
  },
  {
    category: "Cognitive",
    type: "Focus",
    label: "Working Memory Task",
    desc: "Induces beta/gamma bursts in localized regions.",
  },
  {
    category: "Sensory",
    type: "Visual",
    label: "Photic Stimulation (Flash)",
    desc: "Induces transient sharp-wave spikes.",
  },
  {
    category: "Neuromodulatory",
    type: "TMS",
    label: "TMS (10Hz Alpha)",
    desc: "Forces rhythmic phase-locking at 10Hz.",
  },
];

interface StimulusSelectorProps {
  active: Stimulus | null;
  onSelect: (stim: Stimulus | null) => void;
  options?: Stimulus[];
}

/**
 * Listbox of available interventions. Pure presentation — state lives in
 * the page, so the same list can be reused inside reports or comparisons.
 */
export default function StimulusSelector({
  active,
  onSelect,
  options = DEFAULT_STIMULI,
}: StimulusSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-3">
        {options.map((stim) => {
          const selected = active?.label === stim.label;
          return (
            <button
              key={stim.label}
              type="button"
              onClick={() => onSelect(stim)}
              aria-pressed={selected}
              className={`w-full text-left p-4 rounded-clinical border transition-all ${
                selected
                  ? "bg-accent-500/10 border-accent-500/60 shadow-sm ring-1 ring-accent-500/40"
                  : "bg-surface-50 border-line hover:bg-surface-0"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
                  {stim.category}
                </span>
                {selected && (
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
                  </span>
                )}
              </div>
              <h4 className={`text-sm font-bold ${selected ? "text-accent-200" : "text-ink"}`}>
                {stim.label}
              </h4>
              <p className="text-[10px] text-ink-muted mt-1">{stim.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className="w-full bg-surface-200 hover:bg-surface-300 text-ink-subtle text-xs font-bold uppercase tracking-widest py-3 rounded-clinical transition-colors"
      >
        Reset to Baseline
      </button>
    </div>
  );
}
