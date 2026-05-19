"use client";

import { useState } from "react";
import { BABELFORGE_ENDPOINTS, babelforgeApi } from "@/lib/api/client";
import ApiStatusBadge from "@/components/clinical/ApiStatusBadge";

/**
 * In-app reference for both applications:
 *  - `babelForge`         — FastAPI backend (Cloud Run) exposing the
 *                           topology, pharma, chat and fMRI endpoints.
 *  - `babelForgePreview`  — this Next.js frontend.
 *
 * The endpoint catalogue is rendered from the same source-of-truth used by
 * the client, so the docs cannot drift from the implementation.
 */
export default function DocsPage() {
  const [tab, setTab] = useState<"overview" | "api" | "workflow">("overview");

  return (
    <div className="flex-1 flex flex-col w-full overflow-y-auto bg-canvas">
      <header className="border-b border-line bg-surface-0 px-6 py-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Operator Manual
            </span>
            <h1 className="text-2xl font-bold text-ink mt-1">
              babelForge &amp; babelForgePreview
            </h1>
            <p className="text-sm text-ink-muted mt-1 max-w-3xl">
              babelForge is the computational engine. babelForgePreview is the
              clinical UI you are using now. They speak over a small typed
              REST surface documented below.
            </p>
          </div>
          <ApiStatusBadge />
        </div>

        <nav
          role="tablist"
          aria-label="Documentation sections"
          className="flex gap-2 mt-2"
        >
          {(
            [
              ["overview", "Overview"],
              ["api", "API Reference"],
              ["workflow", "Clinical Workflow"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-clinical text-xs font-bold uppercase tracking-widest border transition ${
                tab === key
                  ? "border-accent-500 text-accent-300 bg-accent-500/10"
                  : "border-line text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-6 py-6 max-w-5xl w-full mx-auto">
        {tab === "overview" && <Overview />}
        {tab === "api" && <ApiReference />}
        {tab === "workflow" && <Workflow />}
      </main>
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-ink-subtle">
      <section>
        <h2 className="text-base font-bold text-ink mb-2">The two applications</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-clinical border border-line bg-surface-0 p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Backend
            </span>
            <h3 className="text-sm font-bold text-ink mt-1">babelForge</h3>
            <p className="text-xs mt-2">
              FastAPI service that hosts the topology generator, pharmacopeia
              projection, the FORGEai chat layer (Gemini 1.5 Flash), and the
              fMRI ingest pipeline. Deployed to Google Cloud Run.
            </p>
            <p className="text-[10px] font-mono text-ink-muted mt-3 break-all">
              {babelforgeApi.baseUrl}
            </p>
          </div>
          <div className="rounded-clinical border border-line bg-surface-0 p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Frontend
            </span>
            <h3 className="text-sm font-bold text-ink mt-1">babelForgePreview</h3>
            <p className="text-xs mt-2">
              Next.js 14 / React 18 / Tailwind app. Hosts the clinical canvas,
              the 3D Kuramoto visualizer, the stack simulator, the signal
              analyzer, and embeds FORGEai as a docked assistant.
            </p>
            <p className="text-[10px] font-mono text-ink-muted mt-3">
              env: NEXT_PUBLIC_API_URL → backend
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-ink mb-2">Modules</h2>
        <ul className="grid md:grid-cols-2 gap-3 text-xs">
          {[
            ["Console (/)", "Live integrity score, K* coupling, σ noise, optimisation."],
            ["Stack Builder (/stack-simulator)", "Composes a regimen on the active pathology mix."],
            ["Compound Library (/compounds)", "Reference cards for precision + conventional compounds."],
            ["Signal Analyzer (/signal-analyzer)", "Multi-band EEG with Stacked / Compress modes."],
            ["fMRI Ingest (/fmri-analysis)", "Upload BOLD → /api/fmri/analyze → patient topology."],
            ["Anomaly Scan (/anomaly-scan)", "Guideline-anchored heads-up scanner over vitals, labs, lifestyle. Verified + Novice modes."],
            ["11D Topology (/11d-projection)", "Real-time Kuramoto on the Schaefer-200 connectome."],
            ["Pharma Projection (/pharma-projection)", "Pre/post-treatment network projection from /api/pharma."],
            ["Validation (/studies)", "Reference studies and benchmarks."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-clinical border border-line bg-surface-50 p-3">
              <div className="font-mono text-[11px] text-accent-400">{t}</div>
              <div className="text-ink-muted mt-1">{d}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-ink mb-2">Keyboard</h2>
        <p className="text-xs">
          <kbd className="font-mono text-accent-300">F1</kbd>–
          <kbd className="font-mono text-accent-300">F10</kbd> jump between
          modules in the order shown above. Inputs and editable surfaces
          remain unaffected.
        </p>
      </section>
    </div>
  );
}

function ApiReference() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">
        All endpoints are namespaced under <code className="font-mono text-accent-300">/api</code>.
        Origin is taken from <code className="font-mono text-accent-300">NEXT_PUBLIC_API_URL</code> at
        build time, with the Cloud Run URL as the fallback.
      </p>
      {BABELFORGE_ENDPOINTS.map((ep) => (
        <article
          key={ep.path + ep.method}
          className="rounded-clinical border border-line bg-surface-0 p-4"
        >
          <header className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-clinical text-[10px] font-mono font-bold border ${
                ep.method === "GET"
                  ? "text-info border-info/40 bg-info/10"
                  : "text-warn border-warn/40 bg-warn/10"
              }`}
            >
              {ep.method}
            </span>
            <code className="font-mono text-sm text-ink">{ep.path}</code>
            {ep.requiresSecret && (
              <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-crit">
                requires GEMINI_API_KEY
              </span>
            )}
          </header>
          <h3 className="text-sm font-bold text-ink">{ep.title}</h3>
          <p className="text-xs text-ink-subtle mt-1 leading-relaxed">
            {ep.description}
          </p>
          {ep.requestExample && (
            <pre className="mt-3 text-[11px] font-mono bg-canvas border border-line rounded-clinical p-3 overflow-x-auto text-ink-subtle whitespace-pre-wrap">
              {ep.requestExample}
            </pre>
          )}
          {ep.responseShape && (
            <p className="mt-2 text-[11px] font-mono text-ink-muted">
              ↳ {ep.responseShape}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function Workflow() {
  const steps = [
    {
      t: "1. Compose a pathological state",
      d: "Open Console (F1) and toggle one or more pathologies. The client fetches /api/topology once and composes the modifiers locally — no extra round-trip per toggle.",
    },
    {
      t: "2. Build a regimen",
      d: "Stack Builder (F2) lets you add compounds. Repair/chaos vectors update K* and σ; the Console reflects the new integrity score in real time.",
    },
    {
      t: "3. Inspect oscillations",
      d: "Signal Analyzer (F4) renders synthetic LFPs across δ θ α β γ. Use Compress to collapse all five bands into one dominant-band-coloured trace for rapid scanning.",
    },
    {
      t: "4. Ingest a patient",
      d: "fMRI Ingest (F5) uploads a BOLD file to /api/fmri/analyze. The returned topology + diagnostic profile replaces the synthetic baseline for personalised exploration.",
    },
    {
      t: "5. Run an anomaly scan",
      d: "Anomaly Scan (F6) takes the patient's vitals, labs and lifestyle inputs and flags entries that cross guideline thresholds (Verified mode — ACC/AHA, ADA, KDIGO, NCEP ATP III, WHO, USPSTF) or looser self-report patterns (Novice mode). Pharmacology hits — DDIs, serotonin-syndrome risk, QT-prolongation, pregnancy and allergy matches — are folded into the same view. Not a diagnosis; a heads-up worth raising with a clinician.",
    },
    {
      t: "6. Ask FORGEai",
      d: "Open the docked assistant (bottom right). Every query is POSTed to /api/chat with the current module, pathologies, regimen and integrity score so answers are context-aware.",
    },
  ];
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li
          key={s.t}
          className="rounded-clinical border border-line bg-surface-0 p-4"
        >
          <div className="text-sm font-bold text-ink">{s.t}</div>
          <p className="text-xs text-ink-subtle mt-1 leading-relaxed">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}
