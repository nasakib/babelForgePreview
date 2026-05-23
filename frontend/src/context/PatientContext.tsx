"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { patientStore } from "@/lib/patient/store";
import { Patient, patientToPathologyCodes } from "@/lib/patient/types";
import { useAI } from "@/context/AIContext";
import { useAuth } from "@/context/AuthContext";

interface PatientContextValue {
  patients: Patient[];
  active: Patient | null;
  setActiveId: (id: string | null) => void;
  refresh: () => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

/**
 * Reactive bridge between the local patient store and the rest of the
 * app. When an active patient changes, the patient's pathology stack is
 * mirrored into AIContext so the Console, 11D viewer, and stack
 * simulator immediately reflect the diagnosis under examination.
 */
export function PatientProvider({ children }: { children: ReactNode }) {
  const ai = useAI();
  const { session } = useAuth();
  const orgId = session?.org?.id || "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);

  const refresh = () => {
    if (!orgId) {
      setPatients([]);
      setActiveIdState(null);
      return;
    }
    setPatients(patientStore.list(orgId));
    setActiveIdState(patientStore.getActiveId(orgId));
  };

  useEffect(() => {
    refresh();
    return patientStore.subscribe(refresh);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const active = activeId ? patients.find((p) => p.id === activeId) ?? null : null;

  // Sync active patient's pathologies into the AI context.
  useEffect(() => {
    const codes = patientToPathologyCodes(active);
    ai.setActivePathologies(codes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.pathologies?.length]);

  const value: PatientContextValue = {
    patients,
    active,
    setActiveId: (id) => {
      if (orgId) {
        patientStore.setActive(orgId, id);
        refresh();
      }
    },
    refresh,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within a PatientProvider");
  return ctx;
}
