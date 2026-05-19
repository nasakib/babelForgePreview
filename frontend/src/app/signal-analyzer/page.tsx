"use client";

import { useEffect, useState } from "react";
import SignalCanvas, { SignalMode, SignalTick } from "@/components/SignalCanvas";
import StimulusSelector from "@/components/signal/StimulusSelector";
import SignalControls from "@/components/signal/SignalControls";
import BandLegend from "@/components/signal/BandLegend";
import SignalExplainer from "@/components/signal/SignalExplainer";
import SignalMetricsBar from "@/components/signal/SignalMetricsBar";
import type { Stimulus, BandKey } from "@/lib/signal/bands";
import { useAI } from "@/context/AIContext";

const STORAGE_KEY = "babelforge:signal-analyzer:v1";

interface PersistedState {
  stimulus: Stimulus | null;
  mode: SignalMode;
}

export default function SignalAnalyzer() {
  const { setCurrentModule } = useAI();
  const [stimulus, setStimulus] = useState<Stimulus | null>(null);
  const [mode, setMode] = useState<SignalMode>("stacked");
  const [tick, setTick] = useState<SignalTick>({
    dominantBand: "alpha",
    intensity: 0,
    rms: 0,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrentModule("signal-analyzer");
  }, [setCurrentModule]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as PersistedState;
        if (v.stimulus !== undefined) setStimulus(v.stimulus);
        if (v.mode === "stacked" || v.mode === "compressed") setMode(v.mode);
      }
    } catch {
      /* noop */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stimulus, mode }));
    } catch {
      /* noop */
    }
  }, [stimulus, mode, hydrated]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden w-full h-app-mobile lg:h-[calc(100vh-3rem)]">
      <aside className="w-full lg:w-[350px] bg-surface-0 border-r border-line flex-none overflow-y-auto custom-scrollbar p-6 shadow-sm shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-ink mb-1">Stimulus Application</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Inject a stimulus into the simulated cortex and watch the
            oscillatory response across all five EEG bands. Use{" "}
            <strong className="text-accent-300">Compress</strong> to fuse the
            bands into a single dominant-coloured trace.
          </p>
        </div>

        <StimulusSelector active={stimulus} onSelect={setStimulus} />
        <SignalControls mode={mode} onChange={setMode} />
      </aside>

      <section className="flex-grow bg-canvas m-3 rounded-clinical flex flex-col overflow-hidden relative border border-line-strong min-h-[520px] lg:min-h-0">
        <header className="z-10 p-4 lg:p-6 border-b border-line-strong bg-surface-0/70 backdrop-blur flex flex-wrap items-start gap-3 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              <span className="text-[10px] font-bold text-ok uppercase tracking-widest">
                Live Signal Analysis
              </span>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-ink">
              {stimulus
                ? `Simulated LFP · ${stimulus.type}`
                : "Resting State LFP (Baseline)"}
            </h3>
          </div>
          <BandLegend active={tick.dominantBand} />
        </header>

        <div className="flex-1 w-full relative min-h-[320px]">
          <SignalCanvas stimulus={stimulus} mode={mode} onTick={setTick} />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
        </div>

        <div className="p-3 lg:p-4 border-t border-line-strong bg-surface-0/70 backdrop-blur grid lg:grid-cols-[1fr_360px] gap-3">
          <SignalMetricsBar
            stimulus={stimulus}
            dominantBand={tick.dominantBand}
            rms={tick.rms}
          />
          <SignalExplainer
            stimulus={stimulus}
            dominantBand={tick.dominantBand as BandKey}
            intensity={tick.intensity}
            mode={mode}
          />
        </div>
      </section>
    </div>
  );
}
