import { useState } from "react";
import { Rnd } from "react-rnd";

interface DraggablePanelProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  onClose?: () => void;
  className?: string;
  zIndex?: number;
  onDragStart?: () => void;
}

export default function DraggablePanel({
  id,
  title,
  subtitle,
  children,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 400, height: 500 },
  onClose,
  className = "",
  zIndex = 10,
  onDragStart,
}: DraggablePanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <Rnd
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: isMinimized ? 50 : defaultSize.height,
      }}
      minWidth={300}
      minHeight={isMinimized ? 50 : 200}
      bounds="window"
      dragHandleClassName="panel-drag-handle"
      className={`absolute flex flex-col bg-surface-0/80 backdrop-blur-xl border border-line rounded-clinical shadow-2xl overflow-hidden pointer-events-auto transition-shadow duration-200 ${className}`}
      style={{ zIndex }}
      onDragStart={onDragStart}
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
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-ink-subtle hover:text-ink transition-colors p-1"
          >
            <svg className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-subtle hover:text-crit transition-colors p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-canvas/50">
          {children}
        </div>
      )}
    </Rnd>
  );
}