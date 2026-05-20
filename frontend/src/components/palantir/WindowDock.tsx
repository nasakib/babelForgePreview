"use client";

import { useWindowContext } from "@/context/WindowContext";

export default function WindowDock() {
  const { windows, toggleMinimize, zenMode, toggleZenMode } = useWindowContext();

  const minimizedWindows = Object.values(windows).filter((w) => w.minimized);

  if (minimizedWindows.length === 0 && !zenMode) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mb-2 flex items-end gap-2 z-50 pointer-events-none">
      <div className="flex gap-2 p-2 bg-surface-0/80 backdrop-blur-xl border border-line rounded-clinical shadow-2xl pointer-events-auto items-center">
        <span className="text-[9px] uppercase font-bold text-ink-muted flex items-center pr-2 border-r border-line">
          Dock
        </span>
        {minimizedWindows.map((w) => (
          <button
            key={w.id}
            onClick={() => toggleMinimize(w.id)}
            className="px-3 py-1.5 bg-surface-50 hover:bg-surface-100 border border-line rounded text-[10px] font-mono text-ink transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            <span className="truncate max-w-[120px]">{w.title}</span>
          </button>
        ))}
        
        <div className="pl-2 ml-1 border-l border-line flex items-center">
          <button
            onClick={toggleZenMode}
            className={`px-3 py-1.5 rounded text-[10px] font-mono transition-colors flex items-center gap-2 border ${zenMode ? 'bg-accent-500/20 text-accent-400 border-accent-500/50' : 'bg-surface-50 hover:bg-surface-100 text-ink border-line'}`}
            title="Toggle Zen Mode (Hide Panels)"
          >
            Zen
          </button>
        </div>
      </div>
    </div>
  );
}
