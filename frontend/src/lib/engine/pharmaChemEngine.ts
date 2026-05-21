import type { PatientProfile } from "@/lib/patient/profile";
import type { PharmaVectors } from "./stackVectors";

export interface ReceptorProfile {
  DAT: number;  // Ki in nM (lower = stronger binding)
  SERT: number;
  NET: number;
  HT2A: number; // 5-HT2A
  GABAA: number;
  MOR: number;  // Mu-Opioid
  NMDA: number; // NMDA glutamate channel
  ADRA2A: number; // Alpha-2A adrenergic
}

export interface CompoundProperties {
  id: string;
  name: string;
  class: string;
  halfLifeHrs: number;
  cypEnzymes: string[]; // CYP2D6, CYP2C19, CYP3A4, CYP1A2, etc.
  receptors: Partial<ReceptorProfile>;
  efficacy: Partial<Record<keyof ReceptorProfile, number>>; // agonist (>0), antagonist (<0), transporter releasing (>1)
}

// ----------------------------------------------------------------------------
// 1. COMPOUND CHEMICAL DATABASE
// ----------------------------------------------------------------------------
export const COMPOUND_DATABASE: Record<string, CompoundProperties> = {
  // --- NOVELS & EXPERIMENTALS ---
  spur01: {
    id: "spur01", name: "SPUR-1 Ontological Reducer", class: "novel", halfLifeHrs: 0.168, cypEnzymes: ["CYP3A4"],
    receptors: { MOR: 0.2, HT2A: 1.5, NMDA: 150 },
    efficacy: { MOR: 1.4, HT2A: -1.0, NMDA: -0.4 }
  },
  zb01: {
    id: "zb01", name: "ZenBud™ (ZB-01)", class: "novel", halfLifeHrs: 18, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 100, GABAA: 250 },
    efficacy: { HT2A: -0.8, GABAA: 0.4 } // moderate GABA-A agonism, HT2A block
  },
  ll07: {
    id: "ll07", name: "LimbicLink™ (LL-07)", class: "novel", halfLifeHrs: 36, cypEnzymes: ["CYP2C19"],
    receptors: { HT2A: 50, SERT: 20 },
    efficacy: { HT2A: 0.3, SERT: 0.8 }
  },
  ss20: {
    id: "ss20", name: "SynaptoStim™ (SS-20)", class: "novel", halfLifeHrs: 4, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 5, NET: 12 },
    efficacy: { DAT: 1.5, NET: 1.2 }
  },
  dr02: {
    id: "dr02", name: "DopaReg™ (DR-02)", class: "novel", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 10 },
    efficacy: { DAT: -1.0 } // strong dopamine transporter blocker/regulator
  },
  nx44: {
    id: "nx44", name: "NeuroX™ (NX-44)", class: "novel", halfLifeHrs: 48, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 200 },
    efficacy: { HT2A: 0.5 } // mild HT2A agonist, high BDNF / repair effects
  },
  psilo: {
    id: "psilo", name: "Psilocybin", class: "novel", halfLifeHrs: 3, cypEnzymes: [],
    receptors: { HT2A: 10 },
    efficacy: { HT2A: 1.0 } // full 5-HT2A agonist
  },
  lsd: {
    id: "lsd", name: "LSD", class: "novel", halfLifeHrs: 8, cypEnzymes: ["CYP2D6"],
    receptors: { HT2A: 1.2, DAT: 500, NET: 1000 },
    efficacy: { HT2A: 0.95, DAT: 0.2, NET: 0.1 }
  },
  mdma: {
    id: "mdma", name: "MDMA", class: "novel", halfLifeHrs: 7, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 5, DAT: 50, HT2A: 200 },
    efficacy: { SERT: 1.6, DAT: 0.8, HT2A: 0.5 } // potent monoamine releaser
  },
  ketamine: {
    id: "ketamine", name: "Ketamine", class: "novel", halfLifeHrs: 2.5, cypEnzymes: ["CYP3A4"],
    receptors: { NMDA: 150 },
    efficacy: { NMDA: -1.0 } // strong channel blocker
  },

  // --- SSRIs & SNRIs ---
  sert: {
    id: "sert", name: "Sertraline", class: "ssri", halfLifeHrs: 26, cypEnzymes: ["CYP2C19", "CYP3A4"],
    receptors: { SERT: 0.3 }, efficacy: { SERT: 1.0 }
  },
  fluox: {
    id: "fluox", name: "Fluoxetine", class: "ssri", halfLifeHrs: 72, cypEnzymes: ["CYP2D6", "CYP2C19"],
    receptors: { SERT: 1.0 }, efficacy: { SERT: 1.0 }
  },
  escit: {
    id: "escit", name: "Escitalopram", class: "ssri", halfLifeHrs: 30, cypEnzymes: ["CYP2C19", "CYP3A4"],
    receptors: { SERT: 1.1 }, efficacy: { SERT: 1.0 }
  },
  venla: {
    id: "venla", name: "Venlafaxine", class: "ssri", halfLifeHrs: 5, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 80, NET: 1000 }, efficacy: { SERT: 1.0, NET: 0.3 }
  },
  dulox: {
    id: "dulox", name: "Duloxetine", class: "ssri", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 0.8, NET: 7.5 }, efficacy: { SERT: 1.0, NET: 0.8 }
  },
  citalo: {
    id: "citalo", name: "Citalopram", class: "ssri", halfLifeHrs: 35, cypEnzymes: ["CYP2C19"],
    receptors: { SERT: 1.5 }, efficacy: { SERT: 1.0 }
  },
  parox: {
    id: "parox", name: "Paroxetine", class: "ssri", halfLifeHrs: 21, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 0.1 }, efficacy: { SERT: 1.0 }
  },
  fluvox: {
    id: "fluvox", name: "Fluvoxamine", class: "ssri", halfLifeHrs: 15, cypEnzymes: ["CYP2D6", "CYP1A2"],
    receptors: { SERT: 2.2 }, efficacy: { SERT: 1.0 }
  },
  bupropion: {
    id: "bupropion", name: "Bupropion", class: "stimulant", halfLifeHrs: 20, cypEnzymes: ["CYP2B6"],
    receptors: { DAT: 2000, NET: 1400 }, efficacy: { DAT: 0.5, NET: 0.4 }
  },
  mirtaz: {
    id: "mirtaz", name: "Mirtazapine", class: "ssri", halfLifeHrs: 30, cypEnzymes: ["CYP2D6"],
    receptors: { HT2A: 30 }, efficacy: { HT2A: -0.85 }
  },
  traz: {
    id: "traz", name: "Trazodone", class: "ssri", halfLifeHrs: 7, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 35, SERT: 160 }, efficacy: { HT2A: -0.9, SERT: 0.5 }
  },

  // --- STIMULANTS & EUGEROICS ---
  amph: {
    id: "amph", name: "Amphetamine Salts", class: "stimulant", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 10, NET: 5, SERT: 1000 }, efficacy: { DAT: 1.5, NET: 1.2, SERT: 0.1 }
  },
  mph: {
    id: "mph", name: "Methylphenidate", class: "stimulant", halfLifeHrs: 3, cypEnzymes: [],
    receptors: { DAT: 20, NET: 50 }, efficacy: { DAT: 1.0, NET: 0.8 }
  },
  lisdexamph: {
    id: "lisdexamph", name: "Lisdexamfetamine", class: "stimulant", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 10, NET: 5 }, efficacy: { DAT: 1.3, NET: 1.1 }
  },
  dexmph: {
    id: "dexmph", name: "Dexmethylphenidate", class: "stimulant", halfLifeHrs: 3, cypEnzymes: [],
    receptors: { DAT: 15, NET: 40 }, efficacy: { DAT: 1.0, NET: 0.8 }
  },
  modaf: {
    id: "modaf", name: "Modafinil", class: "stimulant", halfLifeHrs: 15, cypEnzymes: ["CYP3A4"],
    receptors: { DAT: 2000 }, efficacy: { DAT: 0.4 }
  },
  armodaf: {
    id: "armodaf", name: "Armodafinil", class: "stimulant", halfLifeHrs: 15, cypEnzymes: ["CYP3A4"],
    receptors: { DAT: 1800 }, efficacy: { DAT: 0.5 }
  },
  caffeine: {
    id: "caffeine", name: "Caffeine", class: "stimulant", halfLifeHrs: 5, cypEnzymes: ["CYP1A2"],
    receptors: { NET: 2000 }, efficacy: { NET: 0.3 }
  },
  nicotine: {
    id: "nicotine", name: "Nicotine", class: "stimulant", halfLifeHrs: 2, cypEnzymes: [],
    receptors: { DAT: 500 }, efficacy: { DAT: 0.3 }
  },
  meth: {
    id: "meth", name: "Methamphetamine", class: "stimulant", halfLifeHrs: 10, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 5, NET: 3, SERT: 200 }, efficacy: { DAT: 2.0, NET: 1.5, SERT: 0.8 }
  },
  coke: {
    id: "coke", name: "Cocaine", class: "stimulant", halfLifeHrs: 1.5, cypEnzymes: ["CYP3A4"],
    receptors: { DAT: 50, NET: 100, SERT: 150 }, efficacy: { DAT: 1.8, NET: 1.2, SERT: 1.0 }
  },

  // --- ANTIPSYCHOTICS ---
  queti: {
    id: "queti", name: "Quetiapine", class: "antipsychotic", halfLifeHrs: 7, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 100 }, efficacy: { HT2A: -1.0 } // trip killer
  },
  olan: {
    id: "olan", name: "Olanzapine", class: "antipsychotic", halfLifeHrs: 33, cypEnzymes: ["CYP1A2", "CYP2D6"],
    receptors: { HT2A: 4 }, efficacy: { HT2A: -1.0 } // potent trip killer
  },
  cloz: {
    id: "cloz", name: "Clozapine", class: "antipsychotic", halfLifeHrs: 12, cypEnzymes: ["CYP1A2"],
    receptors: { HT2A: 12 }, efficacy: { HT2A: -1.0 }
  },
  risper: {
    id: "risper", name: "Risperidone", class: "antipsychotic", halfLifeHrs: 20, cypEnzymes: ["CYP2D6"],
    receptors: { HT2A: 0.5 }, efficacy: { HT2A: -1.0 }
  },
  arip: {
    id: "arip", name: "Aripiprazole", class: "antipsychotic", halfLifeHrs: 75, cypEnzymes: ["CYP2D6"],
    receptors: { HT2A: 3.4 }, efficacy: { HT2A: -0.6 }
  },
  halo: {
    id: "halo", name: "Haloperidol", class: "antipsychotic", halfLifeHrs: 24, cypEnzymes: ["CYP2D6", "CYP3A4"],
    receptors: { HT2A: 150 }, efficacy: { HT2A: -0.4 }
  },

  // --- DEPRESSANTS, BENZOS & OPIOIDS ---
  alpraz: {
    id: "alpraz", name: "Alprazolam", class: "depressant", halfLifeHrs: 11, cypEnzymes: ["CYP3A4"],
    receptors: { GABAA: 2 }, efficacy: { GABAA: 1.0 }
  },
  clonaz: {
    id: "clonaz", name: "Clonazepam", class: "depressant", halfLifeHrs: 30, cypEnzymes: ["CYP3A4"],
    receptors: { GABAA: 1.5 }, efficacy: { GABAA: 1.0 }
  },
  diaz: {
    id: "diaz", name: "Diazepam", class: "depressant", halfLifeHrs: 48, cypEnzymes: ["CYP2C19", "CYP3A4"],
    receptors: { GABAA: 5 }, efficacy: { GABAA: 1.0 }
  },
  loraz: {
    id: "loraz", name: "Lorazepam", class: "depressant", halfLifeHrs: 12, cypEnzymes: [],
    receptors: { GABAA: 2.5 }, efficacy: { GABAA: 1.0 }
  },
  zolp: {
    id: "zolp", name: "Zolpidem", class: "depressant", halfLifeHrs: 2.5, cypEnzymes: ["CYP3A4"],
    receptors: { GABAA: 10 }, efficacy: { GABAA: 1.2 }
  },
  zopic: {
    id: "zopic", name: "Zopiclone", class: "depressant", halfLifeHrs: 5, cypEnzymes: ["CYP3A4"],
    receptors: { GABAA: 15 }, efficacy: { GABAA: 1.0 }
  },
  pregab: {
    id: "pregab", name: "Pregabalin", class: "depressant", halfLifeHrs: 6, cypEnzymes: [],
    receptors: { GABAA: 100 }, efficacy: { GABAA: 0.6 }
  },
  gaba: {
    id: "gaba", name: "Gabapentin", class: "depressant", halfLifeHrs: 6, cypEnzymes: [],
    receptors: { GABAA: 200 }, efficacy: { GABAA: 0.5 }
  },
  alc: {
    id: "alc", name: "Ethanol (Alcohol)", class: "depressant", halfLifeHrs: 4, cypEnzymes: [],
    receptors: { GABAA: 50000, NMDA: 80000 }, efficacy: { GABAA: 0.8, NMDA: -0.6 }
  },
  fent: {
    id: "fent", name: "Fentanyl", class: "depressant", halfLifeHrs: 4, cypEnzymes: ["CYP3A4"],
    receptors: { MOR: 1.35 }, efficacy: { MOR: 1.5 }
  },
  oxy: {
    id: "oxy", name: "Oxycodone", class: "depressant", halfLifeHrs: 4, cypEnzymes: ["CYP2D6", "CYP3A4"],
    receptors: { MOR: 20 }, efficacy: { MOR: 1.0 }
  },
  methadone: {
    id: "methadone", name: "Methadone", class: "depressant", halfLifeHrs: 24, cypEnzymes: ["CYP2B6", "CYP3A4"],
    receptors: { MOR: 8, NMDA: 1000 }, efficacy: { MOR: 1.0, NMDA: -0.4 }
  },
  buprenorphine: {
    id: "buprenorphine", name: "Buprenorphine", class: "depressant", halfLifeHrs: 37, cypEnzymes: ["CYP3A4"],
    receptors: { MOR: 0.2 }, efficacy: { MOR: 0.4 } // partial tight agonist
  },

  // --- CORRECTIVES ---
  sr17: {
    id: "sr17", name: "SR17-018", class: "corrective", halfLifeHrs: 24, cypEnzymes: ["CYP3A4"],
    receptors: { MOR: 10 }, efficacy: { MOR: 0.6 }
  },
  nrg01: {
    id: "nrg01", name: "NRG-01 (DopaRestore)", class: "corrective", halfLifeHrs: 48, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 10 }, efficacy: { DAT: 0.5 }
  },
  clonidine: {
    id: "clonidine", name: "Clonidine", class: "corrective", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { ADRA2A: 4 }, efficacy: { ADRA2A: 1.0 }
  },
  acamprosate: {
    id: "acamprosate", name: "Acamprosate", class: "corrective", halfLifeHrs: 15, cypEnzymes: [],
    receptors: { NMDA: 1500, GABAA: 2000 }, efficacy: { NMDA: -0.5, GABAA: 0.3 }
  },
  flumazenil: {
    id: "flumazenil", name: "Flumazenil", class: "corrective", halfLifeHrs: 1, cypEnzymes: [],
    receptors: { GABAA: 2.0 }, efficacy: { GABAA: -1.0 } // reverses benzos!
  },
  nac: {
    id: "nac", name: "N-Acetylcysteine (NAC)", class: "corrective", halfLifeHrs: 5, cypEnzymes: [],
    receptors: { NMDA: 3000 }, efficacy: { NMDA: -0.2 }
  },
  agmatine: {
    id: "agmatine", name: "Agmatine Sulfate", class: "corrective", halfLifeHrs: 2, cypEnzymes: [],
    receptors: { NMDA: 1000 }, efficacy: { NMDA: -0.4 }
  },
  galantamine: {
    id: "galantamine", name: "Galantamine", class: "corrective", halfLifeHrs: 7, cypEnzymes: ["CYP2D6"],
    receptors: { DAT: 4000 }, efficacy: { DAT: 0.2 }
  },

  // --- CANNABINOIDS ---
  thc: {
    id: "thc", name: "Delta-9-THC", class: "cannabinoid", halfLifeHrs: 24, cypEnzymes: ["CYP2C9", "CYP3A4"],
    receptors: { HT2A: 1500, GABAA: 4000 }, efficacy: { HT2A: 0.1, GABAA: 0.2 }
  },
  cbd: {
    id: "cbd", name: "Cannabidiol (CBD)", class: "cannabinoid", halfLifeHrs: 18, cypEnzymes: ["CYP2C19", "CYP3A4"],
    receptors: { HT2A: 3000, GABAA: 2500 }, efficacy: { HT2A: -0.1, GABAA: 0.3 }
  },
};

// ----------------------------------------------------------------------------
// 2. PHARMACOKINETICS (PK) SOLVER
// ----------------------------------------------------------------------------
export function calculatePlasmaConcentrations(
  stack: any[],
  patient: { weightKg: number; ageYears: number; profile?: PatientProfile },
  elapsedHrs = 0
): Record<string, number> {
  const concentrations: Record<string, number> = {};

  const weightFactor = 70 / Math.max(40, patient.weightKg);
  const effectiveAge = patient.ageYears;

  // Retrieve patient CYP pgx settings
  const pgx = patient.profile?.pgx ?? {};

  for (const item of stack) {
    const id = item.id;
    const intensity = item.dose ?? item.currentIntensity ?? 0;
    if (intensity <= 0) continue;

    // Default to a medium-half life compound if not in DB
    const props = COMPOUND_DATABASE[id];
    let baseHalfLife = props?.halfLifeHrs ?? 12;
    const cypEnzymes = props?.cypEnzymes ?? [];

    // Scale half-life based on CYP Genetics (combined average clearance rate model)
    let pgxMultiplier = 1.0;
    if (cypEnzymes.length > 0) {
      let totalClearance = 0;
      for (const enzyme of cypEnzymes) {
        const cyp = enzyme.toLowerCase();
        const phen = pgx[cyp as keyof typeof pgx] ?? "NM";
        let clearanceRatio = 1.0;
        if (phen === "PM") clearanceRatio = 0.25;
        else if (phen === "IM") clearanceRatio = 0.65;
        else if (phen === "UM" || phen === "RM") clearanceRatio = 2.0;
        else if (phen === "NM") clearanceRatio = 1.0;
        totalClearance += clearanceRatio;
      }
      const avgClearance = totalClearance / cypEnzymes.length;
      pgxMultiplier = 1 / Math.max(0.1, avgClearance);
    }

    // Scale half-life based on age (clearance decays in older patients)
    const ageMultiplier = effectiveAge > 65 ? 1.3 : 1.0;
    let finalHalfLife = baseHalfLife * pgxMultiplier * ageMultiplier;

    if (id === "spur01") {
      finalHalfLife *= 1000.0; // 1000x clearance latency from rapid rotational masking
    }

    // Elimination rate constant
    const ke = Math.log(2) / finalHalfLife;

    // Initial Peak Concentration (linear dose mapping to base reference index)
    // 0..3 maps to concentration units
    const C0 = intensity * weightFactor * 10.0;

    // Concentration decay over time
    const C = C0 * Math.exp(-ke * elapsedHrs);
    concentrations[id] = C;
  }

  return concentrations;
}

// ----------------------------------------------------------------------------
// 3. PHARMACODYNAMICS (PD) SOLVER (COMPETITIVE BINDING)
// ----------------------------------------------------------------------------
export interface ReceptorActivationProfile {
  DAT: number;
  SERT: number;
  NET: number;
  HT2A: number;
  GABAA: number;
  MOR: number;
  NMDA: number;
  ADRA2A: number;
}

export interface OccupancyResult {
  occupancies: Record<string, Partial<ReceptorActivationProfile>>;
  activations: ReceptorActivationProfile;
}

export function calculateReceptorOccupancies(
  concentrations: Record<string, number>,
  patient?: { profile?: PatientProfile }
): OccupancyResult {
  const receptors: Array<keyof ReceptorProfile> = [
    "DAT", "SERT", "NET", "HT2A", "GABAA", "MOR", "NMDA", "ADRA2A"
  ];

  const occupancies: Record<string, Partial<ReceptorActivationProfile>> = {};
  const activations: ReceptorActivationProfile = {
    DAT: 0, SERT: 0, NET: 0, HT2A: 0, GABAA: 0, MOR: 0, NMDA: 0, ADRA2A: 0
  };

  // Pre-initialize occupancy maps
  for (const drugId in concentrations) {
    occupancies[drugId] = {};
  }

  // Retrieve patient CYP / pgx / demographics settings
  const pgx = (patient?.profile?.pgx ?? {}) as any;
  const demo = patient?.profile?.demographics ?? {};

  // Solve the competitive binding equation for each receptor
  for (const r of receptors) {
    // Determine dynamic genotypic Ki and efficacy modifiers for this receptor
    let rKiMultiplier = 1.0;
    let rEfficacyMultiplier = 1.0;

    if (r === "MOR") {
      // OPRM1 A118G variant makes MOR less sensitive (higher Ki, lower efficacy)
      if (pgx.oprm1 === "G" || (demo.ethnicity === "east_asian" && !pgx.oprm1)) {
        rKiMultiplier = 1.8;       // requires ~80% higher concentration to bind
        rEfficacyMultiplier = 0.6;  // reduced maximum activation capacity
      }
    } else if (r === "HT2A") {
      // HTR2A C102T variant makes 5-HT2A hyper-responsive (lower Ki, higher efficacy)
      if (pgx.htr2a === "hyper" || (demo.ethnicity === "european" && !pgx.htr2a)) {
        rKiMultiplier = 0.7;       // binds at lower concentrations (higher affinity)
        rEfficacyMultiplier = 1.3;  // higher baseline maximum activation
      }
    }

    // 1. Calculate sum(C_j / K_j) with genotypic K_j adjustment
    let competitiveSum = 0;
    for (const drugId in concentrations) {
      const props = COMPOUND_DATABASE[drugId];
      if (props && props.receptors && props.receptors[r] !== undefined) {
        const C = concentrations[drugId];
        const Ki = props.receptors[r]! * rKiMultiplier;
        competitiveSum += C / Ki;
      }
    }

    // 2. Solve fractional occupancy for each drug at this receptor
    let netActivation = 0;
    for (const drugId in concentrations) {
      const props = COMPOUND_DATABASE[drugId];
      if (props && props.receptors && props.receptors[r] !== undefined) {
        const C = concentrations[drugId];
        const Ki = props.receptors[r]! * rKiMultiplier;
        const eps = (props.efficacy[r] ?? 1.0) * rEfficacyMultiplier;

        // Fractional occupancy: (C/Ki) / (1 + sum(C_j/K_j))
        const occ = (C / Ki) / (1 + competitiveSum);
        occupancies[drugId][r] = occ;

        // Activation contributor: occupancy * intrinsic efficacy
        netActivation += occ * eps;
      }
    }

    activations[r] = netActivation;
  }

  return { occupancies, activations };
}

// ----------------------------------------------------------------------------
// 4. RECEPTOR TO VECTOR TRANSLATION
// ----------------------------------------------------------------------------
export function translateReceptorsToVectors(
  activations: ReceptorActivationProfile,
  stack: any[] = []
): PharmaVectors {
  // Extract direct lifestyle / neuromodulation / procedural multipliers
  let baseArousal = 0;
  let baseDampening = 0;
  let baseChaos = 0;
  let baseRepair = 0;

  for (const item of stack) {
    const id = item.id;
    const intensity = item.dose ?? item.currentIntensity ?? 0;
    if (intensity <= 0) continue;

    // Procedurals, lifestyles, and non-receptor novels add direct vector contributions
    // E.g. donepezil, cbt, sleep, hbot, coldplunge, tms, dbs, vns, ect, tcca
    const props = COMPOUND_DATABASE[id];
    const isReceptorActive = props && props.receptors && Object.keys(props.receptors).length > 0;

    if (!isReceptorActive || id === "spur01") {
      // Find the template molecule in shared list to extract direct effects
      // We will match these by direct effects
      const doseRatio = Math.min(1.0, intensity / 3.0);
      if (id === "spur01") {
        baseRepair += 3.5 * doseRatio;
        baseChaos -= 1.8 * doseRatio;
        baseDampening += 0.5 * doseRatio;
        baseArousal -= 0.2 * doseRatio;
      } else if (!props && item.effects) {
        baseArousal += (item.effects.arousal ?? 0) * doseRatio;
        baseDampening += (item.effects.dampening ?? 0) * doseRatio;
        baseChaos += (item.effects.chaos ?? 0) * doseRatio;
        baseRepair += (item.effects.repair ?? 0) * doseRatio;
      } else if (id === "cbt") {
        baseRepair += 1.2 * doseRatio;
        baseChaos -= 0.9 * doseRatio;
      } else if (id === "sleep") {
        baseRepair += 1.8 * doseRatio;
        baseDampening += 0.4 * doseRatio;
        baseChaos -= 1.0 * doseRatio;
      } else if (id === "hbot") {
        baseRepair += 1.6 * doseRatio;
        baseChaos -= 0.5 * doseRatio;
      } else if (id === "coldplunge") {
        baseArousal += 0.8 * doseRatio;
        baseRepair += 0.9 * doseRatio;
        baseDampening -= 0.2 * doseRatio;
      } else if (id === "meditation") {
        baseDampening += 0.5 * doseRatio;
        baseChaos -= 0.6 * doseRatio;
        baseRepair += 0.7 * doseRatio;
      } else if (id === "lionmane") {
        baseRepair += 1.4 * doseRatio;
      } else if (id === "tms") {
        baseArousal += 0.8 * doseRatio;
        baseRepair += 1.5 * doseRatio;
        baseChaos -= 0.5 * doseRatio;
      } else if (id === "dbs") {
        baseArousal += 1.0 * doseRatio;
        baseDampening += 1.2 * doseRatio;
        baseChaos -= 1.0 * doseRatio;
      } else if (id === "vns") {
        baseDampening += 0.6 * doseRatio;
        baseRepair += 0.8 * doseRatio;
        baseChaos -= 0.8 * doseRatio;
      } else if (id === "ect") {
        baseDampening += 1.5 * doseRatio;
        baseChaos += 1.0 * doseRatio;
        baseRepair += 2.0 * doseRatio;
      } else if (id === "tcca") {
        baseDampening += 1.5 * doseRatio;
        baseChaos -= 2.0 * doseRatio;
        baseArousal -= 1.5 * doseRatio;
      } else if (id === "donepezil") {
        baseArousal += 0.4 * doseRatio;
        baseRepair += 0.2 * doseRatio;
      }
    }
  }

  // 1. Arousal: driven by DAT and NET reuptake/release
  // Agonism at ADRA2A (Clonidine) lowers peripheral adrenergic tone, reducing arousal.
  const arousal =
    baseArousal +
    1.4 * activations.DAT +
    0.8 * activations.NET -
    0.8 * Math.max(0, activations.ADRA2A);

  // 2. Dampening: driven by GABA-A and Mu-Opioid activation, and ADRA2A (clonidine down-regulates locus coeruleus)
  const dampening =
    baseDampening +
    1.6 * activations.GABAA +
    1.5 * activations.MOR +
    0.6 * Math.max(0, activations.ADRA2A);

  // 3. Chaos: driven by HT2A activation (psychedelics) and NMDA block (dissociatives)
  // Widespread GABA-A activation (sedatives/benzos) down-regulates cortical chaos, hence the dampening penalty
  const rawHT2A = Math.max(0, activations.HT2A);
  const cleanHT2A = rawHT2A * Math.max(0.1, 1.0 - 0.75 * activations.GABAA);
  const chaos =
    baseChaos +
    2.2 * cleanHT2A +
    1.8 * Math.max(0, -activations.NMDA) - // NMDA blockers are expressed as negative net activation
    0.3 * activations.DAT;

  // 4. Repair: driven by high structural repair agonists (like biased MOR or BDNF facilitators) and moderate HT2A activation
  const repair =
    baseRepair +
    0.8 * activations.MOR * (1 - Math.min(0.5, activations.GABAA)) + // opioid induced neurogenesis, slightly dampened by high sedatives
    0.45 * Math.max(0, activations.HT2A) +
    0.5 * Math.max(0, activations.ADRA2A); // alpha-2-agonists protect connectome integrity

  return {
    arousal: +arousal.toFixed(2),
    dampening: +dampening.toFixed(2),
    chaos: +chaos.toFixed(2),
    repair: +repair.toFixed(2),
  };
}

// ----------------------------------------------------------------------------
// 5. MASTER INTEGRATOR ENTRY POINT
// ----------------------------------------------------------------------------
export function computePharmaChemVectors(
  stack: any[],
  patient: { weightKg: number; ageYears: number; profile?: PatientProfile },
  elapsedHrs = 0
): { vectors: PharmaVectors; occupancies: OccupancyResult } {
  const concentrations = calculatePlasmaConcentrations(stack, patient, elapsedHrs);
  const occupancies = calculateReceptorOccupancies(concentrations, patient);
  const vectors = translateReceptorsToVectors(occupancies.activations, stack);

  return { vectors, occupancies };
}
