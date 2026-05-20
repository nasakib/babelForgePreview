"use client";

import { useAI } from "@/context/AIContext";
import DraggablePanel from "./DraggablePanel";
import { useEffect, useState, useRef } from "react";

export default function TimeEnginePanel() {
  const { simulationTimeMonths, setSimulationTimeMonths } = useAI();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // months per second
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastUpdateRef.current === 0) lastUpdateRef.current = time;
      
      const deltaMs = time - lastUpdateRef.current;
      if (deltaMs > 1000 / 30) { // Update at roughly 30fps max
        lastUpdateRef.current = time;
        const newTime = simulationTimeMonths + (playbackSpeed * (deltaMs / 1000));
        setSimulationTimeMonths(Math.min(newTime, 120)); // Cap at 120 months (10 years)
      }
      
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastUpdateRef.current = 0; // Reset timer on play
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, setSimulationTimeMonths]);

  return (
    <DraggablePanel
      id="time-engine-panel"
      title="Temporal Dynamics Engine"
      subtitle="Predictive Structural Drift"
      defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth / 2 - 200 : 400, y: typeof window !== "undefined" ? window.innerHeight - 250 : 600 }}
      defaultSize={{ width: 400, height: 180 }}
    >
      <div className="p-4 flex flex-col gap-4">
        <p className="text-xs text-ink-subtle leading-relaxed">
          Simulate longitudinal progression over months. Factors in structural neuroplasticity, age-related coupling decay, excitotoxic atrophy, and dynamic pharmacological tolerance.
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-clinical transition-all ${isPlaying ? 'bg-warn text-void shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-surface-100 text-ink hover:bg-surface-200'}`}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button 
              onClick={() => setSimulationTimeMonths(0)} 
              className="text-[10px] font-mono uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-ink-muted uppercase">Rate</span>
            <select 
              value={playbackSpeed} 
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-surface-50 border border-line text-xs font-mono text-ink rounded px-2 py-1 outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={5}>5.0x</option>
              <option value={12}>12.0x</option>
            </select>
          </div>
        </div>

        <div className="relative pt-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">T+ Time Horizon</span>
            <span className="font-mono text-sm text-ink">{simulationTimeMonths.toFixed(1)} <span className="text-ink-muted text-[10px]">Months</span></span>
          </div>
          <input
            type="range"
            className="slider-clinical w-full"
            min={0}
            max={120}
            step={0.1}
            value={simulationTimeMonths}
            onChange={(e) => setSimulationTimeMonths(Number(e.target.value))}
            style={{ accentColor: '#a855f7' }}
          />
          <div className="flex justify-between mt-1 text-[9px] font-mono text-ink-subtle">
            <span>Now</span>
            <span>10 Yrs</span>
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}
