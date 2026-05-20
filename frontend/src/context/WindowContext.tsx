"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

const STORAGE_KEY = "babelforge:windows:v1";

export interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  minimized: boolean;
  zIndex: number;
}

interface WindowContextValue {
  windows: Record<string, WindowState>;
  zenMode: boolean;
  toggleZenMode: () => void;
  registerWindow: (id: string, title: string, defaultState: Partial<WindowState>) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  toggleMinimize: (id: string) => void;
  bringToFront: (id: string) => void;
  ready: boolean;
}

const WindowContext = createContext<WindowContextValue | undefined>(undefined);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<Record<string, WindowState>>({});
  const [zenMode, setZenMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [maxZ, setMaxZ] = useState(10);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setWindows(parsed.windows || {});
        setZenMode(parsed.zenMode || false);
        
        // Find highest zIndex to continue from there
        let highestZ = 10;
        Object.values(parsed.windows || {}).forEach((w: any) => {
          if (w.zIndex > highestZ) highestZ = w.zIndex;
        });
        setMaxZ(highestZ);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ windows, zenMode }));
      } catch {
        /* ignore */
      }
    }, 500); // debounce persistence slightly
    return () => clearTimeout(timer);
  }, [windows, zenMode, ready]);

  const toggleZenMode = useCallback(() => {
    setZenMode((prev) => !prev);
  }, []);

  const registerWindow = useCallback((id: string, title: string, defaultState: Partial<WindowState>) => {
    setWindows((prev) => {
      if (prev[id]) {
        // Just update title if it changed, keep rest of state
        if (prev[id].title !== title) {
          return { ...prev, [id]: { ...prev[id], title } };
        }
        return prev;
      }
      return {
        ...prev,
        [id]: {
          id,
          title,
          x: defaultState.x ?? 50,
          y: defaultState.y ?? 50,
          width: defaultState.width ?? 400,
          height: defaultState.height ?? 500,
          minimized: defaultState.minimized ?? false,
          zIndex: defaultState.zIndex ?? maxZ + 1,
        },
      };
    });
    setMaxZ((z) => z + 1);
  }, [maxZ]);

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], minimized: !prev[id].minimized } };
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setMaxZ((prevMax) => {
      const nextMax = prevMax + 1;
      setWindows((prev) => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], zIndex: nextMax } };
      });
      return nextMax;
    });
  }, []);

  return (
    <WindowContext.Provider
      value={{
        windows,
        zenMode,
        toggleZenMode,
        registerWindow,
        updateWindow,
        toggleMinimize,
        bringToFront,
        ready,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowContext() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useWindowContext must be used within a WindowProvider");
  return ctx;
}
