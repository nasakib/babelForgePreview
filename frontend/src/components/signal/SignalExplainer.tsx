"use client";

import {
  BAND_BY_KEY,
  BandKey,
  Stimulus,
  describeStimulus,
  predictDominantBand,
} from "@/lib/signal/bands";
import type { SignalMode } from "@/components/SignalCanvas";

interface SignalExplainerProps {
  stimulus: Stimulus | null;
  dominantBand: BandKey | null;
  intensity: number;
  mode: SignalMode;
}

/**
 * Live, plain-language readout of what the clinician is looking at.
 * Pulls explanations from the shared band model so all surfaces stay
 * in sync with the canonical clinical descriptions.
 */
export default function SignalExplainer({
  stimulus,
  dominantBand,
  intensity,
  mode,
}: SignalExplainerProps) {
  const liveBand = dominantBand ? BAND_BY_KEY[dominantBand] : predictDominantBand(stimulus);
  const intensityPct = Math.round(Math.max(0, Math.min(1, intensity)) * 100);

  return (
    <section
      aria-label="Signal interpretation"
      className="rounded-clinical border border-line-strong bg-surface-50/80 backdrop-blur p-4 text-xs leading-relaxed"
    >
      <header className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
          Interpretation
        </span>
        <span
          className="px-2 py-0.5 rounded-clinical text-[10px] font-mono uppercase tracking-widest"
          style={{
            color: liveBand.color,
            background: `${liveBand.color}1A`,
            border: `1px solid ${liveBand.color}55`,
          }}
        >
          {liveBand.symbol} {liveBand.label} dominant
        </span>
      </header>

      <p className="text-ink mb-2">
        <strong style={{ color: liveBand.color }}>
          {liveBand.label} ({liveBand.hzLabel})
        </strong>{" "}
        — {liveBand.role}.
      </p>
      <p className="text-ink-subtle mb-3">{liveBand.explain}</p>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1">
          <span>Dominance</span>
          <span style={{ color: liveBand.color }}>{intensityPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
          <div
            className="h-full transition-[width] duration-200"
            style={{
              width: `${intensityPct}%`,
              background: liveBand.color,
              boxShadow: `0 0 6px ${liveBand.color}`,
            }}
          />
        </div>
      </div>

      <p className="text-ink-subtle">{describeStimulus(stimulus)}</p>

      <p className="text-[10px] font-mono uppercase tracking-widest text-ink-dim mt-3">
        Mode: {mode === "compressed" ? "Compressed (single trace)" : "Stacked (per-band)"}
      </p>
    </section>
  );
}
