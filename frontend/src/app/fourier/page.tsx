"use client";

import { useEffect, useMemo, useState } from "react";
import StimulusSelector from "@/components/signal/StimulusSelector";
import CategoryTabs from "@/components/fourier/CategoryTabs";
import SpectrumCanvas from "@/components/fourier/SpectrumCanvas";
import MetaGrid from "@/components/palantir/MetaGrid";
import EntityHeader from "@/components/palantir/EntityHeader";
import Breadcrumbs from "@/components/palantir/Breadcrumbs";
import PanelHeader from "@/components/palantir/PanelHeader";
import {
  FOURIER_CATEGORIES,
  FourierCategoryKey,
  categoryByKey,
  synthesize,
} from "@/lib/fourier/synthesis";
import type { Stimulus } from "@/lib/signal/bands";
import { useAI } from "@/context/AIContext";

const STORAGE_KEY = "babelforge:fourier:v1";

interface Persisted {
  category: FourierCategoryKey;
  stimulus: Stimulus | null;
}

export default function FourierPage() {
  const { setCurrentModule } = useAI();
  const [category, setCategory] = useState<FourierCategoryKey>("neural");
  const [stimulus, setStimulus] = useState<Stimulus | null>(null);
  const [peakHz, setPeakHz] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  
  const [leftMinimized, setLeftMinimized] = useState(false);
  const [rightMinimized, setRightMinimized] = useState(false);

  useEffect(() => {
    setCurrentModule("fourier-analyzer");
  }, [setCurrentModule]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as Persisted;
        if (v.category) setCategory(v.category);
        if (v.stimulus !== undefined) setStimulus(v.stimulus);
      }
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ category, stimulus } as Persisted));
    } catch {/* ignore */}
  }, [category, stimulus, hydrated]);

  const { samples, sampleRate, meta } = useMemo(
    () => synthesize(category, stimulus),
    [category, stimulus]
  );

  const cat = categoryByKey(category);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas lg:block">
      {/* Background Canvas / Main Display */}
      <div className="lg:absolute lg:inset-0 z-0 min-h-[60vh] lg:min-h-0 relative flex flex-col bg-canvas p-4 lg:p-0">
        <section className="flex flex-col flex-1 rounded-clinical lg:rounded-none border lg:border-none border-line bg-surface-50 lg:bg-transparent overflow-hidden">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 lg:px-6 py-2.5 lg:pt-6 lg:pb-3 border-b border-line bg-surface-0/70 backdrop-blur z-10 lg:pl-[380px] lg:pr-[320px]">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-ink-muted">
                {meta.group}
              </div>
              <h2 className="text-sm font-bold text-ink">{meta.label}</h2>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-ink-subtle break-all sm:break-normal">
              fs = {sampleRate} Hz · N = {samples.length} · peak ≈{" "}
              <span className="text-accent-300">
                {peakHz < 1 ? peakHz.toFixed(3) : peakHz.toFixed(2)} Hz
              </span>
            </div>
          </header>
          <div className="h-[300px] sm:h-[380px] lg:h-auto lg:flex-1 lg:min-h-0 p-3 lg:pl-[360px] lg:pr-[300px] lg:pt-8 lg:pb-4">
            <SpectrumCanvas
              samples={samples}
              sampleRate={sampleRate}
              overlayBands={meta.overlayBands}
              xAxisLabel={meta.xAxisLabel}
              onPeak={(hz) => setPeakHz(hz)}
            />
          </div>
          <div className="px-4 py-3 lg:px-6 lg:pl-[380px] lg:pr-[320px] bg-surface-0/70 backdrop-blur border-t border-line z-10">
            <p className="text-[11px] text-ink-muted leading-snug">
              {meta.blurb}
            </p>
          </div>
        </section>
      </div>

      {/* Left Sidebar */}
      <aside className={`w-full lg:absolute lg:left-4 lg:top-4 z-20 border-b lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${leftMinimized ? 'lg:w-auto h-auto' : 'lg:w-[350px] lg:bottom-4 overflow-y-auto'}`}>
        <PanelHeader 
          title="Fourier Parameters" 
          subtitle={leftMinimized ? "" : "Select signal origin & intervention"}
          onToggle={() => setLeftMinimized(!leftMinimized)}
          minimized={leftMinimized}
        />
        {!leftMinimized && (
          <div className="p-4 flex flex-col gap-6">
            <div className="mb-2">
              <Breadcrumbs trail={[{ label: cat.label }]} />
              <EntityHeader
                kind="analyzer"
                id={`fourier.${category}`}
                name={cat.label}
                version="v1"
                owner="babelforge"
                updatedAt={new Date().toISOString().slice(0, 10)}
                status="ok"
              />
            </div>
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Category
              </h3>
              <CategoryTabs active={category} onSelect={setCategory} />
            </section>
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Stimulus / Intervention
              </h3>
              <StimulusSelector active={stimulus} onSelect={setStimulus} />
            </section>
          </div>
        )}
      </aside>

      {/* Right Sidebar */}
      <aside className={`w-full lg:absolute lg:right-4 lg:top-4 z-20 border-t lg:border border-line bg-surface-0/80 backdrop-blur-xl lg:rounded-clinical flex flex-col custom-scrollbar shadow-2xl pointer-events-auto transition-all duration-300 ${rightMinimized ? 'lg:w-auto h-auto' : 'lg:w-[280px] lg:bottom-4 overflow-y-auto'}`}>
        <PanelHeader 
          title="Spectral Meta" 
          subtitle={rightMinimized ? "" : "Data properties"}
          onToggle={() => setRightMinimized(!rightMinimized)}
          minimized={rightMinimized}
        />
        {!rightMinimized && (
          <div className="p-4 flex flex-col gap-6">
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">Acquisition</h3>
              <MetaGrid
                pairs={[
                  { k: "Sample rate", v: `${sampleRate} Hz` },
                  { k: "Window length", v: `${samples.length} samples` },
                  { k: "Duration", v: `${(samples.length / sampleRate).toFixed(2)} s` },
                  { k: "Nyquist", v: `${(sampleRate / 2).toFixed(2)} Hz` },
                  { k: "Resolution", v: `${(sampleRate / samples.length).toFixed(3)} Hz / bin` },
                ]}
              />
            </section>
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">Analysis</h3>
              <MetaGrid
                pairs={[
                  { k: "Transform", v: "FFT (radix-2)" },
                  { k: "Window", v: "Hann (compensated)" },
                  { k: "Normalization", v: "One-sided (DC/N, 2|X|/N)" },
                  { k: "Scale", v: "Log-log power" },
                  { k: "Peak", v: `${peakHz < 1 ? peakHz.toFixed(3) : peakHz.toFixed(2)} Hz` },
                ]}
              />
            </section>
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">Catalog</h3>
              <MetaGrid
                pairs={FOURIER_CATEGORIES.map((c) => ({ k: c.label, v: c.group }))}
              />
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}