"use client";

import { useEffect, useMemo, useState } from "react";
import StimulusSelector from "@/components/signal/StimulusSelector";
import CategoryTabs from "@/components/fourier/CategoryTabs";
import SpectrumCanvas from "@/components/fourier/SpectrumCanvas";
import MetaGrid from "@/components/palantir/MetaGrid";
import EntityHeader from "@/components/palantir/EntityHeader";
import Breadcrumbs from "@/components/palantir/Breadcrumbs";
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
    <div className="flex flex-col lg:h-full lg:min-h-0 bg-void">
      <div className="px-4 sm:px-6 pt-4">
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

      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4 px-4 sm:px-6 pb-6 pt-3">
        {/* Left: stimulus + categories */}
        <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <section>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
              Category
            </h3>
            <CategoryTabs active={category} onSelect={setCategory} />
          </section>
          <section>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
              Stimulus
            </h3>
            <StimulusSelector active={stimulus} onSelect={setStimulus} />
          </section>
        </aside>

        {/* Center: spectrum */}
        <section className="flex flex-col lg:min-h-0 rounded-clinical border border-line bg-surface-50">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-2.5 border-b border-line">
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
          <div className="h-[300px] sm:h-[380px] lg:h-auto lg:flex-1 lg:min-h-0 p-3">
            <SpectrumCanvas
              samples={samples}
              sampleRate={sampleRate}
              overlayBands={meta.overlayBands}
              xAxisLabel={meta.xAxisLabel}
              onPeak={(hz) => setPeakHz(hz)}
            />
          </div>
          <p className="text-[11px] text-ink-muted leading-snug px-4 py-3 border-t border-line">
            {meta.blurb}
          </p>
        </section>

        {/* Right: meta */}
        <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
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
        </aside>
      </div>
    </div>
  );
}
