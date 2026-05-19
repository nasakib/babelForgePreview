"use client";

import { BANDS } from "@/lib/signal/bands";
import type { BandKey } from "@/lib/signal/bands";

interface BandLegendProps {
  active?: BandKey | null;
  orientation?: "horizontal" | "vertical";
}

/**
 * Color-coded band legend with clinical role + frequency range tooltips.
 * Shared across the signal analyzer, console HUD, and reports.
 */
export default function BandLegend({ active, orientation = "horizontal" }: BandLegendProps) {
  const wrap =
    orientation === "horizontal"
      ? "flex flex-wrap gap-x-3 gap-y-1.5 items-center"
      : "flex flex-col gap-1.5";

  return (
    <ul className={wrap} aria-label="EEG frequency bands">
      {BANDS.map((b) => {
        const isActive = active === b.key;
        return (
          <li
            key={b.key}
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest2 transition ${
              isActive ? "text-ink" : "text-ink-muted"
            }`}
            title={`${b.label} (${b.hzLabel}) — ${b.role}`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-sm transition ${
                isActive ? "ring-2 ring-offset-1 ring-offset-canvas" : ""
              }`}
              style={{
                background: b.color,
                boxShadow: isActive ? `0 0 6px ${b.color}` : undefined,
              }}
            />
            <span>
              {b.symbol} {b.label}
            </span>
            <span className="text-ink-dim normal-case">{b.hzLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
