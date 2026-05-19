"use client";

import { useEffect, useRef, useState } from "react";
import { BANDS, BandKey, Stimulus, stimulusGain } from "@/lib/signal/bands";

export type SignalMode = "stacked" | "compressed";

export interface SignalTick {
  /** Currently dominant band (largest absolute amplitude this frame). */
  dominantBand: BandKey;
  /** Normalised dominant amplitude in 0..1. */
  intensity: number;
  /** Rolling RMS of the compressed signal in 0..1. */
  rms: number;
}

export interface SignalCanvasProps {
  stimulus: Stimulus | null;
  mode?: SignalMode;
  /** Throttled (~10 Hz) live readout for parent components. */
  onTick?: (t: SignalTick) => void;
}

/**
 * Pure render surface. Produces synthetic multi-band EEG and either
 * stacks the bands or compresses them into a single colour-coded trace.
 * All band/stimulus knowledge lives in `lib/signal/bands`.
 */
export default function SignalCanvas({
  stimulus,
  mode = "stacked",
  onTick,
}: SignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;
    const dpr =
      typeof window !== "undefined"
        ? Math.min(2, window.devicePixelRatio || 1)
        : 1;

    const MAX = 600;
    const traces: Record<BandKey, number[]> = {
      delta: [], theta: [], alpha: [], beta: [], gamma: [],
    };
    const phases: Record<BandKey, number> = {
      delta: Math.random() * Math.PI * 2,
      theta: Math.random() * Math.PI * 2,
      alpha: Math.random() * Math.PI * 2,
      beta:  Math.random() * Math.PI * 2,
      gamma: Math.random() * Math.PI * 2,
    };
    const compressed: number[] = [];
    let rmsAccum = 0;
    let lastTickAt = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 400;
      if (w === cssW && h === cssH) return;
      cssW = w; cssH = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setReady(true);
    };
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const drawGrid = (w: number, h: number) => {
      ctx.strokeStyle = "rgba(170,177,192,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < h; i += 32) { ctx.moveTo(0, i); ctx.lineTo(w, i); }
      for (let i = 0; i < w; i += 32) { ctx.moveTo(i, 0); ctx.lineTo(i, h); }
      ctx.stroke();
    };

    const stepBand = (b: typeof BANDS[number], scaleAmp: number) => {
      const g = stimulusGain(stimulus, b.key);
      phases[b.key] += b.freq * g.freqMul;
      const amp = scaleAmp * g.amp;
      const noiseAmp = 4 * g.noise;
      let v = Math.sin(phases[b.key]) * amp;
      v += Math.sin(phases[b.key] * 2.1) * amp * 0.25;
      v += (Math.random() - 0.5) * noiseAmp;
      return v;
    };

    const reportTick = (dominant: BandKey, intensity: number) => {
      if (!onTick) return;
      const now = performance.now();
      if (now - lastTickAt < 100) return; // ~10Hz
      lastTickAt = now;
      onTick({ dominantBand: dominant, intensity, rms: rmsAccum });
    };

    const renderStacked = () => {
      const w = cssW, h = cssH;
      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      const padTop = 6, padBot = 6;
      const bandH = (h - padTop - padBot) / BANDS.length;

      let domBand: BandKey = "alpha";
      let domVal = 0;

      BANDS.forEach((band, idx) => {
        const baseAmp = bandH * 0.34;
        const v = stepBand(band, baseAmp);
        const arr = traces[band.key];
        arr.push(v);
        if (arr.length > MAX) arr.shift();

        const rel = Math.abs(v) / (baseAmp || 1);
        if (rel > domVal) { domVal = rel; domBand = band.key; }

        const baselineY = padTop + bandH * idx + bandH / 2;

        ctx.fillStyle = idx % 2 === 0 ? "rgba(20,25,35,0.25)" : "rgba(20,25,35,0.45)";
        ctx.fillRect(0, padTop + bandH * idx, w, bandH);

        ctx.strokeStyle = "rgba(170,177,192,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(58, baselineY); ctx.lineTo(w - 8, baselineY); ctx.stroke();

        const slice = (w - 66) / MAX;
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const x = 58 + i * slice;
          const y = baselineY - arr[i];
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (arr.length > 0) {
          const x = 58 + (arr.length - 1) * slice;
          const y = baselineY - arr[arr.length - 1];
          ctx.fillStyle = band.color;
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = band.color;
        ctx.font = "10px JetBrains Mono, ui-monospace, monospace";
        ctx.fillText(`${band.symbol} ${band.label}`, 6, baselineY - 2);
        ctx.fillStyle = "rgba(170,177,192,0.5)";
        ctx.fillText(band.hzLabel, 6, baselineY + 11);
      });

      rmsAccum = 0.6 * rmsAccum + 0.4 * domVal;
      reportTick(domBand, Math.min(1, domVal));
      raf = requestAnimationFrame(renderStacked);
    };

    const renderCompressed = () => {
      const w = cssW, h = cssH;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);
      ctx.strokeStyle = "rgba(170,177,192,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

      let sum = 0;
      let domBand: BandKey = "alpha";
      let domAbs = 0;

      BANDS.forEach((band) => {
        const contrib = stepBand(band, 18);
        sum += contrib;
        if (Math.abs(contrib) > domAbs) {
          domAbs = Math.abs(contrib);
          domBand = band.key;
        }
      });
      compressed.push(sum);
      if (compressed.length > MAX) compressed.shift();

      const slice = w / MAX;
      const dominantColor = BANDS.find((b) => b.key === domBand)!.color;

      // Soft glow under the line
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `${dominantColor}00`);
      grad.addColorStop(0.5, `${dominantColor}33`);
      grad.addColorStop(1, `${dominantColor}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      for (let i = 0; i < compressed.length; i++) {
        ctx.lineTo(i * slice, cy - compressed[i]);
      }
      ctx.lineTo((compressed.length - 1) * slice, cy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = dominantColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < compressed.length; i++) {
        const x = i * slice;
        const y = cy - compressed[i];
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (compressed.length > 0) {
        const x = (compressed.length - 1) * slice;
        const y = cy - compressed[compressed.length - 1];
        ctx.fillStyle = dominantColor;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }

      const norm = Math.min(1, domAbs / 50);
      rmsAccum = 0.6 * rmsAccum + 0.4 * norm;
      reportTick(domBand, norm);
      raf = requestAnimationFrame(renderCompressed);
    };

    if (mode === "compressed") renderCompressed();
    else renderStacked();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stimulus, mode, onTick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none"
      aria-label={`EEG signal visualization — ${mode} mode`}
      role="img"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s" }}
    />
  );
}
