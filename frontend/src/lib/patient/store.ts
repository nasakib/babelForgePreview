/**
 * Local-first patient store.
 *
 * HIPAA NOTICE
 * ────────────
 * All records live in the browser's localStorage. Nothing is ever sent
 * to the backend. Even so, the data is not encrypted at rest — modern
 * browsers expose localStorage to any code running on this origin and
 * to anyone with physical access to the device.
 *
 * Until a HIPAA-compliant storage layer is in place, clinicians MUST
 * follow the entry rules surfaced in `HipaaNotice` (initials only,
 * no DOB, no full address, internal MRN surrogate).
 *
 * The exported `subscribe` channel powers reactive UIs without forcing
 * each consumer to wire up a context.
 */

import { Patient } from "./types";

const STORAGE_KEY = "babelforge:patients:v1";
const ACTIVE_KEY = "babelforge:patients:active:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try { l(); } catch { /* swallow */ }
  });
}

function readAll(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Patient[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: Patient[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* quota — ignore */
  }
}

function uid(): string {
  // crypto.randomUUID is available in evergreen browsers; fall back to a
  // sufficiently-random string for older environments.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const patientStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  list(): Patient[] {
    return readAll().sort(
      (a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")
    );
  },

  get(id: string): Patient | null {
    return readAll().find((p) => p.id === id) ?? null;
  },

  create(draft: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...draft,
      id: uid(),
      createdAt: now,
      updatedAt: now,
    };
    const rows = readAll();
    rows.push(patient);
    writeAll(rows);
    emit();
    return patient;
  },

  update(id: string, patch: Partial<Patient>): Patient | null {
    const rows = readAll();
    const idx = rows.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const merged: Patient = {
      ...rows[idx],
      ...patch,
      id: rows[idx].id,
      createdAt: rows[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    rows[idx] = merged;
    writeAll(rows);
    emit();
    return merged;
  },

  remove(id: string): void {
    const rows = readAll().filter((p) => p.id !== id);
    writeAll(rows);
    if (patientStore.getActiveId() === id) patientStore.setActive(null);
    emit();
  },

  getActiveId(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_KEY);
  },

  setActive(id: string | null): void {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
    emit();
  },

  getActive(): Patient | null {
    const id = patientStore.getActiveId();
    return id ? patientStore.get(id) : null;
  },

  /**
   * Hard-clears all patient data. Surfaced in the UI as
   * "Purge local cohort" so clinicians can wipe a shared workstation.
   */
  purgeAll(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_KEY);
    emit();
  },

  /** Export the cohort as a JSON Blob for clinician-controlled handoff. */
  export(): Blob {
    return new Blob([JSON.stringify(readAll(), null, 2)], {
      type: "application/json",
    });
  },
};
