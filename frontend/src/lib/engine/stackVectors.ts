/**
 * babelForge — stack → pharmacodynamic vector reduction.
 *
 * Mirrors the inline reducer that has lived in `app/stack-simulator/page.tsx`
 * so any component (NeuroCanvas dashboard, AI assistant, future widgets) can
 * convert an active stack into the same {arousal, dampening, chaos, repair}
 * vector that drives the simulation. Single source of truth.
 *
 * Pure function; no React, no I/O. Same semantics as the previous inline
 * computation: tolerance decay by class, dose ratio cap at 1.0, overdose
 * penalties scaled per class. If the inline logic ever diverges, update it
 * to consume this helper.
 */

export interface StackItem {
  class?: string;
  currentIntensity?: number;
  toleranceMonths?: number;
  effects?: {
    arousal?: number;
    dampening?: number;
    chaos?: number;
    repair?: number;
  };
}

export interface PharmaVectors {
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
}

const ZERO: PharmaVectors = { arousal: 0, dampening: 0, chaos: 0, repair: 0 };

import { computePharmaChemVectors } from "./pharmaChemEngine";

export function computeStackVectors(stack: StackItem[] | undefined | null): PharmaVectors {
  if (!stack || stack.length === 0) return { ...ZERO };
  
  // Call computePharmaChemVectors with a default patient and 0 elapsed hours
  const defaultPatient = { weightKg: 70, ageYears: 35 };
  const res = computePharmaChemVectors(stack, defaultPatient, 0);
  return res.vectors;
}
