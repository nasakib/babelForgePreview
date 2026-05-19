"use client";

import { BAND_BY_KEY, BandKey, Stimulus } from "@/lib/signal/bands";

interface SignalMetricsBarProps {
  stimulus: Stimulus | null;
  dominantBand: BandKey | null;
  rms: number;
}

function entropyLabel(stim: Stimulus | null): { label: string; tone: string } {
  if (!stim) return { label: "Moderate", tone: "text-ink" };
  if (stim.type === "Psychedelic") return { label: "High (Chaotic)", tone: "text-warn" };
  if (stim.type === "Depressant") return { label: "Low (Ordered)", tone: "text-info" };
  if (stim.type === "TMS") return { label: "Very Low (Locked)", tone: "text-accent-400" };
  return { label: "Moderate", tone: "text-ink" };
}

/**
 * The colour-coded metrics strip displayed under the live waveform.
 * Reads from the live tick (`dominantBand`, `rms`) instead of guessing
 * from the stimulus, so the displayed values always match the canvas.
 */
export default function SignalMetricsBar({
  stimulus,
  dominantBand,
  rms,
}: SignalMetricsBarProps) {
  const band = dominantBand ? BAND_BY_KEY[dominantBand] : null;
  const entropy = entropyLabel(stimulus);
  const power = Math.round(Math.max(0, Math.min(1, rms)) * 100);

  return (
    <div className="p-4 bg-surface-50/95 border border-line-strong rounded-clinical backdrop-blur-xl shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <span className="block text-[9px] uppercase font-bold text-accent-400 mb-1 tracking-widest">
          Dominant Band
        </span>
        <span
          className="text-base font-mono font-bold"
          style={{ color: band?.color ?? "var(--ink, #fff)" }}
        >
          {band ? `${band.symbol} ${band.label}` : "—"}
        </span>
        {band && (
          <span className="block text-[10px] text-ink-muted mt-0.5">{band.hzLabel}</span>
        )}
      </div>

      <div>
        <span className="block text-[9px] uppercase font-bold text-accent-400 mb-1 tracking-widest">
          Power (RMS)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-base font-mono font-bold text-ink">{power}%</span>
          <div className="flex-1 h-1 rounded-full bg-surface-200 overflow-hidden max-w-[80px]">
            <div
              className="h-full transition-[width] duration-200"
              style={{
                width: `${power}%`,
                background: band?.color ?? "#1f6dff",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <span className="block text-[9px] uppercase font-bold text-accent-400 mb-1 tracking-widest">
          Signal Entropy
        </span>
        <span className={`text-base font-mono font-bold ${entropy.tone}`}>
          {entropy.label}
        </span>
      </div>

      <div>
        <span className="block text-[9px] uppercase font-bold text-accent-400 mb-1 tracking-widest">
          Active Intervention
        </span>
        <span
          className={`text-sm font-bold ${stimulus ? "text-crit" : "text-ink-muted"}`}
        >
          {stimulus ? stimulus.category : "None (Healthy Baseline)"}
        </span>
      </div>
    </div>
  );
}
