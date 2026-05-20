import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindowContext } from "@/context/WindowContext";

interface DraggablePanelProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  onClose?: () => void;
  className?: string;
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
}: DraggablePanelProps) {
  const { windows, registerWindow, updateWindow, toggleMinimize, bringToFront, zenMode, ready } = useWindowContext();

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
      style={{ zIndex: win.zIndex, position: 'absolute' }}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-canvas/50">
          {children}
        </div>
      )}
    </Rnd>
  );
}