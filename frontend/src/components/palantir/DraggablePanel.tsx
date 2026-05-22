import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindowContext } from "@/context/WindowContext";
import ExplanationOverlay from "@/components/clinical/ExplanationOverlay";

interface DraggablePanelProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  onClose?: () => void;
  className?: string;
  isExplainOpen?: boolean;
  onExplainToggle?: (open: boolean) => void;
  customExplanation?: boolean;
}

const PANEL_EXPLANATION_MAP: Record<string, string> = {
  "console-left-panel": "patient-state-modifiers",
  "console-right-panel": "diagnostic-ai",
  "node-filter-panel": "node-filter",
  "time-engine-panel": "time-engine",
  "realtime-kuramoto": "neuro-canvas",
  "layer-controls": "neuro-canvas",
  "receptor-occupancy-panel": "receptor-occupancy",
  "stack-builder": "clinical-profile",
  "holographic-generalization": "holographic-generalization",
  "holographic-integrity": "holographic-integrity",
  "holographic-tda": "holographic-tda",
  "holographic-connectome": "holographic-connectome",
  "holographic-manifold": "holographic-manifold",
  "holographic-predictor": "holographic-predictor",
  "holographic-sieve": "holographic-sieve",
  "holographic-interventions": "holographic-interventions",
  "see-results-panel": "see-results",
  "experience-simulator": "experience-simulator",
  "experience-projection": "experience-projection",
  "fmri-workbench": "fmri-workbench",
  "signal-analyzer-sidebar": "signal-analyzer-sidebar",
  "11d-projection-sidebar": "11d-projection-sidebar",
  "biophysical-animation": "biophysical-canvas",
  "console-compound-inspector": "biophysical-canvas",
};

export default function DraggablePanel({
  id,
  title,
  subtitle,
  children,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 400, height: 500 },
  onClose,
  className = "",
  isExplainOpen: controlledIsExplainOpen,
  onExplainToggle,
  customExplanation = false,
}: DraggablePanelProps) {
  const { windows, registerWindow, updateWindow, toggleMinimize, bringToFront, zenMode, ready } = useWindowContext();
  const [isMobile, setIsMobile] = useState(false);
  const [internalIsExplainOpen, setInternalIsExplainOpen] = useState(false);

  const isExplainOpen = controlledIsExplainOpen !== undefined ? controlledIsExplainOpen : internalIsExplainOpen;
  const setIsExplainOpen = (val: boolean) => {
    if (onExplainToggle) {
      onExplainToggle(val);
    } else {
      setInternalIsExplainOpen(val);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (ready) {
      registerWindow(id, title, {
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: defaultSize.height,
        minimized: false,
      });
    }
  }, [id, title, defaultPosition.x, defaultPosition.y, defaultSize.width, defaultSize.height, registerWindow, ready]);

  if (!ready || !windows[id]) return null;
  if (zenMode) return null;

  const win = windows[id];
  const explanationId = PANEL_EXPLANATION_MAP[id];
  const hasExplanation = !!explanationId;
  const showInternalOverlay = hasExplanation && !customExplanation;

  if (isMobile) {
    return (
      <div
        className={`relative flex flex-col bg-surface-0/90 backdrop-blur-xl border border-line rounded-clinical shadow-lg overflow-hidden my-4 mx-auto w-full max-w-lg pointer-events-auto ${className}`}
        style={{ display: win.minimized ? 'none' : 'flex', zIndex: win.zIndex }}
        onMouseDown={() => bringToFront(id)}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-50">
          <div>
            <div className="text-[14px] text-ink font-medium tracking-tight">
              {title}
            </div>
            {subtitle && (
              <div className="text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasExplanation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExplainOpen(!isExplainOpen);
                }}
                className={`transition-colors p-1 flex items-center justify-center rounded-full ${
                  isExplainOpen 
                    ? "text-accent bg-accent-500/20" 
                    : "text-ink-subtle hover:text-accent hover:bg-surface-100"
                }`}
                title={isExplainOpen ? "Close explanation" : "Explain component"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize(id);
              }}
              className="text-ink-subtle hover:text-ink transition-colors p-1"
            >
              <svg className={`w-4 h-4 transition-transform ${win.minimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-ink-subtle hover:text-crit transition-colors p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {!win.minimized && (
          <div className="flex-1 max-h-[450px] overflow-y-auto custom-scrollbar bg-canvas/50 relative">
            {children}
            {showInternalOverlay && (
              <ExplanationOverlay
                componentId={explanationId}
                isOpen={isExplainOpen}
                onClose={() => setIsExplainOpen(false)}
                inline={true}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Rnd
      size={{
        width: win.width,
        height: win.minimized ? 50 : win.height,
      }}
      position={{ x: win.x, y: win.y }}
      onDragStop={(e, d) => {
        updateWindow(id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateWindow(id, {
          width: ref.style.width,
          height: ref.style.height,
          x: position.x,
          y: position.y,
        });
      }}
      minWidth={300}
      minHeight={win.minimized ? 50 : 200}
      bounds="window"
      dragHandleClassName="panel-drag-handle"
      className={`absolute flex flex-col bg-surface-0/80 backdrop-blur-xl border border-line rounded-clinical shadow-2xl overflow-hidden pointer-events-auto transition-shadow duration-200 ${className}`}
      style={{ zIndex: win.zIndex, position: 'absolute', display: win.minimized ? 'none' : 'flex' }}
      onDragStart={() => bringToFront(id)}
      onMouseDown={() => bringToFront(id)}
    >
      <div className="panel-drag-handle flex items-center justify-between px-4 py-3 border-b border-line bg-surface-50 cursor-grab active:cursor-grabbing">
        <div>
          <div className="text-[14px] text-ink font-medium tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasExplanation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExplainOpen(!isExplainOpen);
              }}
              className={`transition-colors p-1 flex items-center justify-center rounded-full ${
                isExplainOpen 
                  ? "text-accent bg-accent-500/20" 
                  : "text-ink-subtle hover:text-accent hover:bg-surface-100"
              }`}
              title={isExplainOpen ? "Close explanation" : "Explain component"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(id);
            }}
            className="text-ink-subtle hover:text-ink transition-colors p-1"
          >
            <svg className={`w-4 h-4 transition-transform ${win.minimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-ink-subtle hover:text-crit transition-colors p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {!win.minimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-canvas/50 relative">
          {children}
          {showInternalOverlay && (
            <ExplanationOverlay
              componentId={explanationId}
              isOpen={isExplainOpen}
              onClose={() => setIsExplainOpen(false)}
              inline={true}
            />
          )}
        </div>
      )}
    </Rnd>
  );
}