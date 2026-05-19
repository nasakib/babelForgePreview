"use client";

import type { SignalMode } from "@/components/SignalCanvas";

interface SignalControlsProps {
  mode: SignalMode;
  onChange: (mode: SignalMode) => void;
}

/**
 * Stacked ↔ Compressed signal mode switcher. The "Compress Signal" action
 * collapses all five EEG bands into a single dominant-band-coloured trace
 * so the clinician can read overall brain state at a glance.
 */
export default function SignalControls({ mode, onChange }: SignalControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
        Signal View
      </span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("stacked")}
          aria-pressed={mode === "stacked"}
          className={`px-3 py-2 rounded-clinical text-xs font-bold uppercase tracking-widest border transition ${
            mode === "stacked"
              ? "border-accent-500 text-accent-300 bg-accent-500/10"
              : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
          }`}
        >
          Stacked
        </button>
        <button
          type="button"
          onClick={() => onChange("compressed")}
          aria-pressed={mode === "compressed"}
          className={`px-3 py-2 rounded-clinical text-xs font-bold uppercase tracking-widest border transition ${
            mode === "compressed"
              ? "border-accent-500 text-accent-300 bg-accent-500/10"
              : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
          }`}
          title="Collapse all five bands into a single colour-coded trace"
        >
          Compress
        </button>
      </div>
      <p className="text-[10px] text-ink-dim leading-relaxed">
        {mode === "stacked"
          ? "Each EEG band is rendered on its own baseline for differential analysis."
          : "All bands are summed into one waveform; line color tracks the dominant band frame-by-frame."}
      </p>
    </div>
  );
}
