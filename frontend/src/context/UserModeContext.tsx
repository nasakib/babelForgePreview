"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserMode, MODE_DESCRIPTORS, defaultModeForRole, allowedModesForRole } from "@/lib/ux/mode";
import { AuthContext } from "@/context/AuthContext";

const STORAGE_KEY = "babelforge:ux:mode:v1";

interface UserModeContextValue {
  mode: UserMode;
  setMode: (m: UserMode) => void;
  allowed: UserMode[];
  descriptor: typeof MODE_DESCRIPTORS[UserMode];
  /** True until we've finished hydrating from localStorage. */
  ready: boolean;
}

const UserModeContext = createContext<UserModeContextValue | undefined>(undefined);

export function UserModeProvider({ children }: { children: ReactNode }) {
  // Tolerate missing AuthProvider — the app must keep working unauthenticated.
  const authCtx = useContext(AuthContext);
  const role = authCtx?.session?.user.role;
  const [mode, setModeState] = useState<UserMode>("explorer");
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && (raw === "explorer" || raw === "patient" || raw === "clinical")) {
        setModeState(raw as UserMode);
      } else {
        setModeState(defaultModeForRole(role));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-evaluate when role changes (sign-in/out). Only clamp if current
  // mode is no longer allowed for this role.
  useEffect(() => {
    if (!ready) return;
    const allowed = allowedModesForRole(role);
    if (!allowed.includes(mode)) {
      setModeState(defaultModeForRole(role));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, ready]);

  // Persist.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode, ready]);

  const allowed = allowedModesForRole(role);

  const value: UserModeContextValue = {
    mode,
    setMode: (m) => {
      if (allowed.includes(m)) setModeState(m);
    },
    allowed,
    descriptor: MODE_DESCRIPTORS[mode],
    ready,
  };

  return <UserModeContext.Provider value={value}>{children}</UserModeContext.Provider>;
}

export function useUserMode(): UserModeContextValue {
  const ctx = useContext(UserModeContext);
  if (!ctx) throw new Error("useUserMode must be used within a UserModeProvider");
  return ctx;
}
