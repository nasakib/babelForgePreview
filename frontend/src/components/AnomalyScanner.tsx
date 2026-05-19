"use client";

/**
 * babelForge — Anomaly Scanner.
 *
 * Two modes:
 *   - VERIFIED  Only fires on guideline-anchored thresholds (USPSTF,
 *               ACC/AHA, KDIGO, ADA, NCEP ATP III, WHO, AAP, ATA). Every
 *               hit carries a citation. Suitable as a "clinical-grade
 *               heads-up" — never a diagnosis.
 *   - NOVICE    Adds looser pattern hints from self-report data (sleep,
 *               exercise, alcohol, perceived stress, BMI extremes, etc.)
 *               useful for users without lab work loaded.
 *
 * Output is color-coded by body system (palette.bodySystems), severity
 * badge (info / watch / concern / urgent), expandable citations, and a
 * prominent "Not medical advice" banner pinned to the top.
 */

import { useMemo, useState } from "react";
import { palette } from "@/lib/theme/palette";
import {
  scanAnomalies,
  type AnomalyScanResult,
} from "@/lib/anomaly/scan";
import type {
  AnomalyHit,
  AnomalyMode,
  AnomalySeverity,
  AnomalySystem,
} from "@/lib/anomaly/rules";
import type { PatientProfile } from "@/lib/patient/profile";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";

const SEV_COLOR: Record<AnomalySeverity, string> = {
  urgent: palette.crit,
  concern: palette.warn,
  watch: palette.info,
  info: palette.accent[400],
};

const SEV_LABEL: Record<AnomalySeverity, string> = {
  urgent: "URGENT",
  concern: "CONCERN",
  watch: "WATCH",
  info: "INFO",
};

function systemColor(system: AnomalySystem): string {
  const map = palette.bodySystems as Record<string, string>;
  return map[system] ?? palette.accent[400];
}

interface Props {
  profile: PatientProfile;
  stack?: Array<{ name?: string; class?: string; dose?: number }>;
  initialMode?: AnomalyMode;
}

export default function AnomalyScanner({ profile, stack = [], initialMode = "verified" }: Props) {
  const [mode, setMode] = useState<AnomalyMode>(initialMode);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const result: AnomalyScanResult = useMemo(
    () => scanAnomalies(profile, { mode, stack }),
    [profile, mode, stack],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const systems = Object.keys(result.bySystem) as AnomalySystem[];

  return (
    <div className="space-y-3">
      <div
        className="rounded-clinical border border-warn/40 bg-warn/5 p-2.5 text-[11px] text-ink-subtle"
        role="note"
      >
        <span className="font-bold text-warn mr-1.5">NOT MEDICAL ADVICE.</span>
        {DISCLAIMER_TEXT}
      </div>

      {/* Mode + counts header */}
      <div className="clinical-card">
        <div className="clinical-card-header flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="status-dot ok" />
            <span className="section-label-strong">
              Anomaly Scan · {mode === "verified" ? "Verified Mode" : "Novice Mode"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("verified")}
              className={`px-2.5 py-1 rounded-clinical text-[10px] font-mono uppercase tracking-widest2 border transition ${
                mode === "verified"
                  ? "border-accent-500 bg-accent-500/15 text-accent-300"
                  : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
              aria-pressed={mode === "verified"}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setMode("novice")}
              className={`px-2.5 py-1 rounded-clinical text-[10px] font-mono uppercase tracking-widest2 border transition ${
                mode === "novice"
                  ? "border-accent-500 bg-accent-500/15 text-accent-300"
                  : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
              aria-pressed={mode === "novice"}
            >
              Novice
            </button>
          </div>
        </div>

        <div className="p-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest2">
          {(["urgent", "concern", "watch", "info"] as AnomalySeverity[]).map((s) => (
            <div
              key={s}
              className="flex items-center gap-1.5 px-2 py-1 rounded-clinical border"
              style={{ borderColor: `${SEV_COLOR[s]}55`, color: SEV_COLOR[s] }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: SEV_COLOR[s] }} />
              {SEV_LABEL[s]} · {result.counts[s]}
            </div>
          ))}
          <div className="ml-auto text-ink-muted">
            {mode === "verified"
              ? "Rules fire only on published thresholds with citations."
              : "Adds self-report pattern hints — looser, no diagnosis."}
          </div>
        </div>
      </div>

      {/* Results */}
      {result.hits.length === 0 ? (
        <div className="clinical-card p-4 text-[12px] text-ink-muted">
          No flags from the entered data.{" "}
          {mode === "verified"
            ? "Switch to Novice mode for broader pattern hints."
            : "Add vitals, labs, or lifestyle data to widen the scan."}
        </div>
      ) : (
        <div className="space-y-3">
          {systems.map((sys) => {
            const color = systemColor(sys);
            const hits = result.bySystem[sys];
            return (
              <section
                key={sys}
                className="clinical-card"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <header className="clinical-card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}88` }}
                    />
                    <span className="section-label-strong" style={{ color }}>
                      {sys}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
                    {hits.length} flag{hits.length === 1 ? "" : "s"}
                  </span>
                </header>
                <ul className="divide-y divide-line">
                  {hits.map((h) => (
                    <li key={h.id} className="p-3">
                      <HitRow hit={h} expanded={expanded.has(h.id)} onToggle={() => toggle(h.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HitRow({
  hit,
  expanded,
  onToggle,
}: {
  hit: AnomalyHit;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sevColor = SEV_COLOR[hit.severity];
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start gap-2"
        aria-expanded={expanded}
      >
        <span
          className="mt-[3px] text-[9px] font-mono uppercase tracking-widest2 px-1.5 py-0.5 rounded-clinical border whitespace-nowrap"
          style={{ borderColor: `${sevColor}66`, color: sevColor }}
        >
          {SEV_LABEL[hit.severity]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-ink leading-snug">{hit.title}</div>
          <div className="text-[11.5px] text-ink-subtle mt-1 leading-relaxed">{hit.message}</div>
        </div>
        <span className="text-ink-dim text-[12px] mt-1">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="mt-2 pl-[58px] space-y-1.5 text-[11.5px]">
          <div className="text-ink-subtle">
            <span className="text-ink-muted font-mono text-[10px] uppercase tracking-widest2 mr-1.5">
              Next step
            </span>
            {hit.nextStep}
          </div>
          {hit.citations.length > 0 && (
            <div className="text-ink-dim">
              <span className="text-ink-muted font-mono text-[10px] uppercase tracking-widest2 mr-1.5">
                Citations
              </span>
              {hit.citations.join(" · ")}
            </div>
          )}
          {hit.citations.length === 0 && (
            <div className="text-ink-dim italic text-[10.5px]">
              Novice-mode pattern hint — not anchored to a single guideline citation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
