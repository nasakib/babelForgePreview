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

const getStorageKey = (orgId: string) => `babelforge:patients:v1:${orgId}`;
const getActiveKey = (orgId: string) => `babelforge:patients:active:v1:${orgId}`;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try { l(); } catch { /* swallow */ }
  });
}

function readAll(orgId: string): Patient[] {
  if (!orgId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(orgId));
    if (!raw) {
      if (orgId === "org_unsc_oni") {
        // Pre-seed Spartan-117 de-identified cohort patient
        const seed: Patient[] = [
          {
            id: "pt_spartan_117",
            mrn: "SPARTAN-117",
            initials: "J.S.",
            ageRange: { min: 35, max: 44 },
            sex: "male",
            gender: "man",
            handedness: "right",
            pregnancy: "not_applicable",
            weightKg: 130, // Spartan augmentations
            heightCm: 208, // John-117 height
            allergies: [],
            medications: [
              { name: "ZenBud", doseMg: 3, schedule: "QD" },
              { name: "Sertraline", doseMg: 100, schedule: "QD" }
            ],
            region: "Epsilon Eridani",
            notes: "Subject John-117 displays severe stress-induced rigidities from continuous covenant combat. DMN desynchronization locked. Responding successfully to synaptogenesis welds under active ZenBud pharmacodynamics.",
            pathologies: [
              { code: "PTSD", severity: "severe", onsetYear: 2547, priorResponse: 1 },
              { code: "DEPRESSION", severity: "mild", onsetYear: 2552, priorResponse: 1 }
            ],
            scales: {
              phq9: 12,
              gad7: 15,
              moca: 28,
              pcl5: 58,
              asrs: 6,
              ygtss: 0,
              auditc: 2
            },
            pgx: {
              cyp2d6: "extensive",
              cyp2c19: "intermediate",
              cyp3a4: "extensive",
              hlaB1502: false,
              hlaB5701: false
            },
            vitals: {
              heartRateBpm: 52,
              bpSystolic: 115,
              bpDiastolic: 70,
              sleepHours: 5.5
            },
            clinician: "CH", // Dr. Halsey
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        window.localStorage.setItem(getStorageKey(orgId), JSON.stringify(seed));
        return seed;
      }
      return [];
    }
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Patient[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orgId: string, rows: Patient[]) {
  if (!orgId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(orgId), JSON.stringify(rows));
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

  list(orgId: string): Patient[] {
    return readAll(orgId).sort(
      (a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")
    );
  },

  get(orgId: string, id: string): Patient | null {
    return readAll(orgId).find((p) => p.id === id) ?? null;
  },

  create(orgId: string, draft: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...draft,
      id: uid(),
      createdAt: now,
      updatedAt: now,
    };
    const rows = readAll(orgId);
    rows.push(patient);
    writeAll(orgId, rows);
    emit();
    return patient;
  },

  update(orgId: string, id: string, patch: Partial<Patient>): Patient | null {
    const rows = readAll(orgId);
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
    writeAll(orgId, rows);
    emit();
    return merged;
  },

  remove(orgId: string, id: string): void {
    const rows = readAll(orgId).filter((p) => p.id !== id);
    writeAll(orgId, rows);
    if (patientStore.getActiveId(orgId) === id) patientStore.setActive(orgId, null);
    emit();
  },

  getActiveId(orgId: string): string | null {
    if (!orgId || typeof window === "undefined") return null;
    return window.localStorage.getItem(getActiveKey(orgId));
  },

  setActive(orgId: string, id: string | null): void {
    if (!orgId || typeof window === "undefined") return;
    if (id) window.localStorage.setItem(getActiveKey(orgId), id);
    else window.localStorage.removeItem(getActiveKey(orgId));
    emit();
  },

  getActive(orgId: string): Patient | null {
    const id = patientStore.getActiveId(orgId);
    return id ? patientStore.get(orgId, id) : null;
  },

  /**
   * Hard-clears all patient data. Surfaced in the UI as
   * "Purge local cohort" so clinicians can wipe a shared workstation.
   */
  purgeAll(orgId: string): void {
    if (!orgId || typeof window === "undefined") return;
    window.localStorage.removeItem(getStorageKey(orgId));
    window.localStorage.removeItem(getActiveKey(orgId));
    emit();
  },

  /** Export the cohort as a JSON Blob for clinician-controlled handoff. */
  export(orgId: string): Blob {
    return new Blob([JSON.stringify(readAll(orgId), null, 2)], {
      type: "application/json",
    });
  },
};
