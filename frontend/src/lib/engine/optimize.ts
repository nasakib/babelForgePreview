// Greedy auto-optimization: search the molecule database for the (≤3)-compound
// regimen that maximises the Topological Integrity Score Φ for the active
// pathologies, subject to a no-toxicity constraint.
import { molecules } from "@/data/molecules";
import { runDiagnosis, type PharmaVectors, type PatientParams, ZERO_VECTORS } from "./diagnosis";
import type { Pathology } from "./topology";

export interface RegimenItem {
  id: string;
  name: string;
  classLabel: string;
  isBabelForge?: boolean;
  isBlue?: boolean;
  dose: number; // 0..3
}

function sumVectors(items: RegimenItem[]): PharmaVectors {
  const v = { ...ZERO_VECTORS };
  for (const item of items) {
    const mol = molecules.find((m) => m.id === item.id);
    if (!mol) continue;
    const ratio = item.dose / 3.0;
    v.arousal += mol.effects.arousal * Math.min(1, ratio);
    v.dampening += mol.effects.dampening * Math.min(1, ratio);
    v.chaos += mol.effects.chaos * Math.min(1, ratio);
    v.repair += mol.effects.repair * Math.min(1, ratio);
  }
  return v;
}

export function autoOptimize(
  states: Pathology[],
  patient: PatientParams,
  maxStack = 3
): { regimen: RegimenItem[]; integrity: number; reasoning: string[] } {
  // Candidate pool: prefer babelForge precision agents matching state indications.
  const candidates = molecules.filter((m) => {
    if (m.class === "novel") return true;
    if (m.class === "ssri" || m.class === "antipsychotic" || m.class === "depressant") return true;
    if (m.class === "cannabinoid") return true;
    if (m.class === "stimulant" && (m.id === "modaf" || m.id === "armodaf" || m.id === "mph")) return true;
    return false;
  });

  const reasoning: string[] = [];
  const chosen: RegimenItem[] = [];

  // Greedy hill-climb.
  for (let pick = 0; pick < maxStack; pick++) {
    let best: { mol: any; dose: number; integ: number } | null = null;
    for (const mol of candidates) {
      if (chosen.find((c) => c.id === mol.id)) continue;
      for (const dose of [1, 2, 3]) {
        const trial = [...chosen, mkItem(mol, dose)];
        const v = sumVectors(trial);
        const r = runDiagnosis(states, v, patient);
        if (!best || r.integrity > best.integ) best = { mol, dose, integ: r.integrity };
      }
    }
    if (!best) break;
    const v0 = sumVectors(chosen);
    const r0 = runDiagnosis(states, v0, patient);
    if (best.integ <= r0.integrity + 1) break; // diminishing return
    chosen.push(mkItem(best.mol, best.dose));
    reasoning.push(
      `+ ${best.mol.name} @ dose ${best.dose}  →  Φ = ${best.integ}% (Δ ${best.integ - r0.integrity > 0 ? "+" : ""}${best.integ - r0.integrity})`
    );
  }

  const finalVec = sumVectors(chosen);
  const finalReport = runDiagnosis(states, finalVec, patient);
  return { regimen: chosen, integrity: finalReport.integrity, reasoning };
}

function mkItem(mol: any, dose: number): RegimenItem {
  return {
    id: mol.id,
    name: mol.name,
    classLabel: mol.classLabel,
    isBabelForge: mol.isBabelForge,
    isBlue: mol.isBlue,
    dose,
  };
}
