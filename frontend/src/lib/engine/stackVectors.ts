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

export function computeStackVectors(stack: StackItem[] | undefined | null): PharmaVectors {
  if (!stack || stack.length === 0) return { ...ZERO };
  const net: PharmaVectors = { ...ZERO };

  for (const mol of stack) {
    const intensity = mol.currentIntensity ?? 0;
    if (intensity <= 0) continue;

    const tolMonths = mol.toleranceMonths ?? 0;
    let tolRate = 0.1;
    if (mol.class === "stimulant" || mol.class === "recreational") tolRate = 0.5;
    if (mol.class === "novel") tolRate = 0.05;
    if (mol.class === "cannabinoid") tolRate = 0.3;

    const tolFactor = 1 / (1 + Math.log1p(tolMonths * tolRate));
    const ratio = (intensity / 2.0) * tolFactor;
    const capped = Math.min(1, ratio);
    const overDose = Math.max(0, ratio - 1);

    const e = mol.effects ?? {};
    net.arousal += (e.arousal ?? 0) * capped;
    net.dampening += (e.dampening ?? 0) * capped;
    net.repair += (e.repair ?? 0) * capped;
    net.chaos += (e.chaos ?? 0) * capped;

    if (overDose > 0) {
      if ((mol.class === "stimulant" || mol.class === "novel") && (e.arousal ?? 0) > 0) {
        net.chaos += overDose * 1.5;
        net.arousal += overDose * 0.5;
        net.repair -= overDose * 0.5;
      } else if (
        mol.class === "antipsychotic" ||
        mol.class === "depressant" ||
        mol.class === "ssri"
      ) {
        net.dampening += overDose * 2.0;
        net.chaos += overDose * 0.5;
        net.repair -= overDose * 0.5;
      } else {
        net.chaos += overDose * 1.0;
        net.repair -= overDose * 0.5;
      }
    }
  }

  return net;
}
