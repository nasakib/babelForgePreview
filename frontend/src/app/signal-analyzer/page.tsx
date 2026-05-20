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
import PanelHeader from "@/components/palantir/PanelHeader";
import DraggablePanel from "@/components/palantir/DraggablePanel";

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
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      {/* Background Canvas / Main Display */}
      <div className="absolute inset-0 z-0 flex flex-col bg-canvas">
        <header className="z-10 p-4 lg:p-6 lg:pl-[400px] border-b border-line-strong bg-surface-0/70 backdrop-blur flex flex-wrap items-start gap-3 justify-between pointer-events-auto">
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

        <div className="p-3 lg:p-4 lg:pl-[400px] border-t border-line-strong bg-surface-0/70 backdrop-blur grid lg:grid-cols-[1fr_360px] gap-3 z-10">
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
      </div>

      <DraggablePanel
        id="signal-analyzer-sidebar"
        title="Stimulus Application"
        subtitle="Inject synthetic cortex stimuli"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 350, height: 600 }}
      >
          <div className="p-4 flex flex-col gap-6">
            <p className="text-xs text-ink-muted leading-relaxed">
              Inject a stimulus into the simulated cortex and watch the
              oscillatory response across all five EEG bands. Use{" "}
              <strong className="text-accent-300">Compress</strong> to fuse the
              bands into a single dominant-coloured trace.
            </p>

            <StimulusSelector active={stimulus} onSelect={setStimulus} />
            <SignalControls mode={mode} onChange={setMode} />
          </div>
      </DraggablePanel>
    </div>
  );
}
