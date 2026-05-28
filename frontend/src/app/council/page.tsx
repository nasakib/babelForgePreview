"use client";

/**
 * Clinical Council — multi-discipline second opinion.
 *
 * Reads the patient profile saved by /anomaly-scan (shared localStorage
 * key), runs scanAnomalies + convene, then renders one card per
 * specialist who has something to say. Each card uses the discipline's
 * canonical hue from `palette.disciplines`.
 *
 * This is explicitly NOT medical advice. The banner up top says so. The
 * council is a research framing tool on top of guideline-anchored rules.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EMPTY_PROFILE, type PatientProfile } from "@/lib/patient/profile";
import { deriveMetrics } from "@/lib/patient/derived";
import { scanAnomalies } from "@/lib/anomaly/scan";
import type { AnomalyMode } from "@/lib/anomaly/rules";
import { convene } from "@/lib/council/orchestrate";
import { COUNCIL } from "@/lib/council/agents";

const STORAGE_KEY = "babelforge:anomaly:profile:v1";

function loadProfile(): PatientProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

const SEV_RING: Record<string, string> = {
  urgent: "ring-crit/40",
  concern: "ring-warn/40",
  watch: "ring-info/40",
  info: "ring-line",
};

const SEV_BADGE: Record<string, string> = {
  urgent: "bg-crit/15 text-crit border-crit/40",
  concern: "bg-warn/15 text-warn border-warn/40",
  watch: "bg-info/15 text-info border-info/40",
  info: "bg-surface-200 text-ink-muted border-line",
};

export default function CouncilPage() {
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [mode, setMode] = useState<AnomalyMode>("verified");
  const [filterId, setFilterId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const derived = useMemo(() => deriveMetrics(profile), [profile]);
  const scan = useMemo(() => scanAnomalies(profile, { mode }), [profile, mode]);
  const opinions = useMemo(() => convene(scan), [scan]);
  const visible = filterId ? opinions.filter((o) => o.agent.id === filterId) : opinions;

  const hasAnyData =
    profile.demographics?.ageYears ||
    Object.keys(profile.vitals ?? {}).length > 0 ||
    Object.keys(profile.labs ?? {}).length > 0;

  return (
    <div className="flex-1 flex flex-col bg-void relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <header className="mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Clinical · multi-discipline review
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-ink mt-1">Clinical Council</h1>
            <p className="text-sm text-ink-subtle mt-2 max-w-2xl">
              Twenty specialist lenses, one case. Each agent reviews the
              anomaly-scan output for their domain and weighs in. babelForge
              is a <span className="font-semibold text-ink">mathematical framework</span>; this is{" "}
              <span className="font-semibold text-warn">not medical advice</span> and does
              not replace a licensed clinician.
            </p>
          </header>

          {/* Mode + data source bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex rounded-clinical border border-line bg-surface-100 overflow-hidden">
              {(["verified", "novice"] as AnomalyMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest2 transition-colors ${
                    mode === m ? "bg-accent-500/15 text-accent-400" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Link
              href="/anomaly-scan"
              className="text-[10px] uppercase tracking-widest2 text-accent-400 hover:text-accent-500 underline-offset-4 hover:underline"
            >
              Edit patient data →
            </Link>
            <span className="text-[10px] uppercase tracking-widest2 text-ink-dim ml-auto">
              {hydrated ? `${opinions.length} specialists weighed in · ${scan.hits.length} flags` : "Loading…"}
            </span>
          </div>

          {/* Specialist filter strip */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setFilterId(null)}
              className={`px-2.5 py-1 rounded-clinical border text-[10px] uppercase tracking-widest2 ${
                filterId === null
                  ? "bg-accent-500/15 border-accent-500/40 text-accent-400"
                  : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              All
            </button>
            {COUNCIL.map((a) => {
              const active = a.id === filterId;
              const spoke = opinions.some((o) => o.agent.id === a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setFilterId(active ? null : a.id)}
                  className={`px-2.5 py-1 rounded-clinical border text-[10px] uppercase tracking-widest2 transition-opacity ${
                    active ? "" : spoke ? "" : "opacity-40"
                  }`}
                  style={{
                    borderColor: active ? a.color : undefined,
                    color: active ? a.color : a.color,
                    backgroundColor: active ? `${a.color}22` : "transparent",
                  }}
                  title={`${a.title} — ${a.scope}`}
                >
                  <span className="mr-1" aria-hidden>{a.glyph}</span>
                  {a.id}
                </button>
              );
            })}
          </div>

          {!hydrated ? null : !hasAnyData ? (
            <div className="rounded-clinical border border-dashed border-line bg-surface-0/40 p-8 text-center">
              <p className="text-sm text-ink-subtle">
                No patient data on this device yet.{" "}
                <Link href="/anomaly-scan" className="text-accent-400 underline">
                  Enter vitals, labs, and meds on the Anomaly Scan page
                </Link>
                {" "}— the council will read from the same dataset.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-clinical border border-line bg-surface-0/60 p-8 text-center">
              <p className="text-sm text-ink-subtle">
                {filterId
                  ? "This specialist has no remarks on the current dataset."
                  : "Nothing in this dataset crosses any specialist&apos;s thresholds. Add more data or switch to Novice mode for broader hints."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visible.map((op) => (
                <article
                  key={op.agent.id}
                  className={`rounded-clinical border bg-surface-0/70 backdrop-blur-md p-4 shadow-sm ring-1 ${SEV_RING[op.severity]}`}
                  style={{ borderLeft: `4px solid ${op.agent.color}` }}
                >
                  <header className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-clinical text-sm font-bold"
                        style={{ backgroundColor: `${op.agent.color}22`, color: op.agent.color }}
                        aria-hidden
                      >
                        {op.agent.glyph}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-ink leading-tight">
                          {op.agent.title}
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest2 text-ink-dim">
                          {op.agent.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-widest2 px-1.5 py-0.5 rounded border ${SEV_BADGE[op.severity]}`}
                    >
                      {op.severity}
                    </span>
                  </header>

                  <p className="text-xs text-ink-subtle leading-relaxed mb-3">
                    {op.framing}
                  </p>

                  {op.hits.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {op.hits.slice(0, 4).map((h, i) => (
                        <li
                          key={`${op.agent.id}-${h.id}-${i}`}
                          className="text-xs text-ink leading-snug flex gap-2"
                        >
                          <span className="text-ink-dim mt-0.5">›</span>
                          <span>
                            <span className="font-medium">{h.title}.</span>{" "}
                            <span className="text-ink-muted">{h.message}</span>
                          </span>
                        </li>
                      ))}
                      {op.hits.length > 4 && (
                        <li className="text-[10px] text-ink-dim italic">
                          + {op.hits.length - 4} more in this specialist&apos;s queue.
                        </li>
                      )}
                    </ul>
                  )}

                  {op.recommendations.length > 0 && (
                    <div className="border-t border-line pt-2 mt-2">
                      <p className="text-[10px] uppercase tracking-widest2 text-ink-dim mb-1">
                        Suggested next steps
                      </p>
                      <ul className="space-y-1">
                        {op.recommendations.slice(0, 3).map((r, i) => (
                          <li key={i} className="text-xs text-ink-subtle leading-snug">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <footer className="mt-8 text-[10px] text-ink-dim uppercase tracking-widest2">
            babelForge · research-grade mathematical framework · not medical advice
          </footer>
        </div>
      </div>
    </div>
  );
}
