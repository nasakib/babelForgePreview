"use client";

/**
 * babelForge — fMRI Workbench.
 *
 * Upload an fMRI dataset (CSV BOLD matrix or any file that triggers
 * physiologically plausible synthesis on the backend), then run the
 * physics / chemistry / clinical engines against it. Results land back
 * into the global AIContext so NeuroCanvas, the wisdom selector, and
 * the AI assistant all light up with the patient's actual data.
 */

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
import { useAI } from "@/context/AIContext";
import type { Pathology } from "@/lib/engine/topology";
import { PATHOLOGIES } from "@/lib/engine/topology";
import { parseBackendResponse, validateDataset, type FmriDataset } from "@/lib/fmri/dataset";
import PanelHeader from "@/components/palantir/PanelHeader";

import {
  computePSD,
  computeHurst,
  computePLV,
  computeNetworkSummary,
  projectStackEffect,
  projectClinical,
  globalIntegrityFromFC,
  metastability,
} from "@/lib/fmri/analyses";

type TabKey = "topology" | "bold" | "fc" | "engines";

interface EngineResults {
  psd?: ReturnType<typeof computePSD>;
  hurst?: ReturnType<typeof computeHurst>;
  plv?: ReturnType<typeof computePLV>;
  netSummary?: ReturnType<typeof computeNetworkSummary>;
  stackEffect?: ReturnType<typeof projectStackEffect>;
  clinical?: ReturnType<typeof projectClinical>;
  meta?: number;
  integrity?: number;
}

export default function FMRIAnalysis() {
  const {
    triggerAIAnalysis,
    setCurrentModule,
    setActivePathologies,
    activeStack,
    fmriDataset,
    setFmriDataset,
    setIntegrityScore,
  } = useAI();

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("topology");
  const [results, setResults] = useState<EngineResults>({});
  const [leftMinimized, setLeftMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentModule("fmri-analysis");
  }, [setCurrentModule]);

  // Whenever a new dataset lands, prime the headline metrics.
  useEffect(() => {
    if (!fmriDataset) return;
    const integrity = globalIntegrityFromFC(fmriDataset.fcMatrix);
    setResults({
      integrity,
      meta: metastability(fmriDataset.fcMatrix),
    });
    setIntegrityScore(integrity);
  }, [fmriDataset, setIntegrityScore]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://babelforge-backend-6zvkkshyoq-uc.a.run.app";
      const response = await fetch(`${backendUrl}/api/fmri/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Analysis service returned HTTP ${response.status}`);
      const data = await response.json();

      const ds = parseBackendResponse(data);
      if (!ds) {
        throw new Error(
          "Backend response missing required numerical fields (parcels / time_series / fc_matrix).",
        );
      }
      const problem = validateDataset(ds);
      if (problem) throw new Error(problem);

      setFmriDataset(ds);

      const knownSet = new Set<string>(PATHOLOGIES as readonly string[]);
      const detected = (data.diagnostic_profile ?? []).filter((p: string) =>
        knownSet.has(p),
      ) as Pathology[];
      setActivePathologies(detected);
      setTab("topology");
    } catch (error: any) {
      const msg = error?.message ?? "Failed to connect to the backend analysis engine.";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const runEngine = (key: keyof EngineResults) => {
    if (!fmriDataset) return;
    setResults((prev) => {
      const next = { ...prev };
      switch (key) {
        case "psd":
          next.psd = computePSD(fmriDataset);
          break;
        case "hurst":
          next.hurst = computeHurst(fmriDataset);
          break;
        case "plv":
          next.plv = computePLV(fmriDataset);
          break;
        case "netSummary":
          next.netSummary = computeNetworkSummary(fmriDataset);
          break;
        case "stackEffect":
          next.stackEffect = projectStackEffect(fmriDataset, activeStack as any[]);
          break;
        case "clinical": {
          const sum = next.netSummary ?? computeNetworkSummary(fmriDataset);
          next.netSummary = sum;
          next.clinical = projectClinical(fmriDataset, sum);
          break;
        }
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas lg:block">
      {/* Background Canvas / Main Display */}
      <div className="lg:absolute lg:inset-0 z-0 min-h-[50vh] lg:min-h-0 relative bg-canvas">
        {!fmriDataset && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest2 mb-2">Awaiting fMRI Upload</p>
              <p className="text-[10px] text-ink-subtle">
                Drop a file on the left to bring the engines online.
              </p>
            </div>
          </div>
        )}
        
        {/* Floating View Controls on top right */}
        {fmriDataset && (
          <div className="absolute top-4 right-4 z-20">
            <WorkbenchTabs tab={tab} setTab={setTab} hasDataset={!!fmriDataset} />
          </div>
        )}

        {fmriDataset && tab === "topology" && <NeuroCanvas />}
        {fmriDataset && tab === "bold" && <BoldViewer ds={fmriDataset} />}
        {fmriDataset && tab === "fc" && <FCHeatmap ds={fmriDataset} />}
        {fmriDataset && tab === "engines" && (
          <div className="absolute inset-0 pt-20 overflow-y-auto px-4 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
              <EngineConsole
                ds={fmriDataset}
                results={results}
                runEngine={runEngine}
                hasStack={(activeStack as any[]).length > 0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Left Sidebar: Upload + headline metrics */}
      <aside className={`w-full lg:absolute lg:left-4 lg:top-4 z-10 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${leftMinimized ? 'lg:w-auto h-auto' : 'lg:w-[360px] lg:bottom-4 overflow-y-auto'}`}>
        <PanelHeader 
          title="fMRI Workbench" 
          subtitle={leftMinimized ? "" : "Data Ingestion & Extraction"}
          onToggle={() => setLeftMinimized(!leftMinimized)}
          minimized={leftMinimized}
        />

        {!leftMinimized && (
          <>
          <div className="p-4 flex-none">
          <p className="text-xs text-ink-muted mb-6 leading-relaxed">
          Upload a CSV BOLD matrix (parcels × TR or TR × parcels) or any file to trigger
          physiologically plausible synthesis. Then apply the babelForge engines.
        </p>

        <div className="clinical-card p-4 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv,.nii,.gz,.json,.tsv,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-accent-500/30 hover:border-accent-400 bg-accent-500/5 hover:bg-accent-500/10 rounded-clinical transition-colors flex flex-col items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <span className="text-sm font-bold text-accent-200">Select File</span>
            <span className="text-[10px] text-ink-muted">.csv, .tsv, .nii, .gz, .json</span>
          </button>

          {file && (
            <div className="text-xs font-mono text-ink-subtle mb-3 truncate px-2 bg-surface-100 py-2 rounded border border-line">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full text-ink text-xs font-bold uppercase tracking-widest py-3 rounded-clinical shadow-md flex items-center justify-center gap-2 transition-all ${
              !file || isUploading ? "bg-slate-400 cursor-not-allowed" : "btn-primary"
            }`}
          >
            {isUploading ? "Processing..." : "Upload & Analyze"}
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 clinical-card p-3 border border-crit/40 bg-crit/10 text-crit text-[11px] font-mono"
          >
            <div className="font-bold uppercase tracking-widest2 mb-1">Upload failed</div>
            <div className="text-ink-subtle">{errorMsg}</div>
          </div>
        )}

        {fmriDataset && <DatasetHeadline ds={fmriDataset} results={results} />}

        {fmriDataset && (
          <button
            onClick={() =>
              triggerAIAnalysis(
                `Analyze the uploaded fMRI dataset (source=${fmriDataset.source}, ${fmriDataset.parcels.length} parcels, mean FC ${fmriDataset.stats.meanFC.toFixed(3)}, entropy ${fmriDataset.stats.entropy.toFixed(3)}). Diagnostic profile: ${fmriDataset.diagnosticProfile.join(", ") || "none"}. Quote the brain tokens above and recommend a stack.`,
              )
            }
            className="mt-4 w-full bg-accent-500/10 hover:bg-accent-500/15 text-accent-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-all border border-accent-500/30"
          >
            Consult FORGEai
          </button>
        )}
      </div>
      </>
      )}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar headline block
// ---------------------------------------------------------------------------
function DatasetHeadline({ ds, results }: { ds: FmriDataset; results: EngineResults }) {
  return (
    <div className="mt-6 clinical-card p-4 animate-fade-in-up">
      <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-3 border-b border-line pb-2">
        Dataset
      </h3>
      <div className="space-y-3 text-xs">
        <Row label="Source" value={ds.source} />
        <Row label="Parcels" value={ds.parcels.length.toString()} />
        <Row label="TR (s)" value={ds.tr.toFixed(2)} />
        <Row label="Samples" value={(ds.timeSeries[0]?.length ?? 0).toString()} />
        <Row label="Mean |FC|" value={ds.stats.meanFC.toFixed(3)} />
        <Row label="FC entropy" value={ds.stats.entropy.toFixed(3)} />
        {typeof results.integrity === "number" && (
          <Row label="Integrity" value={`${results.integrity}/100`} />
        )}
        {typeof results.meta === "number" && (
          <Row label="Metastability" value={results.meta.toFixed(3)} />
        )}
        <div>
          <span className="block text-[9px] uppercase font-bold text-ink-muted mb-1">
            Detected Pathologies
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {ds.diagnosticProfile.length > 0 ? (
              ds.diagnosticProfile.map((path, i) => (
                <span key={i} className="bg-crit/20 text-crit text-[9px] font-bold px-2 py-1 rounded">
                  {path}
                </span>
              ))
            ) : (
              <span className="text-xs text-ink-muted">None detected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] uppercase font-bold text-ink-muted">{label}</span>
      <span className="font-mono text-accent-400">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function WorkbenchTabs({
  tab,
  setTab,
  hasDataset,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  hasDataset: boolean;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "topology", label: "Topology" },
    { key: "bold", label: "BOLD" },
    { key: "fc", label: "Connectivity" },
    { key: "engines", label: "Engines" },
  ];
  return (
    <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-line bg-surface-0/50">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          disabled={!hasDataset}
          className={`text-[10px] font-bold uppercase tracking-widest2 px-3 py-1.5 rounded-md transition ${
            tab === t.key
              ? "bg-accent-500/15 text-accent-300 border border-accent-500/40"
              : "text-ink-muted hover:text-ink"
          } ${!hasDataset ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BOLD time-series viewer (canvas line plot)
// ---------------------------------------------------------------------------
function BoldViewer({ ds }: { ds: FmriDataset }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = c.clientWidth);
    const h = (c.height = c.clientHeight);
    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, w, h);
    const T = ds.timeSeries[0]?.length ?? 0;
    if (T === 0) return;
    const colors: Record<string, string> = {
      Default: "#ff8a4d",
      Control: "#4d8dff",
      Limbic: "#ff5d8f",
      Visual: "#a06bff",
      SomatoMotor: "#34c997",
      VentAttn: "#ffd24d",
      DorsalAttn: "#4dc9dd",
    };
    const N = ds.timeSeries.length;
    const laneH = h / N;
    ds.timeSeries.forEach((trace, i) => {
      const color = colors[ds.parcels[i]?.network ?? "Default"] ?? "#888";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const yCenter = i * laneH + laneH / 2;
      const amp = laneH * 0.4;
      for (let t = 0; t < T; t++) {
        const x = (t / (T - 1)) * w;
        const y = yCenter - trace[t] * amp;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#a8b0bf";
      ctx.font = "9px monospace";
      ctx.fillText(ds.parcels[i]?.id ?? `P${i}`, 4, yCenter - laneH / 2 + 9);
    });
  }, [ds]);

  return (
    <div className="w-full h-full p-3">
      <canvas ref={ref} className="w-full h-full block rounded-clinical border border-line" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FC heatmap (canvas)
// ---------------------------------------------------------------------------
function FCHeatmap({ ds }: { ds: FmriDataset }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const size = Math.min(c.clientWidth, c.clientHeight);
    c.width = size;
    c.height = size;
    const n = ds.fcMatrix.length;
    const cell = size / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = ds.fcMatrix[i][j];
        const r = v > 0 ? Math.round(60 + 190 * v) : Math.round(60 + 190 * Math.abs(v));
        const g = Math.round(60 + 60 * (1 - Math.abs(v)));
        const b = v < 0 ? Math.round(60 + 190 * Math.abs(v)) : Math.round(60 + 60 * (1 - v));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(j * cell, i * cell, cell + 0.5, cell + 0.5);
      }
    }
  }, [ds]);
  return (
    <div className="w-full h-full p-3 flex items-center justify-center">
      <canvas
        ref={ref}
        className="block rounded-clinical border border-line max-w-full max-h-full"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Engine console
// ---------------------------------------------------------------------------
function EngineConsole({
  ds,
  results,
  runEngine,
  hasStack,
}: {
  ds: FmriDataset;
  results: EngineResults;
  runEngine: (k: keyof EngineResults) => void;
  hasStack: boolean;
}) {
  const psdSummary = useMemo(() => {
    if (!results.psd) return null;
    const r = results.psd;
    const meanPeak = r.peakHz.reduce((a, b) => a + b, 0) / r.peakHz.length;
    return `Mean peak Hz: ${meanPeak.toFixed(3)} · per-parcel peak range [${Math.min(...r.peakHz).toFixed(3)}, ${Math.max(...r.peakHz).toFixed(3)}]`;
  }, [results.psd]);

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
      <EngineRow
        title="Power Spectral Density"
        desc="Per-parcel one-sided DFT power spectrum (Hz from TR)."
        onRun={() => runEngine("psd")}
        result={psdSummary}
      />
      <EngineRow
        title="Hurst Exponent (R/S)"
        desc="Long-range temporal correlations of BOLD per parcel."
        onRun={() => runEngine("hurst")}
        result={
          results.hurst
            ? `mean H = ${results.hurst.mean.toFixed(3)} · ${results.hurst.highCount} parcels H>0.75 · ${results.hurst.lowCount} parcels H<0.55`
            : null
        }
      />
      <EngineRow
        title="Phase Locking Value (PLV)"
        desc="Pairwise PLV using narrow-band quadrature phase extraction."
        onRun={() => runEngine("plv")}
        result={
          results.plv
            ? `Global mean PLV = ${results.plv.globalCoherence.toFixed(3)}`
            : null
        }
      />
      <EngineRow
        title="Network Summary"
        desc="Weighted degree, hubs, within/between-network FC, Newman modularity (Yeo partition)."
        onRun={() => runEngine("netSummary")}
        result={
          results.netSummary
            ? `Modularity Q = ${results.netSummary.modularity.toFixed(3)} · ${results.netSummary.hubs.length} hubs`
            : null
        }
      />
      <EngineRow
        title="Stack Effect Projection"
        desc="Project the active pharmacological stack onto this dataset (chemistry engine)."
        disabled={!hasStack}
        disabledLabel="No active stack — build one in the simulator"
        onRun={() => runEngine("stackEffect")}
        result={
          results.stackEffect
            ? `Δ modularity ${results.stackEffect.modularityDelta.toFixed(3)} · Δ coherence ${results.stackEffect.coherenceDelta.toFixed(3)}`
            : null
        }
      />
      <EngineRow
        title="Clinical Projection"
        desc="Project PHQ-9 / GAD-7 equivalents from connectivity features."
        onRun={() => runEngine("clinical")}
        result={
          results.clinical
            ? `PHQ-9 ≈ ${results.clinical.phq9Equivalent} · GAD-7 ≈ ${results.clinical.gad7Equivalent}${
                results.clinical.antidepressantResponse
                  ? ` · SSRI 6-wk p=${results.clinical.antidepressantResponse.probResponse.toFixed(2)}`
                  : ""
              }`
            : null
        }
      />
      {results.netSummary && (
        <div className="clinical-card p-3 text-[10px] font-mono text-ink-muted">
          <div className="text-ink-subtle uppercase tracking-widest2 mb-1">
            Within-network FC
          </div>
          {Object.entries(results.netSummary.withinNetworkFC).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span>{k}</span>
              <span className="text-accent-400">{v.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[9px] text-ink-subtle italic pt-2">
        Dataset: {ds.parcels.length} parcels · {ds.timeSeries[0]?.length} TR samples. Engines run in
        the browser; numbers above reflect the loaded dataset, not a population norm.
      </p>
    </div>
  );
}

function EngineRow({
  title,
  desc,
  onRun,
  result,
  disabled,
  disabledLabel,
}: {
  title: string;
  desc: string;
  onRun: () => void;
  result: string | null;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <div className="clinical-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-ink truncate">{title}</div>
          <div className="text-[10px] text-ink-muted leading-tight mt-0.5">{desc}</div>
        </div>
        <button
          onClick={onRun}
          disabled={disabled}
          className={`shrink-0 text-[10px] font-bold uppercase tracking-widest2 px-3 py-1.5 rounded transition ${
            disabled
              ? "bg-surface-100 text-ink-muted cursor-not-allowed"
              : "bg-accent-500/15 hover:bg-accent-500/25 text-accent-300 border border-accent-500/40"
          }`}
        >
          Run
        </button>
      </div>
      {disabled && disabledLabel && (
        <div className="mt-2 text-[10px] text-ink-subtle italic">{disabledLabel}</div>
      )}
      {result && (
        <div className="mt-2 text-[11px] font-mono text-accent-200 border-t border-line/50 pt-2">
          {result}
        </div>
      )}
    </div>
  );
}
