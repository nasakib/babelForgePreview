"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import { Session, AuthStatus, Capability, can } from "@/lib/auth/types";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn: (input: Parameters<typeof authClient.signIn>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  /** Convenience: capability check against the current role. */
  allows: (capability: Capability) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [session, setSession] = useState<Session | null>(null);

  const refresh = useCallback(() => {
    const s = authClient.getSession();
    setSession(s);
    setStatus(s ? "authenticated" : "anonymous");
  }, []);

  useEffect(() => {
    refresh();
    return authClient.subscribe(refresh);
  }, [refresh]);

  const value: AuthContextValue = {
    status,
    session,
    signIn: async (input) => {
      await authClient.signIn(input);
      refresh();
    },
    signOut: async () => {
      await authClient.signOut();
      refresh();
    },
    allows: (capability) => can(session?.user.role, capability),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
