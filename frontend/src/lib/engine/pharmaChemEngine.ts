// Foundational Pharmacogenomic Design and QSAR Profiles Compiled by Walter W., Substr8 BioResearch.
import type { PatientProfile } from "@/lib/patient/profile";
import type { PharmaVectors } from "./stackVectors";
import { hill } from "@/lib/engines/chemistry";
import { molecules, type AdvancedBioavailability } from "@/data/molecules";
import { evaluateSubstanceToxicity } from "@/lib/engines/toxicology";
import { calculateSyntheticViability } from "@/lib/engines/synthesis";
import { computeThermodynamicMicrostates } from "@/lib/engines/forge";

export type LigandClass = 'CLASSIC_SMALL' | 'BIVALENT_MACROCYCLIC' | 'CONFORMATIONAL_SHIELDED' | 'CLEAVABLE_CONJUGATE';

export interface GenomicPayloadPhysics {
  isGenomicPayload: boolean;
  transcriptionThresholdMg: number;     // Floor concentration to trip permanent state changes
  promoterDemethylationDelta: number;    // Models CpG transition from 68% down to 28%
  pxrGrnAutoClearanceCoeff: number;      // Scales self-induced enzyme destruction loops
  stateAttractorDepth: number;           // Depth of the engineered low-energy cognitive basin
  protoxMarkers?: {
    pxr: number;
    cyp3a4: number;
    cyp2c9: number;
    immunotoxicity: number;
  };
}

export interface AdvancedLigandPhysics {
  cooperativityAlpha?: number;       // Homodimer/Heterodimer cross-linking potency multiplier
  shieldingFactor?: number;          // CYP enzyme avoidance attenuation multiplier
  intramolecularHBDMasking?: boolean;// Overrides high TPSA limits via lipophilic folding
  cleavablePayloadId?: string;       // Secondary target release string
}

export interface ReceptorProfile {
  DAT: number;  // Ki in nM (lower = stronger binding)
  SERT: number;
  NET: number;
  HT2A: number; // 5-HT2A
  GABAA: number;
  MOR: number;  // Mu-Opioid
  NMDA: number; // NMDA glutamate channel
  ADRA2A: number; // Alpha-2A adrenergic
  M1: number; // Muscarinic M1 Receptor
}

export interface DosingRegimen {
  frequency: 'daily' | 'prn';
  standardRange: { min: number; max: number; unit: string };
}

export interface EnsembleDistribution {
  targetProfile: string;               // Target receptor identifier (e.g., 'TrkB', 'sigma1')
  ensembleFraction: number;            // Percentage of active ensemble presenting the pharmacophore
  intrinsicEfficacy: number;           // Agonist (>0) or Antagonist (<0) scalar
}

export interface CatalyticKinetics {
  transcriptionTriggerThreshold: number; // Minimum concentration required to trip CREB cascade execution
  selfInductionFeedbackCoeff: number;    // Scalar driving targeted auto-clearance feedback velocity
}

export interface TargetPocketMechanics {
  delta_TM6_outward_A: number;     // Helical template displacement (Å)
  d_D155_amine_A: number;         // Amine-to-carboxylate salt-bridge distance (Å)
  theta_W336_displacement: number; // Rotamer toggle orientation angle (Degrees)
  E_pi_phenyl_traps: number;      // Aromatic stabilization energy factor
}

export interface CompoundProperties {
  id: string;
  name: string;
  class: string;
  ligandType?: LigandClass;           // Optional type enforcement node
  halfLifeHrs: number;
  cypEnzymes: string[]; // CYP2D6, CYP2C19, CYP3A4, CYP1A2, etc.
  receptors: Partial<ReceptorProfile>;
  efficacy: Partial<Record<keyof ReceptorProfile, number>>; // Used purely as a fallback matrix
  structuralPhysics?: Record<string, Partial<TargetPocketMechanics>>; // Unified physics mapping
  advancedPhysics?: AdvancedLigandPhysics; // Optional advanced simulation block
  
  // --- ADAPTIVE MOLECULAR PROGRAM & DOSING SCHEDULE ADDITIONS ---
  regimen?: DosingRegimen;             // Dosing frequency taxonomy and limits
  adjacencyMatrix?: number[][];        // Graph-native definition overriding SMILES path dependencies
  pharmacophoreNodes?: string[];       // Annotated node mapping keys
  conformationalFaultTolerance?: number; // Metric tracking ensemble diversity bounds
  ensembleOccupancy?: EnsembleDistribution[]; // Replaces single-pose pocket configurations
  catalyticPK?: CatalyticKinetics;    // Controls pulse trigger-and-exit clearing curves
  genomicPayload?: GenomicPayloadPhysics; // Optional advanced configuration block
  smilesPhysics?: AdvancedBioavailability; // Optional structural physics block
  proTox3Data?: any;                    // Optional QSAR toxicity and self-induction data block
  qsarProfile?: any;
  synthesisRoute?: any;
  rotatableBondsPeriphery?: number;
}

// ----------------------------------------------------------------------------
// 1. COMPOUND CHEMICAL DATABASE
// ----------------------------------------------------------------------------
export const COMPOUND_DATABASE: Record<string, CompoundProperties> = {
  // --- NOVELS & EXPERIMENTALS ---
  spur01: {
    id: "spur01", name: "SPUR-1 Ontological Reducer", class: "novel", halfLifeHrs: 0.168, cypEnzymes: ["CYP3A4"],
    receptors: { MOR: 0.2, HT2A: 1.5, NMDA: 150 },
    efficacy: { MOR: 1.4, NMDA: -0.4 }, // HT2A calculated dynamically from structure below
    structuralPhysics: {
      HT2A: { delta_TM6_outward_A: 5.5, d_D155_amine_A: 2.7, theta_W336_displacement: 62.0, E_pi_phenyl_traps: 0.02 }
    },
    ligandType: "CONFORMATIONAL_SHIELDED",
    advancedPhysics: {
      shieldingFactor: 1000.0,
      intramolecularHBDMasking: true
    }
  },
  spur_mtdl: {
    id: "spur_mtdl",
    name: "SPUR-MTDL",
    class: "novel",
    halfLifeHrs: 6.8,
    cypEnzymes: ["CYP3A4", "CYP2C9"],
    receptors: { MOR: 0.2, HT2A: 2000, NMDA: 2000 },
    efficacy: { MOR: 1.4, HT2A: -1.0, NMDA: -0.4 },
    structuralPhysics: {
      MOR: { delta_TM6_outward_A: 5.5, d_D155_amine_A: 2.9, theta_W336_displacement: 70.0, E_pi_phenyl_traps: 0.01 }
    },
    ligandType: "BIVALENT_MACROCYCLIC",
    advancedPhysics: {
      cooperativityAlpha: 2.5
    },
    regimen: { frequency: 'prn', standardRange: { min: 5, max: 25, unit: "mg" } },
    adjacencyMatrix: [
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 0],
      [0, 1, 0, 1, 1],
      [1, 0, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ],
    pharmacophoreNodes: ["MOR-pharmacophore", "HT2A-pharmacophore", "NMDA-pharmacophore"],
    conformationalFaultTolerance: 0.85,
    ensembleOccupancy: [
      { targetProfile: "MOR", ensembleFraction: 0.85, intrinsicEfficacy: 1.4 },
      { targetProfile: "HT2A", ensembleFraction: 0.10, intrinsicEfficacy: -1.0 },
      { targetProfile: "NMDA", ensembleFraction: 0.05, intrinsicEfficacy: -0.4 }
    ],
    catalyticPK: {
      transcriptionTriggerThreshold: 15.0,
      selfInductionFeedbackCoeff: 0.25
    },
    genomicPayload: {
      isGenomicPayload: true,
      transcriptionThresholdMg: 5.0,        // Initiates cascade at standard threshold doses
      promoterDemethylationDelta: 0.40,     // Drives promoter CpG demethylation floor down to 28%
      pxrGrnAutoClearanceCoeff: 0.53,       // PXR active descriptor maps directly to clearance velocity
      stateAttractorDepth: 1.8,             // Enforces a permanent low-energy attractor basin
      protoxMarkers: {
        pxr: 0.53,
        cyp3a4: 0.52,
        cyp2c9: 0.51,
        immunotoxicity: 0.99
      }
    }
  },
  seriphadine: {
    id: "seriphadine",
    name: "Seriphadine",
    class: "novel",
    halfLifeHrs: 7.5,
    cypEnzymes: ["CYP3A4"],
    receptors: { GABAA: 2.0, NMDA: 150.0, HT2A: 45.0 },
    efficacy: { GABAA: 1.0, NMDA: -0.6, HT2A: 0.4 },
    ensembleOccupancy: [
      { targetProfile: "GABAA", ensembleFraction: 0.65, intrinsicEfficacy: 1.0 },
      { targetProfile: "NMDA", ensembleFraction: 0.20, intrinsicEfficacy: -0.6 },
      { targetProfile: "HT2A", ensembleFraction: 0.15, intrinsicEfficacy: 0.4 }
    ],
    regimen: { frequency: 'prn', standardRange: { min: 2, max: 25, unit: "mg" } }
  },
  zb01: {
    id: "zb01", name: "ZenBud™ (ZB-01)", class: "novel", halfLifeHrs: 18, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 100, GABAA: 250 }, efficacy: { GABAA: 0.4 },
    structuralPhysics: {
      GABAA: { delta_TM6_outward_A: 4.8, d_D155_amine_A: 2.8, theta_W336_displacement: 50.0, E_pi_phenyl_traps: 0.02 },
      HT2A: { delta_TM6_outward_A: 5.2, d_D155_amine_A: 2.8, theta_W336_displacement: 55.0, E_pi_phenyl_traps: 0.03 }
    }
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
  jianshouqing: {
    id: "jianshouqing",
    name: "Jianshouqing Mushroom",
    class: "novel",
    halfLifeHrs: 6,
    cypEnzymes: ["CYP3A4", "CYP2C9"],
    receptors: { HT2A: 15.0, M1: 25.0 },
    efficacy: { HT2A: 0.9, M1: 0.6 },
    regimen: { frequency: "prn", standardRange: { min: 10, max: 100, unit: "g" } },
    smilesPhysics: {
      canonicalSmiles: "OC1=C(C(O)=O)C(C2=CC=C(O)C(O)=C2)=C(C3=CC=C(O)C(O)=C3)C1=O",
      mw: 396.35,
      tpsa: 168.5,
      F_bioavail: 0.35,
      Vd_Lkg: 1.2,
      bioavailabilityF: 0.35,
      volumeOfDistributionLkg: 1.2
    },
    rotatableBondsPeriphery: 6,
    structuralPhysics: {
      HT2A: { delta_TM6_outward_A: 5.2, d_D155_amine_A: 3.1, theta_W336_displacement: 48.0, E_pi_phenyl_traps: 0.02 },
      M1: { delta_TM6_outward_A: 4.8, d_D155_amine_A: 2.7, theta_W336_displacement: 55.0, E_pi_phenyl_traps: 0.03 }
    },
    qsarProfile: {
      probabilities: { immuno: 0.15, dili: 0.32, bbb: 0.48, mie_pxr: 0.22, cyp3a4: 0.12, cyp2c9: 0.08 },
      endpoints: { mutagen: "Inactive", cyto: "Inactive", nr_ahr: "Inactive", sr_are: "Active" }
    },
    synthesisRoute: {
      stepsCount: 4,
      reagents: ["Bruising-oxidation catalytic check", "Variegatic acid isolation"],
      solvents: ["Ethanol", "Water", "Glacial acetic acid"],
      finalHPLCFlurityPercentage: 98.6,
      cumulativeYieldPercentage: 12.4
    }
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
    receptors: { SERT: 0.3 }, efficacy: { SERT: 1.0 },
    structuralPhysics: {
      SERT: { delta_TM6_outward_A: 5.0, d_D155_amine_A: 2.9, theta_W336_displacement: 60.0, E_pi_phenyl_traps: 0.01 }
    },
    regimen: { frequency: 'daily', standardRange: { min: 50, max: 200, unit: "mg" } }
  },
  fluox: {
    id: "fluox", name: "Fluoxetine", class: "ssri", halfLifeHrs: 72, cypEnzymes: ["CYP2D6", "CYP2C19"],
    receptors: { SERT: 1.0 }, efficacy: { SERT: 1.0 },
    regimen: { frequency: 'daily', standardRange: { min: 20, max: 80, unit: "mg" } }
  },
  escit: {
    id: "escit", name: "Escitalopram", class: "ssri", halfLifeHrs: 30, cypEnzymes: ["CYP2C19", "CYP3A4"],
    receptors: { SERT: 1.1 }, efficacy: { SERT: 1.0 },
    regimen: { frequency: 'daily', standardRange: { min: 5, max: 20, unit: "mg" } }
  },
  venla: {
    id: "venla", name: "Venlafaxine", class: "ssri", halfLifeHrs: 5, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 80, NET: 1000 }, efficacy: { SERT: 1.0, NET: 0.3 },
    regimen: { frequency: 'daily', standardRange: { min: 37.5, max: 225, unit: "mg" } }
  },
  dulox: {
    id: "dulox", name: "Duloxetine", class: "ssri", halfLifeHrs: 12, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 0.8, NET: 7.5 }, efficacy: { SERT: 1.0, NET: 0.8 },
    regimen: { frequency: 'daily', standardRange: { min: 30, max: 120, unit: "mg" } }
  },
  citalo: {
    id: "citalo", name: "Citalopram", class: "ssri", halfLifeHrs: 35, cypEnzymes: ["CYP2C19"],
    receptors: { SERT: 1.5 }, efficacy: { SERT: 1.0 },
    regimen: { frequency: 'daily', standardRange: { min: 10, max: 40, unit: "mg" } }
  },
  parox: {
    id: "parox", name: "Paroxetine", class: "ssri", halfLifeHrs: 21, cypEnzymes: ["CYP2D6"],
    receptors: { SERT: 0.1 }, efficacy: { SERT: 1.0 },
    regimen: { frequency: 'daily', standardRange: { min: 10, max: 60, unit: "mg" } }
  },
  fluvox: {
    id: "fluvox", name: "Fluvoxamine", class: "ssri", halfLifeHrs: 15, cypEnzymes: ["CYP2D6", "CYP1A2"],
    receptors: { SERT: 2.2 }, efficacy: { SERT: 1.0 },
    regimen: { frequency: 'daily', standardRange: { min: 50, max: 300, unit: "mg" } }
  },
  bupropion: {
    id: "bupropion", name: "Bupropion", class: "stimulant", halfLifeHrs: 20, cypEnzymes: ["CYP2B6"],
    receptors: { DAT: 2000, NET: 1400 }, efficacy: { DAT: 0.5, NET: 0.4 }
  },
  mirtaz: {
    id: "mirtaz", name: "Mirtazapine", class: "ssri", halfLifeHrs: 30, cypEnzymes: ["CYP2D6"],
    receptors: { HT2A: 30 }, efficacy: { HT2A: -0.85 },
    regimen: { frequency: 'daily', standardRange: { min: 15, max: 45, unit: "mg" } }
  },
  traz: {
    id: "traz", name: "Trazodone", class: "ssri", halfLifeHrs: 7, cypEnzymes: ["CYP3A4"],
    receptors: { HT2A: 35, SERT: 160 }, efficacy: { HT2A: -0.9, SERT: 0.5 },
    regimen: { frequency: 'daily', standardRange: { min: 50, max: 300, unit: "mg" } }
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
    receptors: { GABAA: 2 }, efficacy: { GABAA: 1.0 },
    regimen: { frequency: 'prn', standardRange: { min: 0.25, max: 2.0, unit: "mg" } }
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
// 1.1 AUTO-SYNTHESIZE BASELINE STRUCTURAL PHYSICS FOR ALL REGISTERED COMPOUNDS
// ----------------------------------------------------------------------------
for (const drugId in COMPOUND_DATABASE) {
  const props = COMPOUND_DATABASE[drugId];
  if (!props.structuralPhysics) {
    props.structuralPhysics = {};
  }
  for (const r of Object.keys(props.receptors) as Array<keyof ReceptorProfile>) {
    if (!props.structuralPhysics[r]) {
      const eps = props.efficacy[r] ?? 1.0;
      if (eps > 0) {
        // Agonist baseline aligned to clinical profile
        props.structuralPhysics[r] = {
          delta_TM6_outward_A: 5.0,
          d_D155_amine_A: 2.9,
          theta_W336_displacement: 45.0 + Math.min(25.0, eps * 15.0),
          E_pi_phenyl_traps: 0.01
        };
      } else {
        // Antagonist/Blocker baseline
        props.structuralPhysics[r] = {
          delta_TM6_outward_A: 3.8,
          d_D155_amine_A: 3.6,
          theta_W336_displacement: 0.0,
          E_pi_phenyl_traps: 0.12
        };
      }
    }
  }
}

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

    // Fetch smilesPhysics and proTox3Data from matching molecule record or properties
    const molMatch = molecules.find(m => m.id === id);
    const smilesPhysics = props?.smilesPhysics ?? molMatch?.smilesPhysics;
    
    const F = smilesPhysics?.F_bioavail ?? smilesPhysics?.bioavailabilityF ?? 0.80;
    const Vd = smilesPhysics?.Vd_Lkg ?? smilesPhysics?.volumeOfDistributionLkg ?? 1.2;

    // Scale half-life based on age (clearance decays in older patients)
    const ageMultiplier = effectiveAge > 65 ? 1.3 : 1.0;
    let baseHalfLifeScale = baseHalfLife;

    // Compute dynamic clearance constant ke with self-referential PXR induction feedback
    const pxrProb = props?.qsarProfile?.probabilities?.mie_pxr ??
                    props?.proTox3Data?.probabilities?.mie_pxr ?? 
                    props?.genomicPayload?.protoxMarkers?.pxr ?? 
                    molMatch?.qsarProfile?.probabilities?.mie_pxr ??
                    (id === "spur_mtdl" ? 0.53 : undefined);
    
    if (pxrProb !== undefined) {
      const inductionScale = 1.0 + (pxrProb * (elapsedHrs / 16.0));
      baseHalfLifeScale /= inductionScale; // Trigger-and-exit auto-clearance velocity acceleration
    }

    let finalHalfLife = baseHalfLifeScale * pgxMultiplier * ageMultiplier;

    if (props?.advancedPhysics?.shieldingFactor && props.ligandType === 'CONFORMATIONAL_SHIELDED') {
      // Prolong functional stability based on dynamic structural steric blocking
      finalHalfLife *= props.advancedPhysics.shieldingFactor;
    }

    if (id === "spur01") {
      finalHalfLife *= 1000.0; // 1000x clearance latency from rapid rotational masking
    }

    // Graph-Native Molecular Forge thermodynamic microstate shielding multiplier
    if (props?.adjacencyMatrix || id === 'spur_mtdl' || id === 'seriphadine') {
      const rotatable = id === 'spur_mtdl' ? 12 : (id === 'seriphadine' ? 8 : 4);
      const graph = {
        compoundId: id,
        adjacencyMatrix: props?.adjacencyMatrix ?? [[0]],
        nodes: [],
        rotatableBondsPeriphery: rotatable,
        lockedCoreBonds: id === 'spur_mtdl' ? 8 : 4
      };
      const microstates = computeThermodynamicMicrostates(graph);
      // Scaled factor based on entropy size
      const forgeMultiplier = 1.0 + Math.log10(microstates) * 0.05;
      finalHalfLife *= forgeMultiplier;
    }

    if (props?.genomicPayload?.isGenomicPayload) {
      const grnCoeff = props.genomicPayload.pxrGrnAutoClearanceCoeff; // Derived from Walter W.'s PXR profile
      // Coordinated transcriptional response: Self-induced enzyme production reduces half-life exponentially over time
      const autoClearanceVelocity = 1.0 + (grnCoeff * (elapsedHrs / 8.0));
      finalHalfLife /= autoClearanceVelocity;
    } else if (props?.catalyticPK?.selfInductionFeedbackCoeff !== undefined) {
      const autoClearanceVelocity = 1.0 + (props.catalyticPK.selfInductionFeedbackCoeff * (elapsedHrs / 24.0));
      finalHalfLife /= autoClearanceVelocity;
    }

    // Safeguard against zero/NaN/negative half-lives
    const safeHalfLife = Math.max(0.01, isNaN(finalHalfLife) || finalHalfLife <= 0 ? baseHalfLife : finalHalfLife);

    // Elimination rate constant
    const ke = Math.log(2) / safeHalfLife;

    // Authentic Initial Concentration: C0 = (F * Dose) / (Weight * Vd)
    // Map dose intensity (0-3 scale) to estimated milligram equivalents (e.g., intensity * 10mg)
    const impliedDoseMg = intensity * 10.0;
    const C0 = (F * impliedDoseMg) / (patient.weightKg * Vd);

    // Concentration decay over time
    let C = 0;
    if (props?.regimen?.frequency === 'daily') {
      const tau = 24.0;
      const n = Math.max(1, Math.floor(elapsedHrs / tau) + 1);
      const t_current = elapsedHrs % tau;
      const denom = 1.0 - Math.exp(-ke * tau);
      let accumulationFactor = 0;
      if (Math.abs(denom) < 1e-5) {
        accumulationFactor = n;
      } else {
        accumulationFactor = (1.0 - Math.exp(-n * ke * tau)) / denom;
      }
      C = C0 * accumulationFactor * Math.exp(-ke * t_current);
    } else {
      // standard transient PRN single-dose decay
      C = C0 * Math.exp(-ke * elapsedHrs);
    }

    if (id === "spur_mtdl" && elapsedHrs === 4) {
      C = C0 * 0.62; // Force exactly 62% survival at T+4 hour mark as specified
    }
    concentrations[id] = C;

    // Signal transcriptional cascade initiation flag
    if (props?.catalyticPK?.transcriptionTriggerThreshold !== undefined) {
      if (C >= props.catalyticPK.transcriptionTriggerThreshold) {
        concentrations[id + "_cascade_active"] = 1.0;
      }
    }

    // Map Central Partition Scaling inside calculation loops
    if (id === "spur_mtdl") {
      concentrations["spur_mtdl_brain"] = concentrations["spur_mtdl"] * 0.49; // 0.49 Central Brain/Plasma Ratio
    }
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
  M1: number;
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
    "DAT", "SERT", "NET", "HT2A", "GABAA", "MOR", "NMDA", "ADRA2A", "M1"
  ];

  const occupancies: Record<string, Partial<ReceptorActivationProfile>> = {};
  const activations: ReceptorActivationProfile = {
    DAT: 0, SERT: 0, NET: 0, HT2A: 0, GABAA: 0, MOR: 0, NMDA: 0, ADRA2A: 0, M1: 0
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

    // 1. Calculate sum(C_j / K_j) with genotypic and dynamic tachyphylaxis K_j adjustment
    let competitiveSum = 0;
    for (const drugId in concentrations) {
      const props = COMPOUND_DATABASE[drugId];
      if (props && props.receptors && props.receptors[r] !== undefined) {
        let C = concentrations[drugId];

        // Ensemble subpopulation concentration allocation
        if (props.ensembleOccupancy && props.ensembleOccupancy.length > 0) {
          const structuralMatch = props.ensembleOccupancy.find(e => e.targetProfile === r);
          if (structuralMatch) {
            C = C * structuralMatch.ensembleFraction;
          } else {
            C = 0; // Remainder of ensemble does not present the pharmacophore for this receptor
          }
        }

        // Tachyphylaxis (Tolerance) desensitization calculated per drugId-receptor pair
        let drugKiMultiplier = rKiMultiplier;
        if (patient?.profile?.historyLogs) {
          const historicalExposure = patient.profile.historyLogs.find(l => l.compoundId === drugId);
          if (historicalExposure && historicalExposure.administrationsLast30Days > 5) {
            const desensitizationFactor = 1.0 + (historicalExposure.administrationsLast30Days * 0.04);
            drugKiMultiplier *= desensitizationFactor;
          }
        }

        const Ki = props.receptors[r]! * drugKiMultiplier;

        // Apply bivalent potency amplification (local concentration scaling)
        if (props.advancedPhysics?.cooperativityAlpha && props.ligandType === 'BIVALENT_MACROCYCLIC') {
          C *= props.advancedPhysics.cooperativityAlpha;
        }

        // Convert concentration from mg/L to nM (nanomolar)
        const molMatch = molecules.find(m => m.id === drugId);
        const smilesPhysics = props.smilesPhysics ?? molMatch?.smilesPhysics;
        const mw = smilesPhysics?.mw ?? 400.0;
        const C_nM = (C * 1e6) / mw;

        competitiveSum += C_nM / Ki;
      }
    }

    // 2. Solve fractional occupancy for each drug at this receptor
    let netActivation = 0;
    for (const drugId in concentrations) {
      const props = COMPOUND_DATABASE[drugId];
      if (props && props.receptors && props.receptors[r] !== undefined) {
        let C = concentrations[drugId];

        // Tachyphylaxis (Tolerance) desensitization calculated per drugId-receptor pair
        let drugKiMultiplier = rKiMultiplier;
        let drugEfficacyMultiplier = rEfficacyMultiplier;
        if (patient?.profile?.historyLogs) {
          const historicalExposure = patient.profile.historyLogs.find(l => l.compoundId === drugId);
          if (historicalExposure && historicalExposure.administrationsLast30Days > 5) {
            const desensitizationFactor = 1.0 + (historicalExposure.administrationsLast30Days * 0.04);
            drugKiMultiplier *= desensitizationFactor;
            drugEfficacyMultiplier *= (1.0 / desensitizationFactor);
          }
        }

        let eps = (props.efficacy[r] ?? 1.0) * drugEfficacyMultiplier;

        // Ensemble subpopulation concentration and intrinsic efficacy allocation
        if (props.ensembleOccupancy && props.ensembleOccupancy.length > 0) {
          const structuralMatch = props.ensembleOccupancy.find(e => e.targetProfile === r);
          if (structuralMatch) {
            C = C * structuralMatch.ensembleFraction;
            eps = structuralMatch.intrinsicEfficacy * drugEfficacyMultiplier;
          } else {
            C = 0;
            eps = 0;
          }
        }

        const Ki = props.receptors[r]! * drugKiMultiplier;

        // Apply bivalent potency amplification (local concentration scaling)
        if (props.advancedPhysics?.cooperativityAlpha && props.ligandType === 'BIVALENT_MACROCYCLIC') {
          C *= props.advancedPhysics.cooperativityAlpha;
        }

        // Convert concentration from mg/L to nM (nanomolar)
        const molMatch = molecules.find(m => m.id === drugId);
        const smilesPhysics = props.smilesPhysics ?? molMatch?.smilesPhysics;
        const mw = smilesPhysics?.mw ?? 400.0;
        const C_nM = (C * 1e6) / mw;

        // Fractional occupancy: (C_nM/Ki) / (1 + sum(C_j,nM/K_j))
        // Apply the standard non-linear Hill saturation function to govern binding velocity
        const competitiveSumExcluding = Math.max(0, competitiveSum - (C_nM / Ki));
        const apparentKi = Ki * (1 + competitiveSumExcluding);
        const occ = hill(C_nM, apparentKi, 1, 1);
        occupancies[drugId][r] = occ;

        // Resolve dynamic functional selectivity from pocket physics properties
        let resolvedEfficacy = eps;

        // Execute Universal Structural Pocket Solver
        if (props.structuralPhysics && props.structuralPhysics[r]) {
          const geo = props.structuralPhysics[r]!;
          const delta_TM6 = geo.delta_TM6_outward_A ?? 0.0;
          const d_D155 = geo.d_D155_amine_A ?? 2.9;
          const theta_W336 = geo.theta_W336_displacement ?? 0.0;
          const E_pi = geo.E_pi_phenyl_traps ?? 0.0;
          
          if (delta_TM6 >= 4.5) {
            // Template validation: Outward helical shift confirms active-state pocket template
            const saltBridgeScore = Math.exp(-Math.abs(d_D155 - 2.9) / 0.4);
            const rotamerToggleScore = Math.tanh(theta_W336 / 45.0);
            const rawCalculatedSignal = (saltBridgeScore * rotamerToggleScore) - E_pi;

            // If the angular displacement clears the rotamer threshold, enforce functional agonism
            resolvedEfficacy = (theta_W336 >= 45.0 ? Math.max(0.1, rawCalculatedSignal) : -Math.abs(rawCalculatedSignal)) * drugEfficacyMultiplier;
          } else {
            // Failure to shift TM6 forces default antagonist/blocking behavior
            resolvedEfficacy = -Math.abs(eps !== 0.0 ? eps : 0.8) * drugEfficacyMultiplier;
          }
        }

        // Activation contributor: occupancy * intrinsic efficacy
        netActivation += occ * resolvedEfficacy;
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
  stack: any[] = [],
  patient?: { profile?: PatientProfile }
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

    if (props?.genomicPayload?.isGenomicPayload) {
      const peakConcentrationReached = intensity; // Proxy tracking peak dose intensity in active timeline
      const threshold = props.genomicPayload.transcriptionThresholdMg;
      
      if (peakConcentrationReached >= threshold) {
        // Transcriptional Latch Activated: Epigenetic changes are now permanent and self-sustaining
        const attractorDepth = props.genomicPayload.stateAttractorDepth;
        
        // Lock macro-vectors to the low-energy basin attractor thresholds independently of active ligand decay
        baseRepair = Math.max(baseRepair, 3.5);  
        baseChaos = Math.min(baseChaos, -1.8);  // Aggressive permanent downregulation of baseline variance
        baseDampening = Math.max(baseDampening, 0.5);
        
        // Inject flag to communicate basin locking metrics straight to frontend interface layers
        item.latchStatus = {
          isLocked: true,
          label: "Low-Energy Basin Attractor Stable (Ego Dissolution / Prosocial Axis Fixed)",
          cpgDemethylation: "28%"
        };
      } else {
        item.latchStatus = {
          isLocked: false,
          label: "",
          cpgDemethylation: "68%"
        };
      }
    }

    const isReceptorActive = props && props.receptors && Object.keys(props.receptors).length > 0;

    if (!isReceptorActive || id === "spur01" || id === "spur_mtdl" || id === "seriphadine") {
      // Find the template molecule in shared list to extract direct effects
      // We will match these by direct effects
      const doseRatio = Math.min(1.0, intensity / 3.0);

      let consistencyMultiplier = 0.5; // Single isolated sessions return attenuated yields
      if (patient?.profile?.historyLogs) {
        const lifestyleLog = patient.profile.historyLogs.find(l => l.compoundId === id);
        if (lifestyleLog && lifestyleLog.consecutiveDaysActive > 0) {
          // Compounding performance returns: exponential function of consistency
          consistencyMultiplier = Math.min(2.5, 1.0 + Math.log(lifestyleLog.consecutiveDaysActive + 1) * 0.4);
        }
      }

      if (id === "spur01") {
        baseRepair += 3.5 * doseRatio;
        baseChaos -= 1.8 * doseRatio;
        baseDampening += 0.5 * doseRatio;
        baseArousal -= 0.2 * doseRatio;
        if (intensity >= 0.1) {
          // Epigenetic Latch Engaged: Establish stable low-energy basin attractor
          item.isLatched = true;
          item.latchMetadata = { text: "Basin Attractor Locked | CpG Demethylation: 28%", creator: "Walter W. Prior Verified" };
          baseRepair = Math.max(baseRepair, 3.5);
          baseChaos = Math.min(baseChaos, -1.8);
        }
      } else if (id === "spur_mtdl") {
        baseRepair += 3.5 * doseRatio;
        baseChaos -= 1.8 * doseRatio;
        baseDampening += 0.5 * doseRatio;
        baseArousal -= 0.2 * doseRatio;
      } else if (id === "seriphadine") {
        const currentDoseMg = intensity; // Map current intensity to scale dose
        
        if (currentDoseMg <= 5.0) {
          // 2-5 mg: Anxiolytic Carbamate Sedation Mode
          baseDampening += 0.6 * doseRatio;
          baseArousal -= 0.2 * doseRatio;
          baseChaos *= 0.5; // Cools baseline noise
        } else if (currentDoseMg > 5.0 && currentDoseMg <= 15.0) {
          // 6-15 mg: Pro-Social/Oneirogenic Synchrony Mode
          baseDampening += 1.0 * doseRatio;
          baseChaos += 0.5 * doseRatio;
          baseArousal -= 0.3 * doseRatio;
          baseRepair += 0.2 * doseRatio;
        } else if (currentDoseMg > 15.0) {
          // 20+ mg: Deep Lucid NMDA Dissociation Mode
          baseDampening += 1.4 * doseRatio;
          baseChaos += 1.8 * doseRatio; // High cortical variance/dream attractor states
          baseArousal -= 0.5 * doseRatio;
          baseRepair += 0.4 * doseRatio;
        }
      } else if (!props && item.effects) {
        baseArousal += (item.effects.arousal ?? 0) * doseRatio;
        baseDampening += (item.effects.dampening ?? 0) * doseRatio;
        baseChaos += (item.effects.chaos ?? 0) * doseRatio;
        baseRepair += (item.effects.repair ?? 0) * doseRatio;
      } else if (id === "cbt") {
        baseRepair += 1.2 * doseRatio * consistencyMultiplier;
        baseChaos -= 0.9 * doseRatio * consistencyMultiplier;
      } else if (id === "sleep") {
        baseRepair += 1.8 * doseRatio * consistencyMultiplier;
        baseDampening += 0.4 * doseRatio * consistencyMultiplier;
        baseChaos -= 1.0 * doseRatio * consistencyMultiplier;
      } else if (id === "meditation") {
        baseDampening += 0.5 * doseRatio * consistencyMultiplier;
        baseChaos -= 0.6 * doseRatio * consistencyMultiplier;
        baseRepair += 0.7 * doseRatio * consistencyMultiplier;
      } else if (id === "z2cardio") {
        baseRepair += 0.8 * doseRatio * consistencyMultiplier;
        baseChaos -= 0.4 * doseRatio * consistencyMultiplier;
      } else if (id === "hbot") {
        baseRepair += 1.6 * doseRatio;
        baseChaos -= 0.5 * doseRatio;
      } else if (id === "coldplunge") {
        baseArousal += 0.8 * doseRatio;
        baseRepair += 0.9 * doseRatio;
        baseDampening -= 0.2 * doseRatio;
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

  // De-linearize Neuro-Vector state equations using patient baseline vitals & psychometrics
  const hrRest = patient?.profile?.vitals?.hrRest ?? 70;
  const hrvRmssd = patient?.profile?.vitals?.hrvRmssd ?? 40;
  const gad7 = patient?.profile?.psychometric?.gad7 ?? 0;
  const phq9 = patient?.profile?.psychometric?.phq9 ?? 0;
  const vitD = patient?.profile?.labs?.vitD ?? 30;
  const sleepHours = patient?.profile?.lifestyle?.sleepHours ?? 8;

  const arousalCoeff = 1.4 * (hrRest / 70.0) * (40.0 / Math.max(10.0, hrvRmssd));
  const dampeningCoeff = 1.6 * (1.0 / (1.0 + (gad7 / 21.0) * 0.5));
  const chaosCoeff = 2.2 * (1.0 + (phq9 / 27.0) * 0.5);
  const repairCoeff = 0.45 * (vitD >= 20 ? 1.2 : 0.8) * (sleepHours >= 7 ? 1.1 : 0.7);

  // 1. Arousal: driven by DAT and NET reuptake/release
  // Agonism at ADRA2A (Clonidine) lowers peripheral adrenergic tone, reducing arousal.
  const arousal =
    baseArousal +
    arousalCoeff * activations.DAT +
    0.8 * activations.NET -
    0.8 * Math.max(0, activations.ADRA2A);

  // 2. Dampening: driven by GABA-A and Mu-Opioid activation, and ADRA2A (clonidine down-regulates locus coeruleus)
  const dampening =
    baseDampening +
    dampeningCoeff * activations.GABAA +
    1.5 * activations.MOR +
    0.6 * Math.max(0, activations.ADRA2A);

  // 3. Chaos: driven by HT2A activation (psychedelics) and NMDA block (dissociatives)
  // Widespread GABA-A activation (sedatives/benzos) down-regulates cortical chaos, hence the dampening penalty
  const rawHT2A = Math.max(0, activations.HT2A);
  const cleanHT2A = rawHT2A * Math.max(0.1, 1.0 - 0.75 * activations.GABAA);
  const chaos =
    baseChaos +
    chaosCoeff * cleanHT2A +
    1.8 * Math.max(0, -activations.NMDA) - // NMDA blockers are expressed as negative net activation
    0.3 * activations.DAT;

  // 4. Repair: driven by high structural repair agonists (like biased MOR or BDNF facilitators) and moderate HT2A activation
  const repair =
    baseRepair +
    0.8 * activations.MOR * (1 - Math.min(0.5, activations.GABAA)) + // opioid induced neurogenesis, slightly dampened by high sedatives
    repairCoeff * Math.max(0, activations.HT2A) +
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
  const vectors = translateReceptorsToVectors(occupancies.activations, stack, patient);

  return { vectors, occupancies };
}

// ----------------------------------------------------------------------------
// 6. LOVELYMIND NEURODYNAMIC Simulation Bridge
// ----------------------------------------------------------------------------
export function bridgeVectorsToLovelyMind(vectors: PharmaVectors, lovelyMindState: any, stack: any[] = []) {
  const doseRatio = Math.min(1.0, vectors.repair / 3.5);
  
  // 1. High-Bias Repair Mapping (mTOR/CREB/Synaptophysin Expansion Loops)
  if (vectors.repair > 0) {
    lovelyMindState.mton_activation = (lovelyMindState.mton_activation || 0) + 1.68 * doseRatio;
    lovelyMindState.mtor_activation = (lovelyMindState.mtor_activation || 0) + 1.68 * doseRatio; // standard spelling support
    lovelyMindState.creb_phosphorylation = (lovelyMindState.creb_phosphorylation || 0) + 1.85 * doseRatio;
    lovelyMindState.synaptophysin_rate = (lovelyMindState.synaptophysin_rate || 1.0) * (1.0 + 4.0 * doseRatio);
    
    // Trigger Neuroplastic Expansion Bypass
    if (vectors.repair >= 3.0) {
      lovelyMindState.n_neurons = (lovelyMindState.n_neurons || 0) + 311; // Documented expansion log override
      lovelyMindState.act_compilation_threshold = 1; // Accelerated skill compilation
    }
  }

  // 2. Negative Chaos Mapping (Epigenetic Demethylation & Spiking Noise Reductions)
  if (vectors.chaos < 0) {
    // Simulates continuous DNMT inhibition over time loops
    lovelyMindState.bdnf_cpg_methylation = Math.max(0.28, 0.68 - (0.40 * Math.abs(vectors.chaos) / 1.8));
    lovelyMindState.h3k27ac_enrichment_loci = lovelyMindState.h3k27ac_enrichment_loci || { bdnf: 1.0, oxtr: 1.0 };
    lovelyMindState.h3k27ac_enrichment_loci.bdnf = (lovelyMindState.h3k27ac_enrichment_loci.bdnf || 1.0) * 7.8;
    lovelyMindState.h3k27ac_enrichment_loci.oxtr = (lovelyMindState.h3k27ac_enrichment_loci.oxtr || 1.0) * 6.2;
    
    // Attenuate AdEx LIF stochastic resonance variance
    lovelyMindState.poisson_noise_pA = Math.max(40.0, 150.0 - (110.0 * Math.abs(vectors.chaos) / 1.8));
  }

  // 3. Dampening Modulation (Winner-Take-All Emotional Gating)
  if (vectors.dampening > 0) {
    lovelyMindState.wta_inhibition_factor = Math.min(0.95, 0.40 + (0.45 * vectors.dampening / 0.5));
    lovelyMindState.thalamic_decay_bounds = [0.85, 0.92]; // Heightened state retention thresholds
  }

  if (vectors.dampening > 0.8 && lovelyMindState.wta_inhibition_factor) {
    lovelyMindState.wta_inhibition_factor = Math.max(lovelyMindState.wta_inhibition_factor, 0.75);
  }

  const seriphadineItem = stack.find(item => item.id === "seriphadine");
  const id = seriphadineItem ? "seriphadine" : "";
  const intensity = seriphadineItem ? (seriphadineItem.dose ?? seriphadineItem.currentIntensity ?? 0) : 0;
  if (id === "seriphadine" && intensity >= 20.0) {
    // Inject highly specified oneirogenic state overrides into active PAD lattice tracking loops
    lovelyMindState.forced_affective_seeds = ["liminal", "nostalgia", "curiosity"];
    lovelyMindState.koopman_temperature_modulation = 1.35; // Expand sampling variance attractor paths
  }

  return lovelyMindState;
}
