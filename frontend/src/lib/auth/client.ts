/**
 * Local-only "demo" auth client.
 *
 * SWAP-OUT BOUNDARY
 * ─────────────────
 * Replace the bodies of `signIn`, `signOut`, `getSession`, and
 * `subscribe` with a real provider when ready. The exported surface
 * (`authClient`) is the only thing consumed by the rest of the app
 * — do not import this file's internals anywhere else.
 *
 * Reference providers we have considered:
 *   - Auth0 (OIDC, BAA available on enterprise plans)
 *   - Clerk (multi-tenant orgs out of the box)
 *   - Supabase (Postgres + RLS)
 *   - Custom FastAPI + OIDC against the babelForge backend
 *
 * In demo mode the session is persisted in localStorage so the rest
 * of the SaaS UI (account menu, role gates, per-user patient namespacing)
 * can be exercised without a backend.
 */

import { Organization, Session, User } from "./types";

const SESSION_KEY = "babelforge:auth:session:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try { l(); } catch { /* swallow */ }
  });
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Session;
    if (new Date(v.expiresAt).getTime() < Date.now()) return null;
    return v;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(SESSION_KEY);
  emit();
}

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${(crypto as any).randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

export interface SignInInput {
  name: string;
  email: string;
  orgName?: string;
  role?: User["role"];
}

export const authClient = {
  getSession(): Session | null {
    return readSession();
  },

  /**
   * Demo sign-in. Real implementation should redirect to OIDC and
   * resolve a session from the resulting code exchange.
   */
  async signIn({ name, email, orgName, role = "clinician" }: SignInInput): Promise<Session> {
    const orgId = uid("org");
    const userId = uid("usr");
    const now = new Date();
    const expires = new Date(now.getTime() + 1000 * 60 * 60 * 12); // 12h

    const org: Organization = {
      id: orgId,
      name: (orgName || `${name.split(" ")[0] ?? "Personal"} Workspace`).trim(),
      plan: "preview",
      baaSigned: false,
      createdAt: now.toISOString(),
    };
    const user: User = {
      id: userId,
      name: name.trim() || "Clinician",
      email: email.trim() || "demo@babelforge.local",
      initials: initialsOf(name),
      role,
      orgId,
    };
    const session: Session = {
      user,
      org,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    writeSession(session);
    return session;
  },

  async signOut(): Promise<void> {
    writeSession(null);
  },

  async updateSession({ name, orgName }: { name?: string; orgName?: string }): Promise<Session> {
    const s = readSession();
    if (!s) throw new Error("No active session to update.");
    if (name !== undefined) {
      s.user.name = name.trim();
      s.user.initials = initialsOf(name);
    }
    if (orgName !== undefined) {
      s.org.name = orgName.trim();
    }
    writeSession(s);
    return s;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
