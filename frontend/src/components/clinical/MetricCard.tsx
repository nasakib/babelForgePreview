import { ReactNode } from "react";

export type MetricTone = "neutral" | "ok" | "warn" | "crit" | "info";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: MetricTone;
  /** Optional 0..1 progress bar shown below the value. */
  progress?: number;
  /** Optional swatch color (overrides tone styling). */
  accentColor?: string;
  hint?: string;
}

const toneStyles: Record<MetricTone, string> = {
  neutral: "text-ink",
  ok: "text-ok",
  warn: "text-warn",
  crit: "text-crit",
  info: "text-info",
};

/**
 * Compact, color-coded metric tile. Used by the console, stack simulator,
 * fMRI panel, and signal analyzer for a unified clinical readout style.
 */
export default function MetricCard({
  label,
  value,
  unit,
  tone = "neutral",
  progress,
  accentColor,
  hint,
}: MetricCardProps) {
  const valueColor = accentColor ? { color: accentColor } : undefined;
  const valueClass = accentColor ? "" : toneStyles[tone];
  const pct =
    progress === undefined
      ? undefined
      : Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div className="rounded-clinical border border-line bg-surface-50 p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">
          {label}
        </span>
        {accentColor && (
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: accentColor, boxShadow: `0 0 4px ${accentColor}` }}
            aria-hidden
          />
        )}
      </div>
      <div className={`flex items-baseline gap-1 ${valueClass}`} style={valueColor}>
        <span className="text-lg font-mono font-bold leading-tight">{value}</span>
        {unit && <span className="text-[10px] text-ink-muted font-mono">{unit}</span>}
      </div>
      {pct !== undefined && (
        <div className="h-1 rounded-full bg-surface-200 overflow-hidden">
          <div
            className="h-full transition-[width] duration-200"
            style={{
              width: `${pct}%`,
              background: accentColor ?? "currentColor",
            }}
          />
        </div>
      )}
      {hint && (
        <span className="text-[10px] text-ink-dim leading-snug">{hint}</span>
      )}
    </div>
  );
}
