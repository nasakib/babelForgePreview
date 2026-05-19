/**
 * Auth & tenancy types.
 *
 * babelForgePreview is moving toward a multi-tenant SaaS posture:
 *
 *   User  ────belongs to──▶  Organization (workspace / clinic)
 *   User  ────has one────▶  Role (within that organization)
 *   Organization ────on────▶ Plan (free / clinical / enterprise)
 *
 * All clinical surfaces (Patients, Reports, Cohorts) MUST scope their
 * data by `{ orgId, userId }` so future server-side enforcement is a
 * pure rename.
 *
 * The current implementation is a **local demo provider** (see
 * `lib/auth/client.ts`). Swap that module for a real OIDC client when
 * the backend gains auth — every other file in the app already speaks
 * to the abstractions defined here.
 */

export type Role =
  | "owner"      // organization owner / billing admin
  | "clinician"  // can read/write patients + run sims
  | "researcher" // can run sims, read aggregate cohort only
  | "viewer";    // read-only, no patient PHI

export type Plan = "preview" | "clinical" | "enterprise";

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  /** Indicates whether this org has a signed BAA on file. Gates PHI features. */
  baaSigned: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  /** Display name; surfaced in the account menu. Not used as a stable key. */
  name: string;
  /** Login email. Treated as PII; never logged. */
  email: string;
  /** Initials used as an avatar fallback. */
  initials: string;
  role: Role;
  orgId: string;
}

export interface Session {
  user: User;
  org: Organization;
  /** ISO timestamp this session was issued. */
  issuedAt: string;
  /** ISO timestamp at which the session must be re-established. */
  expiresAt: string;
}

export type AuthStatus = "unknown" | "anonymous" | "authenticated";

/**
 * Capability matrix — single source of truth for "can role X do Y".
 * Any UI gate must consult `can()` so toggling a role globally
 * propagates without per-component edits.
 */
export const CAPABILITIES = {
  "patient.read":   ["owner", "clinician", "researcher"] as Role[],
  "patient.write":  ["owner", "clinician"] as Role[],
  "patient.export": ["owner", "clinician"] as Role[],
  "patient.purge":  ["owner"] as Role[],
  "billing.manage": ["owner"] as Role[],
  "org.invite":     ["owner"] as Role[],
  "sim.run":        ["owner", "clinician", "researcher", "viewer"] as Role[],
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false;
  return CAPABILITIES[capability].includes(role);
}

/** Plan-level feature gates. Independent of role. */
export const PLAN_FEATURES: Record<Plan, { maxPatients: number; baaCapable: boolean; }> = {
  preview:    { maxPatients: 5,    baaCapable: false },
  clinical:   { maxPatients: 250,  baaCapable: true  },
  enterprise: { maxPatients: Infinity, baaCapable: true },
};
