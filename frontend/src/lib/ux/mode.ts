/**
 * UX mode — the user-facing dimension that controls how much jargon,
 * how many controls, and which clinical surfaces are visible.
 *
 *   explorer  → novice / curious public. Plain-language everywhere.
 *   patient   → an individual managing their own record only.
 *   clinical  → clinician / researcher full toolset.
 *
 * Mode is independent from `Role` (which controls *permissions*).
 * A clinician may still browse the app in `explorer` mode to demo it
 * to a patient. A patient cannot escalate themselves into `clinical`
 * mode — see `allowedModesForRole` below.
 */

import { Role } from "@/lib/auth/types";

export type UserMode = "explorer" | "patient" | "clinical";

export interface ModeDescriptor {
  key: UserMode;
  label: string;
  tagline: string;
  /** Default landing route after sign-in or onboarding. */
  landing: string;
  /** Whether jargon glossary tooltips are auto-expanded. */
  glossaryActive: boolean;
  /** Whether clinical-only surfaces (Stack Builder, Pharma, PGx) render. */
  showsClinicalSurfaces: boolean;
  /** Whether prescribing / dosing controls render. */
  showsPrescribing: boolean;
  /** Footer disclaimer key. */
  disclaimer: "explorer" | "patient" | "clinical";
}

export const MODE_DESCRIPTORS: Record<UserMode, ModeDescriptor> = {
  explorer: {
    key: "explorer",
    label: "Explorer",
    tagline:
      "Learn how the brain network is modeled — guided, plain language, no medical context required.",
    landing: "/welcome",
    glossaryActive: true,
    showsClinicalSurfaces: false,
    showsPrescribing: false,
    disclaimer: "explorer",
  },
  patient: {
    key: "patient",
    label: "Patient",
    tagline:
      "Track symptoms with validated scales, log how interventions feel, share a snapshot with your clinician.",
    landing: "/my-health",
    glossaryActive: true,
    showsClinicalSurfaces: false,
    showsPrescribing: false,
    disclaimer: "patient",
  },
  clinical: {
    key: "clinical",
    label: "Clinician",
    tagline:
      "Full topology, stack simulator, signal analyzer, pharmacogenomics, and patient cohort tools.",
    landing: "/",
    glossaryActive: false,
    showsClinicalSurfaces: true,
    showsPrescribing: true,
    disclaimer: "clinical",
  },
};

/**
 * Which modes a given role may select. Patients cannot self-promote.
 */
export function allowedModesForRole(role: Role | undefined): UserMode[] {
  switch (role) {
    case "owner":
    case "clinician":
      return ["clinical", "explorer"]; // can demo patient view via explorer
    case "researcher":
      return ["clinical", "explorer"];
    case "viewer":
      return ["explorer"];
    default:
      return ["explorer", "patient"]; // anonymous / no-role default
  }
}

export function defaultModeForRole(role: Role | undefined): UserMode {
  switch (role) {
    case "owner":
    case "clinician":
    case "researcher":
      return "clinical";
    case "viewer":
      return "explorer";
    default:
      return "explorer";
  }
}

export const DISCLAIMERS: Record<ModeDescriptor["disclaimer"], string> = {
  explorer:
    "babelForge is a research-grade simulation. Nothing on this screen is medical advice or a diagnosis.",
  patient:
    "This tool does not diagnose, treat, or replace your clinician. In crisis, contact your local emergency services or a crisis line.",
  clinical:
    "Research instrument. Compound vectors and severity heuristics derive from published literature and are not a substitute for clinical judgment.",
};
