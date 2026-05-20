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
  return autoOptimizeIdeal(states, patient, maxStack);
}

// Ideal Clinical Intervention (Purple path): Includes high-potency novel therapeutics, surgical neuromodulations, psychotherapies, and advanced synergies
export function autoOptimizeIdeal(
  states: Pathology[],
  patient: PatientParams,
  maxStack = 3
): { regimen: RegimenItem[]; integrity: number; reasoning: string[] } {
  const candidates = molecules.filter((m) => {
    // Exclude recreational high-toxicity/addiction compounds
    if (["meth", "coke", "fent", "oxy", "alc", "nicotine", "alpraz", "clonaz", "diaz", "loraz", "zolp", "zopic"].includes(m.id)) {
      return false;
    }
    // Include all novels, SSRIs, antipsychotics, correctives, lifestyle, neuromodulation, and selected stimulants/cannabinoids
    return (
      m.class === "novel" ||
      m.class === "ssri" ||
      m.class === "antipsychotic" ||
      m.class === "corrective" ||
      m.isLifestyle ||
      (m.class === "stimulant" && ["modaf", "armodaf", "mph", "dexmph", "lisdexamph", "caffeine"].includes(m.id)) ||
      (m.class === "cannabinoid" && ["cbd", "cbg", "cbga", "cbdv", "cbdp", "cbc", "cbl", "cbn"].includes(m.id)) ||
      (m.class === "depressant" && ["gaba", "pregab", "donepezil", "memantine", "dextro"].includes(m.id))
    );
  });

  const reasoning: string[] = [];
  const chosen: RegimenItem[] = [];

  for (let pick = 0; pick < maxStack; pick++) {
    let best: { mol: any; dose: number; integ: number } | null = null;
    for (const mol of candidates) {
      if (chosen.find((c) => c.id === mol.id)) continue;
      for (const dose of [1, 2, 3]) {
        const trial = [...chosen, mkItem(mol, dose, "ideal")];
        const v = sumVectors(trial);
        const r = runDiagnosis(states, v, patient, trial);
        if (!best || r.integrity > best.integ) best = { mol, dose, integ: r.integrity };
      }
    }
    if (!best) break;
    const v0 = sumVectors(chosen);
    const r0 = runDiagnosis(states, v0, patient, chosen);
    if (best.integ <= r0.integrity + 0.5) break; // diminishing return check (tuned to 0.5 to allow tiny positive adjustments)
    chosen.push(mkItem(best.mol, best.dose, "ideal"));
    reasoning.push(
      `+ ${best.mol.name} @ dose ${best.dose}  →  Φ = ${best.integ}% (Δ ${best.integ - r0.integrity > 0 ? "+" : ""}${best.integ - r0.integrity})`
    );
  }

  const finalVec = sumVectors(chosen);
  const finalReport = runDiagnosis(states, finalVec, patient, chosen);
  return { regimen: chosen, integrity: finalReport.integrity, reasoning };
}

// Conventional Intervention (Blue path): Cheap, legal, FDA-approved, highly accessible standard clinical care (Lifestyle + approved OTC/prescription medications)
export function autoOptimizeLeastResistance(
  states: Pathology[],
  patient: PatientParams,
  maxStack = 3
): { regimen: RegimenItem[]; integrity: number; reasoning: string[] } {
  const candidates = molecules.filter((m) => {
    // Exclude all novel therapeutics/psychedelics/experimental items
    if (m.isBabelForge || m.class === "novel" || ["psilo", "lsd", "mdma", "ketamine", "tcca", "dbs", "vns", "tms", "ect"].includes(m.id)) {
      return false;
    }
    // Exclude experimental/novel correctives
    if (["sr17", "nrg01", "flumazenil"].includes(m.id)) {
      return false;
    }
    // Exclude toxic/abusive/recreational compounds
    if (["meth", "coke", "fent", "oxy", "alc", "nicotine", "alpraz", "clonaz", "diaz", "loraz", "zolp", "zopic"].includes(m.id)) {
      return false;
    }
    // Include conventional, legal standard items
    return (
      m.isLifestyle ||
      m.class === "ssri" ||
      m.class === "antipsychotic" ||
      (m.class === "corrective" && ["clonidine", "acamprosate", "nac", "agmatine", "galantamine", "methadone", "buprenorphine"].includes(m.id)) ||
      (m.class === "stimulant" && ["modaf", "armodaf", "mph", "dexmph", "lisdexamph", "caffeine"].includes(m.id)) ||
      (m.class === "cannabinoid" && ["cbd", "cbg", "cbga", "cbdv", "cbdp", "cbc", "cbl", "cbn"].includes(m.id)) ||
      (m.class === "depressant" && ["gaba", "pregab", "donepezil", "memantine", "dextro"].includes(m.id))
    );
  });

  const reasoning: string[] = [];
  const chosen: RegimenItem[] = [];

  for (let pick = 0; pick < maxStack; pick++) {
    let best: { mol: any; dose: number; integ: number } | null = null;
    for (const mol of candidates) {
      if (chosen.find((c) => c.id === mol.id)) continue;
      for (const dose of [1, 2, 3]) {
        const trial = [...chosen, mkItem(mol, dose, "conventional")];
        const v = sumVectors(trial);
        const r = runDiagnosis(states, v, patient, trial);
        if (!best || r.integrity > best.integ) best = { mol, dose, integ: r.integrity };
      }
    }
    if (!best) break;
    const v0 = sumVectors(chosen);
    const r0 = runDiagnosis(states, v0, patient, chosen);
    if (best.integ <= r0.integrity + 0.5) break; // diminishing return check
    chosen.push(mkItem(best.mol, best.dose, "conventional"));
    reasoning.push(
      `+ ${best.mol.name} @ dose ${best.dose}  →  Φ = ${best.integ}% (Δ ${best.integ - r0.integrity > 0 ? "+" : ""}${best.integ - r0.integrity})`
    );
  }

  const finalVec = sumVectors(chosen);
  const finalReport = runDiagnosis(states, finalVec, patient, chosen);
  return { regimen: chosen, integrity: finalReport.integrity, reasoning };
}

function mkItem(mol: any, dose: number, path: "conventional" | "ideal"): RegimenItem {
  return {
    id: mol.id,
    name: mol.name,
    classLabel: mol.classLabel,
    isBabelForge: mol.isBabelForge,
    isBlue: path === "conventional",
    dose,
  };
}
