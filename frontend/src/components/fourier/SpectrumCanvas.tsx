"use client";

import { useEffect, useRef } from "react";
import { windowedPower, binToHz } from "@/lib/fourier/fft";
import { BAND_HZ_RANGES } from "@/lib/fourier/synthesis";
import { BANDS } from "@/lib/signal/bands";

export interface SpectrumCanvasProps {
  /** Time-domain samples. Length need not be a power of 2 — windowedPower pads. */
  samples: number[];
  sampleRate: number;
  /** When true, render δθαβγ band overlays. */
  overlayBands?: boolean;
  /** Lower frequency for the visible range (Hz). 0 means start at the first non-DC bin. */
  fMin?: number;
  /** Upper frequency for the visible range (Hz). Defaults to Nyquist. */
  fMax?: number;
  /** Render axes on log-frequency / log-power scales (recommended). */
  logScale?: boolean;
  xAxisLabel?: string;
  /** Callback fires with the dominant-bin Hz value after each render. */
  onPeak?: (hz: number, power: number) => void;
}

/**
 * Spectrum renderer — log-log power plot with optional EEG band overlay.
 * Uses ResizeObserver + DPR scaling to stay crisp on retina + responsive
 * to layout shifts.
 */
export default function SpectrumCanvas({
  samples,
  sampleRate,
  overlayBands = true,
  fMin = 0,
  fMax,
  logScale = true,
  xAxisLabel = "Frequency (Hz)",
  onPeak,
}: SpectrumCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = wrapper.clientWidth;
      const H = wrapper.clientHeight;
      if (W <= 0 || H <= 0) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Compute power spectrum.
      const power = windowedPower(samples);
      const Npad = power.length * 2; // matches padToPow2(samples) length
      const nyquist = sampleRate / 2;
      const lo = Math.max(fMin || (sampleRate / Npad), sampleRate / Npad);
      const hi = Math.min(fMax ?? nyquist, nyquist);

      // Plot rect with padding for axes.
      const padL = 44, padR = 14, padT = 14, padB = 28;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      if (plotW <= 4 || plotH <= 4) return;

      // X mapping
      const xOf = (hz: number) => {
        if (logScale) {
          const lhz = Math.log10(Math.max(hz, lo));
          const llo = Math.log10(lo);
          const lhi = Math.log10(hi);
          return padL + ((lhz - llo) / Math.max(1e-9, lhi - llo)) * plotW;
        }
        return padL + ((hz - lo) / Math.max(1e-9, hi - lo)) * plotW;
      };

      // Y mapping — db-style log power
      // Find min/max for visible range.
      let pMax = 1e-12, pMin = Infinity;
      const peakBin = { i: 0, p: 0 };
      for (let i = 1; i < power.length; i++) {
        const hz = binToHz(i, sampleRate, Npad);
        if (hz < lo || hz > hi) continue;
        const p = power[i];
        if (p > pMax) pMax = p;
        if (p > 0 && p < pMin) pMin = p;
        if (p > peakBin.p) { peakBin.p = p; peakBin.i = i; }
      }
      if (pMin === Infinity) pMin = pMax * 1e-6;
      const yOf = (p: number) => {
        if (logScale) {
          const lp = Math.log10(Math.max(p, pMin));
          const lpmin = Math.log10(pMin);
          const lpmax = Math.log10(pMax);
          return padT + plotH - ((lp - lpmin) / Math.max(1e-9, lpmax - lpmin)) * plotH;
        }
        return padT + plotH - (p / pMax) * plotH;
      };

      // Background band overlays (EEG only).
      if (overlayBands) {
        for (const b of BANDS) {
          const range = BAND_HZ_RANGES[b.key];
          if (!range) continue;
          const [b0, b1] = range;
          if (b1 < lo || b0 > hi) continue;
          const x0 = xOf(Math.max(b0, lo));
          const x1 = xOf(Math.min(b1, hi));
          ctx.fillStyle = b.color + "14"; // ~8% alpha
          ctx.fillRect(x0, padT, x1 - x0, plotH);
          // Top tick + label
          ctx.fillStyle = b.color + "cc";
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(b.symbol, (x0 + x1) / 2, padT + 10);
        }
      }

      // Grid lines + axis labels.
      ctx.strokeStyle = "rgba(170,177,192,0.08)";
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(170,177,192,0.55)";
      ctx.font = "9.5px JetBrains Mono, monospace";

      // X gridlines: decades if log, else linear ticks.
      if (logScale) {
        for (let dec = Math.floor(Math.log10(lo)); dec <= Math.ceil(Math.log10(hi)); dec++) {
          for (let m = 1; m < 10; m++) {
            const hz = m * Math.pow(10, dec);
            if (hz < lo || hz > hi) continue;
            const x = xOf(hz);
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, padT + plotH);
            ctx.stroke();
          }
        }
        // Labels at decade boundaries.
        ctx.textAlign = "center";
        for (let dec = Math.floor(Math.log10(lo)); dec <= Math.ceil(Math.log10(hi)); dec++) {
          const hz = Math.pow(10, dec);
          if (hz < lo || hz > hi) continue;
          const x = xOf(hz);
          ctx.fillText(hz >= 1 ? hz.toFixed(0) : hz.toFixed(2), x, H - 12);
        }
      } else {
        const ticks = 6;
        ctx.textAlign = "center";
        for (let t = 0; t <= ticks; t++) {
          const hz = lo + ((hi - lo) * t) / ticks;
          const x = xOf(hz);
          ctx.beginPath();
          ctx.moveTo(x, padT);
          ctx.lineTo(x, padT + plotH);
          ctx.stroke();
          ctx.fillText(hz.toFixed(hz < 1 ? 2 : 0), x, H - 12);
        }
      }
      // Y label (axis title)
      ctx.save();
      ctx.translate(12, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("Power (log)", 0, 0);
      ctx.restore();
      // X label
      ctx.textAlign = "center";
      ctx.fillText(xAxisLabel, padL + plotW / 2, H - 2);

      // Gradient fill under the spectrum
      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      grad.addColorStop(0, "rgba(168, 85, 247, 0.4)"); // accent-500
      grad.addColorStop(1, "rgba(168, 85, 247, 0.0)");

      // Spectrum line & fill
      ctx.beginPath();
      let started = false;
      const points: {x: number, y: number}[] = [];
      for (let i = 1; i < power.length; i++) {
        const hz = binToHz(i, sampleRate, Npad);
        if (hz < lo) continue;
        if (hz > hi) break;
        const x = xOf(hz);
        const y = yOf(Math.max(power[i], pMin));
        points.push({x, y});
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
      }
      
      // Complete the path for filling
      if (points.length > 0) {
        ctx.lineTo(points[points.length - 1].x, padT + plotH);
        ctx.lineTo(points[0].x, padT + plotH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw the actual line
      ctx.strokeStyle = "#c084fc"; // accent-400
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(168, 85, 247, 0.6)"; // accent-500
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Peak marker.
      const peakHz = binToHz(peakBin.i, sampleRate, Npad);
      if (peakHz >= lo && peakHz <= hi) {
        const px = xOf(peakHz);
        const py = yOf(peakBin.p);
        ctx.fillStyle = "#c084fc"; // accent-400
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(192, 132, 252, 0.4)";
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.fillStyle = "#d4dae5"; // ink
        ctx.font = "bold 10.5px JetBrains Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `peak: ${peakHz < 1 ? peakHz.toFixed(3) : peakHz.toFixed(2)} Hz`,
          Math.min(px + 6, W - 80),
          padT + 12
        );
        ctx.fillStyle = "#c084fc";
        ctx.fillText(
          `[babelForgeIntervention]`,
          Math.min(px + 6, W - 140),
          padT + 26
        );
      }
      if (onPeak) onPeak(peakHz, peakBin.p);
    };

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [samples, sampleRate, overlayBands, fMin, fMax, logScale, xAxisLabel, onPeak]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-[260px] relative">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
