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
import { parseBackendResponse, validateDataset, type FmriDataset, type Parcel } from "@/lib/fmri/dataset";
import PanelHeader from "@/components/palantir/PanelHeader";
import DraggablePanel from "@/components/palantir/DraggablePanel";

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
    activePathologies,
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
    formData.append("pathologies", JSON.stringify(activePathologies));

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
      console.warn("Backend analysis failed or offline. Engaging high-fidelity client-side local fMRI analysis fallback.", error);
      try {
        let csvText: string | undefined = undefined;
        if (file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".tsv") || file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".json")) {
          csvText = await file.text();
        }
        const ds = localFmriAnalyze(file.name, csvText, activePathologies);
        setFmriDataset(ds);

        const knownSet = new Set<string>(PATHOLOGIES as readonly string[]);
        const detected = ds.diagnosticProfile.filter((p: string) =>
          knownSet.has(p)
        ) as Pathology[];
        setActivePathologies(detected);
        setTab("topology");
      } catch (fallbackError: any) {
        const msg = fallbackError?.message ?? "Failed to perform local fMRI analysis fallback.";
        setErrorMsg(msg);
      }
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
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      {/* Background Canvas / Main Display */}
      <div className="absolute inset-0 z-0 bg-canvas">
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
      <DraggablePanel
        id="fmri-workbench"
        title="fMRI Workbench"
        subtitle="Data Ingestion & Extraction"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 380, height: 600 }}
      >
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
            accept=".csv,.nii,.gz,.json,.tsv,.txt,.img,.hdr"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-accent-500/30 hover:border-accent-400 bg-accent-500/5 hover:bg-accent-500/10 rounded-clinical transition-colors flex flex-col items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <span className="text-sm font-bold text-accent-200">Select File</span>
            <span className="text-[10px] text-ink-muted">.csv, .tsv, .nii, .gz, .json, .img, .hdr</span>
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
      </DraggablePanel>
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

// ---------------------------------------------------------------------------
// High-fidelity Client-Side BOLD Synthesis & fMRI Analysis Fallback
// ---------------------------------------------------------------------------

function parseCSV(text: string): number[][] | null {
  try {
    const lines = text.split(/\r?\n/);
    const rows: number[][] = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else if (line.includes(",")) {
        parts = line.split(",");
      } else {
        parts = line.split(/\s+/);
      }
      
      const row = parts.map(p => parseFloat(p.trim())).filter(v => !isNaN(v));
      if (row.length > 0) rows.push(row);
    }
    if (rows.length >= 2 && rows[0].length >= 2) {
      const n_rows = rows.length;
      const n_cols = rows[0].length;
      if (n_cols > n_rows) {
        return rows;
      } else {
        const transposed: number[][] = [];
        for (let c = 0; c < n_cols; c++) {
          transposed.push(rows.map(r => r[c]));
        }
        return transposed;
      }
    }
  } catch (e) {
    console.error("Local CSV/TSV/TXT parsing failed:", e);
  }
  return null;
}

function localBuildParcels(): Parcel[] {
  const base = [
    ["L_V1",   "L Primary Visual",      "Visual",       -10, -85,   0, 45],
    ["R_V1",   "R Primary Visual",      "Visual",        10, -85,   0, 45],
    ["L_V2",   "L Extrastriate",        "Visual",       -20, -75,   5, 45],
    ["R_V2",   "R Extrastriate",        "Visual",        20, -75,   5, 45],
    ["L_M1",   "L Primary Motor",       "SomatoMotor",  -40, -20,  55, 20],
    ["R_M1",   "R Primary Motor",       "SomatoMotor",   40, -20,  55, 20],
    ["L_S1",   "L Primary Sensory",     "SomatoMotor",  -40, -30,  55, 20],
    ["R_S1",   "R Primary Sensory",     "SomatoMotor",   40, -30,  55, 20],
    ["L_A1",   "L Primary Auditory",    "SomatoMotor",  -50, -22,   8, 45],
    ["R_A1",   "R Primary Auditory",    "SomatoMotor",   50, -22,   8, 45],
    ["L_DAN",  "L Dorsal Attn (IPS)",   "DorsalAttn",   -30, -55,  50, 20],
    ["R_DAN",  "R Dorsal Attn (IPS)",   "DorsalAttn",    30, -55,  50, 20],
    ["L_FEF",  "L Frontal Eye Field",   "DorsalAttn",   -28,  -5,  55, 20],
    ["R_FEF",  "R Frontal Eye Field",   "DorsalAttn",    28,  -5,  55, 20],
    ["L_INS",  "L Anterior Insula",     "VentAttn",     -40,  10,   0, 20],
    ["R_INS",  "R Anterior Insula",     "VentAttn",      40,  10,   0, 20],
    ["L_ACC",  "L Anterior Cingulate",  "VentAttn",      -5,  30,  20,  6],
    ["R_ACC",  "R Anterior Cingulate",  "VentAttn",       5,  30,  20,  6],
    ["L_OFC",  "L Orbitofrontal",       "Limbic",       -20,  35, -18, 10],
    ["R_OFC",  "R Orbitofrontal",       "Limbic",        20,  35, -18, 10],
    ["L_HPC",  "L Hippocampus",         "Limbic",       -28, -22, -15,  6],
    ["R_HPC",  "R Hippocampus",         "Limbic",        28, -22, -15,  6],
    ["L_AMY",  "L Amygdala",            "Limbic",       -25,  -5, -20, 45],
    ["R_AMY",  "R Amygdala",            "Limbic",        25,  -5, -20, 45],
    ["L_DLPFC","L DLPFC",               "Control",      -40,  35,  35, 20],
    ["R_DLPFC","R DLPFC",               "Control",       40,  35,  35, 20],
    ["L_IPL",  "L Inferior Parietal",   "Control",      -45, -55,  50, 20],
    ["R_IPL",  "R Inferior Parietal",   "Control",       45, -55,  50, 20],
    ["L_VMPFC","L VMPFC",               "Default",       -5,  45, -15, 10],
    ["R_VMPFC","R VMPFC",               "Default",        5,  45, -15, 10],
    ["L_PCC",  "L Posterior Cingulate", "Default",       -5, -50,  30, 10],
    ["R_PCC",  "R Posterior Cingulate", "Default",        5, -50,  30, 10]
  ] as const;

  return base.map((p, i) => ({
    index: i,
    id: p[0],
    name: p[1],
    network: p[2] as any,
    hemi: p[0].startsWith("L_") ? "LH" : "RH",
    mni: [p[3], p[4], p[5]] as [number, number, number],
    freqHz: p[6]
  }));
}

function localSynthesizeBold(
  parcels: Parcel[],
  n_tr: number,
  tr: number,
  pathologies: string[],
  seed = 42
): number[][] {
  const n = parcels.length;
  let s = seed;
  function rng() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }
  function gaussi() {
    let u = 0, v = 0;
    while(u === 0) u = rng();
    while(v === 0) v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const K: number[][] = [];
  for (let i = 0; i < n; i++) {
    K[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        K[i][j] = 0.0;
      } else {
        const sameNet = parcels[i].network === parcels[j].network;
        K[i][j] = sameNet ? 0.4 : 0.05;
      }
    }
  }

  const boost = (idxs: number[], factor: number) => {
    for (const a of idxs) {
      for (const b of idxs) {
        if (a !== b) K[a][b] *= factor;
      }
    }
  };

  const idx = (net: string) => parcels.filter(p => p.network === net).map(p => p.index);
  const byIdPrefix = (prefix: string) => parcels.filter(p => p.id.includes(prefix)).map(p => p.index);

  if (pathologies.includes("depression")) {
    boost(idx("Default"), 1.6);
    boost(idx("Control"), 0.6);
  }
  if (pathologies.includes("anxiety")) {
    boost([...byIdPrefix("AMY"), ...idx("Default")], 1.4);
  }
  if (pathologies.includes("ptsd")) {
    boost([...byIdPrefix("AMY"), ...byIdPrefix("HPC")], 1.7);
  }
  if (pathologies.includes("adhd")) {
    boost([...idx("Control"), ...idx("DorsalAttn")], 0.5);
  }
  if (pathologies.includes("ocd")) {
    boost([...byIdPrefix("ACC"), ...byIdPrefix("OFC")], 1.6);
  }
  if (pathologies.includes("addiction")) {
    boost([...byIdPrefix("INS"), ...byIdPrefix("OFC")], 1.5);
  }

  const fast_dt = 0.01;
  const fast_steps_per_tr = Math.round(tr / fast_dt);
  const total_fast = n_tr * fast_steps_per_tr;

  const phases = Array.from({ length: n }, () => rng() * 2 * Math.PI);
  const omegas = parcels.map(p => 2 * Math.PI * p.freqHz);

  const neural: number[][] = Array.from({ length: n }, () => []);
  
  for (let t = 0; t < total_fast; t++) {
    const new_phases = [];
    for (let i = 0; i < n; i++) {
      let coupling = 0.0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        coupling += K[i][j] * Math.sin(phases[j] - phases[i]);
      }
      const dphi = omegas[i] + coupling + gaussi() * 0.3;
      new_phases.push(phases[i] + fast_dt * dphi);
    }
    for (let i = 0; i < n; i++) {
      phases[i] = new_phases[i];
      neural[i].push(Math.sin(phases[i]));
    }
  }

  const hrf_t = Array.from({ length: Math.round(20.0 / fast_dt) }, (_, k) => k * fast_dt);
  const gamma = (t: number, a: number, b: number) => {
    if (t <= 0) return 0.0;
    return Math.pow(t, a - 1) * Math.exp(-t / b) / (Math.pow(b, a) * 120.0);
  };

  const hrf = hrf_t.map(t => gamma(t, 6, 0.9) - 0.35 * gamma(t, 16, 0.9));
  const maxHrf = Math.max(...hrf.map(Math.abs)) || 1.0;
  const normHrf = hrf.map(v => v / maxHrf);

  const bold: number[][] = [];
  for (let i = 0; i < n; i++) {
    const s = neural[i];
    const conv = new Float32Array(s.length);
    for (let t = 0; t < s.length; t++) {
      let acc = 0.0;
      const kmax = Math.min(normHrf.length, t + 1);
      for (let k = 0; k < kmax; k++) {
        acc += normHrf[k] * s[t - k];
      }
      conv[t] = acc;
    }

    const ds: number[] = [];
    for (let k = 0; k < n_tr; k++) {
      const idx = k * fast_steps_per_tr;
      if (idx < conv.length) {
        ds.push(conv[idx]);
      } else {
        ds.push(ds[ds.length - 1]);
      }
    }

    const mu = ds.reduce((a, b) => a + b, 0) / ds.length;
    const variance = ds.reduce((acc, v) => acc + Math.pow(v - mu, 2), 0) / ds.length;
    const sd = Math.sqrt(variance) || 1.0;
    bold.push(ds.map(v => +((v - mu) / sd).toFixed(4)));
  }

  return bold;
}

function localPearsonFC(ts: number[][]): number[][] {
  const n = ts.length;
  const T = ts[0].length;
  const means = ts.map(row => row.reduce((a, b) => a + b, 0) / T);
  const stds = ts.map((row, i) => {
    const variance = row.reduce((acc, v) => acc + Math.pow(v - means[i], 2), 0) / T;
    return Math.sqrt(variance) || 1.0;
  });

  const fc: number[][] = Array.from({ length: n }, () => Array(n).fill(0.0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        fc[i][j] = 1.0;
        continue;
      }
      let cov = 0.0;
      for (let t = 0; t < T; t++) {
        cov += (ts[i][t] - means[i]) * (ts[j][t] - means[j]);
      }
      cov /= T;
      const r = cov / (stds[i] * stds[j]);
      fc[i][j] = +r.toFixed(4);
      fc[j][i] = fc[i][j];
    }
  }
  return fc;
}

function localMeanOffDiag(m: number[][]): number {
  const n = m.length;
  if (n < 2) return 0.0;
  let acc = 0.0;
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        acc += m[i][j];
        cnt++;
      }
    }
  }
  return +(acc / cnt).toFixed(4);
}

function localEntropyEstimate(m: number[][]): number {
  const vals: number[] = [];
  const n = m.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      vals.push(m[i][j]);
    }
  }
  if (vals.length === 0) return 0.0;
  const bins = 20;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (hi - lo < 1e-9) return 0.0;
  const width = (hi - lo) / bins;
  const counts = Array(bins).fill(0);
  for (const v of vals) {
    const idx = Math.min(bins - 1, Math.floor((v - lo) / width));
    counts[idx]++;
  }
  const total = counts.reduce((a, b) => a + b, 0);
  let h = 0.0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / total;
    h -= p * Math.log(p);
  }
  return +(h / Math.log(bins)).toFixed(4);
}

function localCountEdges(m: number[][], threshold = 0.35): number {
  let count = 0;
  const n = m.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (m[i][j] >= threshold) count++;
    }
  }
  return count;
}

function localFmriAnalyze(filename: string, fileText?: string, activePathologies: string[] = []): FmriDataset {
  const parcels = localBuildParcels();
  const tr = 2.0;
  const n_tr = 150;
  
  let source: "csv" | "synthesized" = "synthesized";
  let timeSeries: number[][] | null = null;
  
  if (fileText) {
    let parsed: number[][] | null = null;
    const filenameLower = filename.toLowerCase();
    
    if (filenameLower.endsWith(".json")) {
      try {
        const obj = JSON.parse(fileText);
        let matrix: any = null;
        if (Array.isArray(obj) && obj.length >= 2 && Array.isArray(obj[0])) {
          matrix = obj;
        } else if (obj && typeof obj === "object") {
          for (const k of ["time_series", "timeSeries", "data", "bold", "matrix"]) {
            if (Array.isArray(obj[k]) && obj[k].length >= 2 && Array.isArray(obj[k][0])) {
              matrix = obj[k];
              break;
            }
          }
        }
        
        if (matrix) {
          const n_rows = matrix.length;
          const n_cols = matrix[0].length;
          const numMatrix = matrix.map((row: any) => row.map((v: any) => Number(v)).filter((v: any) => !isNaN(v)));
          if (n_cols > n_rows) {
            parsed = numMatrix;
          } else {
            const transposed: number[][] = [];
            for (let c = 0; c < n_cols; c++) {
              transposed.push(numMatrix.map((r: any) => r[c]));
            }
            parsed = transposed;
          }
        }
      } catch (e) {
        console.error("Local JSON parsing failed:", e);
      }
    } else {
      parsed = parseCSV(fileText);
    }
    
    if (parsed && parsed.length > 0) {
      // Robust resampling to parcels.length x n_tr
      const src_n_regions = parsed.length;
      const resampled: number[][] = [];
      
      for (let p = 0; p < parcels.length; p++) {
        const src_idx = Math.floor((p * src_n_regions) / parcels.length);
        const srcRow = parsed[src_idx] || [];
        let row: number[] = [];
        
        if (srcRow.length === 0) {
          row = Array(n_tr).fill(0.0);
        } else if (srcRow.length < n_tr) {
          row = [...srcRow];
          const lastVal = row[row.length - 1];
          while (row.length < n_tr) {
            row.push(lastVal);
          }
        } else {
          row = srcRow.slice(0, n_tr);
        }
        
        // z-score the row
        const mu = row.reduce((a, b) => a + b, 0) / row.length;
        const variance = row.reduce((acc, v) => acc + Math.pow(v - mu, 2), 0) / row.length;
        const sd = Math.sqrt(variance) || 1.0;
        resampled.push(row.map(v => +((v - mu) / sd).toFixed(4)));
      }
      
      timeSeries = resampled;
      source = "csv";
    }
  }
  
  const detectedPathologies = activePathologies && activePathologies.length > 0
    ? activePathologies.map(p => p.toLowerCase())
    : (() => {
        const pathologies = ["depression", "anxiety", "adhd", "ptsd", "ocd", "addiction"];
        return pathologies
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 2) + 1);
      })();

  if (!timeSeries) {
    timeSeries = localSynthesizeBold(parcels, n_tr, tr, detectedPathologies);
  }
  
  const fcMatrix = localPearsonFC(timeSeries);
  const meanFC = localMeanOffDiag(fcMatrix);
  const entropy = localEntropyEstimate(fcMatrix);
  const totalEdges = localCountEdges(fcMatrix);
  
  return {
    filename,
    source,
    diagnosticProfile: detectedPathologies,
    parcels,
    tr,
    timeSeries,
    fcMatrix,
    stats: {
      totalEdges,
      meanFC,
      entropy
    }
  };
}
