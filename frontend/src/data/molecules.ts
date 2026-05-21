// Shared Molecular Database
// Foundational Pharmacogenomic Design and QSAR Profiles Compiled by Walter W., Substr8 BioResearch.

export interface AdvancedBioavailability {
  bioavailabilityF: number;          // Fractional absorption (0.0 - 1.0)
  volumeOfDistributionLkg: number;   // Vd in L/kg to calculate authentic C0
  canonicalSmiles: string;           // Used by the frontend canvas drawer component
  mw?: number;                       // Molecular weight in Da
  tpsa?: number;                     // Topological polar surface area in Å²
  F_bioavail?: number;
  Vd_Lkg?: number;
}

const svgIndole = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M30 70 L30 40 L55 25 L80 40 L80 70 L55 85 Z"/><path d="M30 40 L10 25 L10 50 Z"/><circle cx="55" cy="55" r="10"/></svg>`;
const svgPhen = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M20 50 L40 20 L70 20 L90 50 L70 80 L40 80 Z"/><line x1="20" y1="50" x2="5" y2="50"/><line x1="40" y1="80" x2="30" y2="95"/></svg>`;
const svgTricyclic = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M10 50 L30 20 L60 20 L80 50 L60 80 L30 80 Z"/><path d="M60 20 L80 10 L100 30 L80 50"/><circle cx="45" cy="50" r="12"/></svg>`;
const svgCannabinoid = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><polygon points="30,35 40,20 55,20 65,35 55,50 40,50" /><polygon points="65,35 75,20 90,20 100,35 90,50 75,50" /><path d="M55,20 L75,20" /><path d="M20,25 L30,35 L20,45" /><circle cx="65" cy="35" r="5" /></svg>`;
const svgSpur = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M50 15 L20 35 L20 65 L50 85 L80 65 L80 35 Z"/><circle cx="50" cy="50" r="15"/><path d="M50 15 L50 5"/><path d="M20 35 L5 25"/><path d="M80 35 L95 25"/><circle cx="50" cy="50" r="4" fill="currentColor"/></svg>`;
const svgMtdl = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><path d="M50 10 L25 30 L25 70 L50 90 L75 70 L75 30 Z"/><path d="M25 30 L50 50 L75 30"/><circle cx="50" cy="50" r="10"/><line x1="50" y1="10" x2="50" y2="50"/></svg>`;
const svgSeriphadine = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class="w-full h-full"><circle cx="35" cy="50" r="12"/><circle cx="65" cy="50" r="12"/><path d="M35 38 L65 38 M35 62 L65 62"/><rect x="42" y="45" width="16" height="10" rx="2"/><circle cx="50" cy="25" r="6"/></svg>`;

export const molecules = [
    // --- NOVEL THERAPEUTICS & BABELFORGE PROGRAMMATIC SYSTEMS ---
    {
      id: 'seriphadine',
      name: 'Seriphadine',
      class: 'novel',
      classLabel: 'Oneirogenic Anxiolytic',
      isBabelForge: true,
      svg: svgSeriphadine,
      halfLife: 'medium',
      regimen: { frequency: 'prn', standardRange: { min: 2, max: 25, unit: "mg" } },
      effects: { arousal: -0.4, dampening: 1.2, chaos: 0.8, repair: 0.4 },
      smilesPhysics: {
        bioavailabilityF: 0.78,
        volumeOfDistributionLkg: 2.4,
        canonicalSmiles: "CN(C)CC(CC(=O)C1CN(C(=O)OC)c2c(cccc2)-c2ccccc21)C(=O)N1CCCC1=O",
        mw: 466.57,
        tpsa: 71.2
      }
    },
    { 
      id: 'spur_mtdl', 
      name: 'SPUR-MTDL', 
      class: 'novel', 
      classLabel: 'Epigenetic Neuroplastogen', 
      isBabelForge: true, 
      svg: svgMtdl, 
      halfLife: 'medium', 
      effects: { arousal: -0.2, dampening: 0.5, chaos: -1.8, repair: 3.5 },
      regimen: { frequency: 'prn', standardRange: { min: 5, max: 25, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.58,
        volumeOfDistributionLkg: 1.8,
        canonicalSmiles: "CCCCC(=O)N[C@H](C(=O)N[C@H](Cc1ccc(O)cc1)C(=O)N2C(=O)C(c3cc4c(cc3O)CCN(C(=O)OCC)C4(c5ccccc5-c6ccccc6)(c7ccccc7CC))CCC2)C(C)CC",
        mw: 955.20,
        tpsa: 160.0
      }
    },
    { 
      id: 'spur01', 
      name: 'SPUR-01 Ontological Reducer', 
      class: 'novel', 
      classLabel: 'Conformational Pan-Modulator', 
      isBabelForge: true, 
      svg: svgSpur, 
      halfLife: 'long', 
      effects: { arousal: -0.2, dampening: 0.5, chaos: -1.8, repair: 3.5 },
      smilesPhysics: {
        canonicalSmiles: "CCCCC(=O)N[C@H](C(=O)N[C@H](Cc1ccc(O)cc1)C(=O)N2C(=O)C(c3cc4c(cc3O)CCN(C(=O)OCC)C4(c5ccccc5-c6ccccc6)(c7ccccc7CC))CCC2)C(C)CC",
        mw: 955.20,
        tpsa: 160.0,
        F_bioavail: 0.85,
        Vd_Lkg: 3.2,
        bioavailabilityF: 0.85,
        volumeOfDistributionLkg: 3.2
      },
      rotatableBondsPeriphery: 18,
      structuralPhysics: {
        HT2A: { delta_TM6_outward_A: 5.4, d_D155_amine_A: 2.9, theta_W336_displacement: 58.0, E_pi_phenyl_traps: 0.01 },
        MOR: { delta_TM6_outward_A: 5.6, d_D155_amine_A: 2.8, theta_W336_displacement: 70.0, E_pi_phenyl_traps: 0.01 }
      },
      qsarProfile: {
        probabilities: { immuno: 0.99, dili: 0.64, bbb: 0.72, mie_pxr: 0.53, cyp3a4: 0.52, cyp2c9: 0.51 },
        endpoints: { mutagen: "Inactive", cyto: "Inactive", nr_ahr: "Inactive", sr_are: "Inactive" }
      },
      synthesisRoute: { stepsCount: 12, reagents: ["NaH", "HATU"], solvents: ["DMF"], finalHPLCFlurityPercentage: 99.2, cumulativeYieldPercentage: 3.8 }
    },
    {
      id: 'zb01',
      name: 'ZenBud™ (ZB-01)',
      class: 'novel',
      classLabel: 'Anxiolytic Ligand',
      isBabelForge: true,
      svg: svgIndole,
      halfLife: 'long',
      effects: { arousal: -0.4, dampening: 1.0, chaos: -0.5, repair: 0.6 },
      smilesPhysics: {
        canonicalSmiles: "O=C1CCC2(CCN(CC2)c3cc4c(cc3)OCO4)N1",
        mw: 344.4,
        tpsa: 41.6,
        F_bioavail: 0.72,
        Vd_Lkg: 1.8,
        bioavailabilityF: 0.72,
        volumeOfDistributionLkg: 1.8
      },
      structuralPhysics: {
        HT2A: { delta_TM6_outward_A: 5.1, d_D155_amine_A: 2.8, theta_W336_displacement: 52.0, E_pi_phenyl_traps: 0.02 },
        GABAA: { delta_TM6_outward_A: 4.8, d_D155_amine_A: 2.9, theta_W336_displacement: 55.0, E_pi_phenyl_traps: 0.01 }
      }
    },
    { 
      id: 'arrow_a', 
      name: 'Cupid Arrow-A', 
      class: 'novel', 
      classLabel: 'Bivalent Anchor component', 
      isBabelForge: true,
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.2, dampening: 0.4, chaos: 0.0, repair: 0.8 },
      smilesPhysics: { 
        canonicalSmiles: "CC(C)[C@H]1C(=O)N[C@@H](C(=O)N[C@@H](C(=O)N[C@@H](C(=O)N[C@@H](C(=O)N2CCC[C@H]2C(=O)N[C@@H](C(=O)N[C@@H](C(=O)NCC(=O)N[C@@H](C(=O)O)CCCCN=[N++]=[N-])Cc3ccc(O)cc3)CC(C)C)CSSC[C@H](NC(=O)[C@H](Cc4ccc(O)cc4)NC(=O)C)C(=O)O)CCC(=O)N)CC(C)C)CCC(=O)N", 
        mw: 1262.55, 
        tpsa: 420.0,
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 1.5
      } 
    },
    { 
      id: 'arrow_b', 
      name: 'Cupid Arrow-B', 
      class: 'novel', 
      classLabel: 'Bivalent Anchor component', 
      isBabelForge: true,
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.1, dampening: 0.5, chaos: -0.2, repair: 0.9 },
      smilesPhysics: { 
        canonicalSmiles: "CC(C)[C@H]1C(=O)N[C@@H](C(=O)N2CCC[C@H]2C(=O)O)CSSC[C@H](NC(=O)[C@H](Cc3ccc(O)cc3)NC(=O)C)C(=O)O", 
        mw: 985.12, 
        tpsa: 320.0,
        bioavailabilityF: 0.55,
        volumeOfDistributionLkg: 1.8
      } 
    },
    { 
      id: 'll07', 
      name: 'LimbicLink™ (LL-07)', 
      class: 'novel', 
      classLabel: 'DMN Modulator', 
      isBabelForge: true, 
      svg: svgTricyclic, 
      halfLife: 'long', 
      effects: { arousal: -0.2, dampening: 0.3, chaos: 0.4, repair: 1.2 },
      smilesPhysics: {
        bioavailabilityF: 0.65,
        volumeOfDistributionLkg: 2.8,
        canonicalSmiles: "C1=CC2=C(C=C1)C(C3=CC=CC=C3)(CCS2)CCN(C)C",
        mw: 337.52,
        tpsa: 15.4
      }
    },
    { 
      id: 'ss20', 
      name: 'SynaptoStim™ (SS-20)', 
      class: 'novel', 
      classLabel: 'Targeted DRI', 
      isBabelForge: true, 
      svg: svgPhen, 
      halfLife: 'short', 
      effects: { arousal: 1.5, dampening: 0.0, chaos: -0.2, repair: 0.5 },
      smilesPhysics: {
        bioavailabilityF: 0.75,
        volumeOfDistributionLkg: 3.5,
        canonicalSmiles: "COCC(C1CCCCN1)C2=CC=C(C=C2)Cl",
        mw: 267.75,
        tpsa: 21.5
      }
    },
    { 
      id: 'dr02', 
      name: 'DopaReg™ (DR-02)', 
      class: 'novel', 
      classLabel: 'Precision Antagonist', 
      isBabelForge: true, 
      svg: svgPhen, 
      halfLife: 'medium', 
      effects: { arousal: -0.5, dampening: 1.2, chaos: -0.4, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.60,
        volumeOfDistributionLkg: 4.8,
        canonicalSmiles: "ClC1=CC=CC2=C1N(C(=O)CN=C2C3=CC=CC=C3)C4CCN(CC4)C",
        mw: 382.88,
        tpsa: 38.6
      }
    },
    { 
      id: 'nx44', 
      name: 'NeuroX™ (NX-44)', 
      class: 'novel', 
      classLabel: 'BDNF Enhancer', 
      isBabelForge: true, 
      svg: svgIndole, 
      halfLife: 'long', 
      effects: { arousal: 0.2, dampening: 0.1, chaos: -0.5, repair: 2.5 },
      smilesPhysics: {
        bioavailabilityF: 0.70,
        volumeOfDistributionLkg: 1.9,
        canonicalSmiles: "CN1CCC2=C1C3=C(C=CC=C3)C(=C2)C(=O)N",
        mw: 227.26,
        tpsa: 42.4
      }
    },
    {
      id: 'psilo',
      name: 'Psilocybin',
      class: 'novel',
      classLabel: 'Classic Psychedelic',
      isBabelForge: true,
      svg: svgIndole,
      halfLife: 'medium',
      effects: { arousal: 0.8, dampening: -0.2, chaos: 1.2, repair: 0.5 },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 0.9,
        canonicalSmiles: "CN(C)CCC1=CNC2=C1C(=CC=C2)OP(=O)(O)O",
        mw: 284.25,
        tpsa: 79.4
      }
    },
    {
      id: 'mdma',
      name: 'MDMA',
      class: 'novel',
      classLabel: 'Empathogen',
      isBabelForge: true,
      svg: svgPhen,
      halfLife: 'medium',
      effects: { arousal: 1.2, dampening: -0.3, chaos: 0.4, repair: 0.7 },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 6.0,
        canonicalSmiles: "CC(CC1=CC2=C(C=C1)OCO2)NC",
        mw: 193.25,
        tpsa: 27.7
      }
    },
    {
      id: 'ketamine',
      name: 'Ketamine',
      class: 'novel',
      classLabel: 'Dissociative',
      isBabelForge: true,
      svg: svgTricyclic,
      halfLife: 'medium',
      effects: { arousal: -0.2, dampening: 0.5, chaos: 1.0, repair: 0.9 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 3.0,
        canonicalSmiles: "ClC1=CC=CC=C1C2(C(=O)CCCC2)NC",
        mw: 237.73,
        tpsa: 29.1
      }
    },
    {
      id: 'lsd',
      name: 'LSD',
      class: 'novel',
      classLabel: 'Classic Psychedelic',
      isBabelForge: true,
      svg: svgIndole,
      halfLife: 'medium',
      effects: { arousal: 0.7, dampening: -0.1, chaos: 1.4, repair: 0.4 },
      smilesPhysics: {
        bioavailabilityF: 0.70,
        volumeOfDistributionLkg: 0.28,
        canonicalSmiles: "CCN(CC)C(=O)[C@H]1CN(C)[C@@H]2Cc3c[nH]c4ccc(C2=C1)c34",
        mw: 323.43,
        tpsa: 54.1
      }
    },
    
    // --- SSRIs, SNRIs & ANTIDEPRESSANTS ---
    {
      id: 'sert',
      name: 'Sertraline',
      class: 'ssri',
      classLabel: 'SSRI',
      svg: svgTricyclic,
      halfLife: 'medium',
      effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 },
      regimen: { frequency: 'daily', standardRange: { min: 50, max: 200, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.44,
        volumeOfDistributionLkg: 76.0,
        canonicalSmiles: "CN[C@H]1CC[C@@H](C2=C(C=CC=C21)Cl)C3=CC=C(C=C3)Cl",
        mw: 306.2,
        tpsa: 12.0
      }
    },
    {
      id: 'fluox',
      name: 'Fluoxetine',
      class: 'ssri',
      classLabel: 'SSRI',
      svg: svgTricyclic,
      halfLife: 'medium',
      effects: { arousal: -0.1, dampening: 0.7, chaos: 0.0, repair: 0.0 },
      regimen: { frequency: 'daily', standardRange: { min: 20, max: 80, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.72,
        volumeOfDistributionLkg: 35.0,
        canonicalSmiles: "CNCCC(C1=CC=CC=C1)OC2=CC=C(C=C2)C(F)(F)F",
        mw: 309.33,
        tpsa: 21.3
      }
    },
    { 
      id: 'escit', 
      name: 'Escitalopram', 
      class: 'ssri', 
      classLabel: 'SSRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.3, dampening: 0.9, chaos: -0.2, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 5, max: 20, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 12.0,
        canonicalSmiles: "CN(C)CCCC1(C2=C(CO1)C=C(C=C2)F)C3=CC=C(C=C3)C#N",
        mw: 324.39,
        tpsa: 38.6
      }
    },
    { 
      id: 'venla', 
      name: 'Venlafaxine', 
      class: 'ssri', 
      classLabel: 'SNRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.1, dampening: 0.6, chaos: 0.0, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 37.5, max: 225, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.45,
        volumeOfDistributionLkg: 7.5,
        canonicalSmiles: "CN(C)CC(C1CCCCC1(O)C2=CC=C(C=C2)OC)",
        mw: 277.4,
        tpsa: 29.5
      }
    },
    { 
      id: 'dulox', 
      name: 'Duloxetine', 
      class: 'ssri', 
      classLabel: 'SNRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.2, dampening: 0.5, chaos: 0.1, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 30, max: 120, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 20.0,
        canonicalSmiles: "CNCCC(C1=CC=CS1)OC2=CC3=CC=CC=C3C=C2",
        mw: 297.41,
        tpsa: 21.5
      }
    },
    { 
      id: 'citalo', 
      name: 'Citalopram', 
      class: 'ssri', 
      classLabel: 'SSRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.2, dampening: 0.8, chaos: -0.1, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 10, max: 40, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 12.0,
        canonicalSmiles: "CN(C)CCCC1(C2=CC=C(C=C2CO1)F)C3=CC=C(C=C3)C#N",
        mw: 324.39,
        tpsa: 38.6
      }
    },
    { 
      id: 'parox', 
      name: 'Paroxetine', 
      class: 'ssri', 
      classLabel: 'SSRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.4, dampening: 1.0, chaos: -0.2, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 10, max: 60, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 17.0,
        canonicalSmiles: "FC1=CC=C(C=C1)[C@@H]2CO[C@H]3CC(CCN3)OC4=CC5=C(C=C4)OCO5",
        mw: 329.37,
        tpsa: 38.8
      }
    },
    { 
      id: 'fluvox', 
      name: 'Fluvoxamine', 
      class: 'ssri', 
      classLabel: 'SSRI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.5, dampening: 1.1, chaos: -0.1, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 50, max: 300, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.53,
        volumeOfDistributionLkg: 25.0,
        canonicalSmiles: "COCCCC(=N/OCCN)/C1=CC=C(C=C1)C(F)(F)F",
        mw: 318.34,
        tpsa: 47.9
      }
    },
    { 
      id: 'bupropion', 
      name: 'Bupropion', 
      class: 'stimulant', 
      classLabel: 'NDRI', 
      svg: svgPhen, 
      halfLife: 'medium', 
      effects: { arousal: 0.9, dampening: -0.1, chaos: 0.2, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.10,
        volumeOfDistributionLkg: 20.0,
        canonicalSmiles: "CC(C(=O)C1=CC(=CC=C1)Cl)NC(C)(C)C",
        mw: 239.74,
        tpsa: 29.1
      }
    },
    { 
      id: 'mirtaz', 
      name: 'Mirtazapine', 
      class: 'ssri', 
      classLabel: 'TeCA / NaSSA', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.8, dampening: 1.2, chaos: -0.1, repair: 0.1 }, 
      regimen: { frequency: 'daily', standardRange: { min: 15, max: 45, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 4.5,
        canonicalSmiles: "CN1CCN2C(C1)C3=CC=CC=C3CC4=C2N=CC=C4",
        mw: 265.35,
        tpsa: 16.3
      }
    },
    { 
      id: 'traz', 
      name: 'Trazodone', 
      class: 'ssri', 
      classLabel: 'SARI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -1.0, dampening: 1.4, chaos: 0.1, repair: 0.0 }, 
      regimen: { frequency: 'daily', standardRange: { min: 50, max: 300, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.65,
        volumeOfDistributionLkg: 1.5,
        canonicalSmiles: "ClC1=CC=CC(=C1)N2CCN(CCCN3C(=O)N(CCN3)C4=CC=CC=C4)CC2",
        mw: 371.86,
        tpsa: 44.9
      }
    },
    
    // --- STIMULANTS & WAKEFULNESS ---
    {
      id: 'amph',
      name: 'Amphetamine Salts',
      class: 'stimulant',
      classLabel: 'Stimulant',
      svg: svgPhen,
      halfLife: 'medium',
      addictionPotential: 0.7,
      effects: { arousal: 1.5, dampening: -0.5, chaos: 0.8, repair: -0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.85,
        volumeOfDistributionLkg: 4.2,
        canonicalSmiles: "CC(CC1=CC=CC=C1)N",
        mw: 135.21,
        tpsa: 26.0
      }
    },
    { 
      id: 'mph', 
      name: 'Methylphenidate', 
      class: 'stimulant', 
      classLabel: 'Stimulant', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.4, 
      effects: { arousal: 1.2, dampening: -0.3, chaos: 0.5, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.30,
        volumeOfDistributionLkg: 2.2,
        canonicalSmiles: "COCC(C1CCCCN1)C2=CC=CC=C2",
        mw: 233.31,
        tpsa: 29.5
      }
    },
    { 
      id: 'lisdexamph', 
      name: 'Lisdexamfetamine', 
      class: 'stimulant', 
      classLabel: 'Stimulant', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.6, 
      effects: { arousal: 1.3, dampening: -0.4, chaos: 0.6, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.96,
        volumeOfDistributionLkg: 5.6,
        canonicalSmiles: "CC(CC1=CC=CC=C1)NC(=O)[C@@H](CCCCN)N",
        mw: 263.38,
        tpsa: 81.3
      }
    },
    { 
      id: 'dexmph', 
      name: 'Dexmethylphenidate', 
      class: 'stimulant', 
      classLabel: 'Stimulant', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.4, 
      effects: { arousal: 1.1, dampening: -0.2, chaos: 0.4, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.30,
        volumeOfDistributionLkg: 2.2,
        canonicalSmiles: "CO[C@H]([C@@H]1CCCCN1)C2=CC=CC=C2",
        mw: 233.31,
        tpsa: 29.5
      }
    },
    { 
      id: 'modaf', 
      name: 'Modafinil', 
      class: 'stimulant', 
      classLabel: 'Eugeroic', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.1, 
      effects: { arousal: 0.8, dampening: 0.0, chaos: 0.1, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 0.9,
        canonicalSmiles: "NC(=O)CS(=O)C(C1=CC=CC=C1)C2=CC=CC=C2",
        mw: 273.35,
        tpsa: 62.3
      }
    },
    { 
      id: 'armodaf', 
      name: 'Armodafinil', 
      class: 'stimulant', 
      classLabel: 'Eugeroic', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.1, 
      effects: { arousal: 0.9, dampening: 0.0, chaos: 0.1, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 0.9,
        canonicalSmiles: "NC(=O)C[S@@](=O)C(C1=CC=CC=C1)C2=CC=CC=C2",
        mw: 273.35,
        tpsa: 62.3
      }
    },
    {
      id: 'caffeine',
      name: 'Caffeine',
      class: 'stimulant',
      classLabel: 'Xanthine',
      svg: svgPhen,
      halfLife: 'medium',
      effects: { arousal: 0.6, dampening: 0.0, chaos: 0.3, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.99,
        volumeOfDistributionLkg: 0.6,
        canonicalSmiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
        mw: 194.19,
        tpsa: 58.4
      }
    },
    {
      id: 'nicotine',
      name: 'Nicotine',
      class: 'stimulant',
      classLabel: 'Alkaloid Stimulant',
      svg: svgPhen,
      halfLife: 'medium',
      addictionPotential: 0.9,
      effects: { arousal: 0.5, dampening: 0.1, chaos: 0.2, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.44,
        volumeOfDistributionLkg: 2.6,
        canonicalSmiles: "CN1CCC[C@H]1C2=CN=CC=C2",
        mw: 162.23,
        tpsa: 16.2
      }
    },
    { 
      id: 'meth', 
      name: 'Methamphetamine', 
      class: 'stimulant', 
      classLabel: 'Potent Releaser', 
      svg: svgPhen, 
      halfLife: 'long', 
      addictionPotential: 0.9, 
      effects: { arousal: 2.8, dampening: -1.2, chaos: 2.5, repair: -1.0 },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 4.0,
        canonicalSmiles: "CC(CC1=CC=CC=C1)NC",
        mw: 149.23,
        tpsa: 12.0
      }
    },
    { 
      id: 'coke', 
      name: 'Cocaine', 
      class: 'stimulant', 
      classLabel: 'DRI / SNDRI', 
      svg: svgPhen, 
      halfLife: 'short', 
      addictionPotential: 0.85, 
      effects: { arousal: 2.2, dampening: -0.8, chaos: 1.8, repair: -0.5 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 2.0,
        canonicalSmiles: "CN1[C@H]2CC[C@@H]1[C@@H]([C@H](C2)OC(=O)C3=CC=CC=C3)C(=O)OC",
        mw: 303.35,
        tpsa: 55.6
      }
    },
    
    // --- ANTIPSYCHOTICS & MOOD STABILIZERS ---
    { 
      id: 'halo', 
      name: 'Haloperidol', 
      class: 'antipsychotic', 
      classLabel: 'Typical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -1.0, dampening: 1.8, chaos: -0.5, repair: -0.5 },
      smilesPhysics: {
        bioavailabilityF: 0.60,
        volumeOfDistributionLkg: 18.0,
        canonicalSmiles: "FC1=CC=C(C=C1)C(=O)CCCN2CCC(CC2)(C3=CC=C(C=C3)Cl)O",
        mw: 375.87,
        tpsa: 40.5
      }
    },
    { 
      id: 'queti', 
      name: 'Quetiapine', 
      class: 'antipsychotic', 
      classLabel: 'Atypical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.8, dampening: 1.5, chaos: -0.3, repair: -0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.09,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "OSCCN1CCN(CC1)C2=NC3=CC=CC=C3SC4=CC=CC=C42",
        mw: 383.51,
        tpsa: 46.5
      }
    },
    { 
      id: 'arip', 
      name: 'Aripiprazole', 
      class: 'antipsychotic', 
      classLabel: 'Atypical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.4, dampening: 1.2, chaos: -0.2, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.87,
        volumeOfDistributionLkg: 4.9,
        canonicalSmiles: "ClC1=CC=CC(=C1)N2CCN(CCCC3=CC=C4C(=C3)NC(=O)CC4)CC2",
        mw: 448.38,
        tpsa: 50.8
      }
    },
    { 
      id: 'risper', 
      name: 'Risperidone', 
      class: 'antipsychotic', 
      classLabel: 'Atypical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.6, dampening: 1.4, chaos: -0.3, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.70,
        volumeOfDistributionLkg: 1.2,
        canonicalSmiles: "CC1=C(C(=O)N2CCC(CC2)N3C4=CC=C(C=C4F)OC3=N)CCCN1",
        mw: 410.48,
        tpsa: 62.3
      }
    },
    { 
      id: 'olan', 
      name: 'Olanzapine', 
      class: 'antipsychotic', 
      classLabel: 'Atypical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.7, dampening: 1.6, chaos: -0.4, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.60,
        volumeOfDistributionLkg: 15.0,
        canonicalSmiles: "CN1CCN(CC1)C2=NC3=CC=CC=C3NC4=C2S/C=C4/C",
        mw: 312.43,
        tpsa: 32.0
      }
    },
    { 
      id: 'cloz', 
      name: 'Clozapine', 
      class: 'antipsychotic', 
      classLabel: 'Atypical Antipsychotic', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.9, dampening: 1.7, chaos: -0.6, repair: -0.3 },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 5.0,
        canonicalSmiles: "CN1CCN(CC1)C2=NC3=CC=CC=C3NC4=C2C=C(C=C4)Cl",
        mw: 326.82,
        tpsa: 32.0
      }
    },
    { 
      id: 'lithium', 
      name: 'Lithium', 
      class: 'antipsychotic', 
      classLabel: 'Mood Stabilizer', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.2, dampening: 0.8, chaos: -0.7, repair: 0.4 },
      smilesPhysics: {
        bioavailabilityF: 1.00,
        volumeOfDistributionLkg: 0.8,
        canonicalSmiles: "[Li]",
        mw: 6.94,
        tpsa: 0.0
      }
    },
    { 
      id: 'lamo', 
      name: 'Lamotrigine', 
      class: 'antipsychotic', 
      classLabel: 'Mood Stabilizer', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.0, dampening: 0.5, chaos: -0.5, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.98,
        volumeOfDistributionLkg: 1.2,
        canonicalSmiles: "NC1=NC(=NC2=C1C=CC(=C2Cl)Cl)N",
        mw: 256.09,
        tpsa: 77.8
      }
    },
    
    // --- CANNABINOIDS ---
    {
      id: 'thc',
      name: 'Delta-9-THC',
      class: 'cannabinoid',
      classLabel: 'Cannabinoid',
      svg: svgCannabinoid,
      halfLife: 'medium',
      addictionPotential: 0.3,
      effects: { arousal: 0.2, dampening: 0.5, chaos: 0.6, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C2[C@H]3C=C(C)CC[C@@H]3C(C)(C)OC2=C1)O",
        mw: 314.46,
        tpsa: 29.5
      }
    },
    {
      id: 'cbd',
      name: 'Cannabidiol (CBD)',
      class: 'cannabinoid',
      classLabel: 'Cannabinoid',
      svg: svgCannabinoid,
      halfLife: 'medium',
      effects: { arousal: -0.2, dampening: 0.6, chaos: -0.4, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.19,
        volumeOfDistributionLkg: 32.0,
        canonicalSmiles: "CCCCCC1=CC(=C(C(=C1)O)[C@@H]2C=C(C)CC[C@H]2C(=C)C)O",
        mw: 314.46,
        tpsa: 40.5
      }
    },
    { 
      id: 'delta8', 
      name: 'Delta-8-THC', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      addictionPotential: 0.2, 
      effects: { arousal: 0.1, dampening: 0.7, chaos: 0.3, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.15,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C2[C@H]3CC=C(C)C[C@@H]3C(C)(C)OC2=C1)O",
        mw: 314.46,
        tpsa: 29.5
      }
    },
    { 
      id: 'hhc', 
      name: 'HHC (Hexahydrocannabinol)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.15, dampening: 0.6, chaos: 0.4, repair: -0.05 },
      smilesPhysics: {
        bioavailabilityF: 0.15,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C2[C@H]3CCC(C)C[C@@H]3C(C)(C)OC2=C1)O",
        mw: 316.48,
        tpsa: 29.5
      }
    },
    { 
      id: 'cbga', 
      name: 'CBGA (Cannabigerolic acid)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid Precursor', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.0, dampening: 0.3, chaos: -0.1, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.10,
        volumeOfDistributionLkg: 15.0,
        canonicalSmiles: "CCCCCC1=CC(=C(C(=C1)O)CC=C(C)CCC=C(C)C)C(=O)O",
        mw: 360.49,
        tpsa: 77.8
      }
    },
    { 
      id: 'cbn', 
      name: 'Cannabinol (CBN)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: -0.4, dampening: 0.9, chaos: -0.1, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C2C3=C(CC(C)(C)O2)C=CC(C)=C3)O",
        mw: 310.43,
        tpsa: 29.5
      }
    },
    { 
      id: 'cbg', 
      name: 'Cannabigerol (CBG)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.1, dampening: 0.4, chaos: -0.2, repair: 0.3 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C(C(=C1)O)CC=C(C)CCC=C(C)C)O",
        mw: 316.48,
        tpsa: 40.5
      }
    },
    { 
      id: 'thcv', 
      name: 'Tetrahydrocannabivarin (THCV)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.5, dampening: 0.1, chaos: 0.1, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.18,
        volumeOfDistributionLkg: 8.0,
        canonicalSmiles: "CCCC1=CC(=C2[C@H]3C=C(C)CC[C@@H]3C(C)(C)OC2=C1)O",
        mw: 286.41,
        tpsa: 29.5
      }
    },
    { 
      id: 'cbdv', 
      name: 'Cannabidivarin (CBDV)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: -0.1, dampening: 0.4, chaos: -0.3, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.17,
        volumeOfDistributionLkg: 25.0,
        canonicalSmiles: "CCCC1=CC(=C(C(=C1)O)[C@@H]2C=C(C)CC[C@H]2C(=C)C)O",
        mw: 286.41,
        tpsa: 40.5
      }
    },
    { 
      id: 'thcp', 
      name: 'THC-P (Tetrahydrocannabiphorol)', 
      class: 'cannabinoid', 
      classLabel: 'Potent Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.3, dampening: 0.7, chaos: 0.8, repair: -0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.12,
        volumeOfDistributionLkg: 12.0,
        canonicalSmiles: "CCCCCCC1=CC(=C2[C@H]3C=C(C)CC[C@@H]3C(C)(C)OC2=C1)O",
        mw: 342.52,
        tpsa: 29.5
      }
    },
    { 
      id: 'thco', 
      name: 'THC-O-Acetate', 
      class: 'cannabinoid', 
      classLabel: 'Synthetic Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.4, dampening: 0.8, chaos: 1.0, repair: -0.3 },
      smilesPhysics: {
        bioavailabilityF: 0.25,
        volumeOfDistributionLkg: 11.0,
        canonicalSmiles: "CCCCCC1=CC(=C2[C@H]3C=C(C)CC[C@@H]3C(C)(C)OC2=C1)OC(=O)C",
        mw: 356.5,
        tpsa: 35.5
      }
    },
    { 
      id: 'delta10', 
      name: 'Delta-10-THC', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.25, dampening: 0.4, chaos: 0.35, repair: -0.05 },
      smilesPhysics: {
        bioavailabilityF: 0.15,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CCCCCC1=CC(=C2[C@H]3C=CCC[C@@H]3C(C)(C)OC2=C1)O",
        mw: 314.46,
        tpsa: 29.5
      }
    },
    { 
      id: 'cbc', 
      name: 'Cannabichromene (CBC)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: 0.0, dampening: 0.4, chaos: -0.1, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 9.0,
        canonicalSmiles: "CCCCCC1=CC(=C(C(=C1)O)C2C=CC(C)(CCC=C(C)C)O2)O",
        mw: 314.46,
        tpsa: 40.5
      }
    },
    { 
      id: 'cbl', 
      name: 'Cannabicyclol (CBL)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: -0.1, dampening: 0.5, chaos: 0.0, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.18,
        volumeOfDistributionLkg: 8.5,
        canonicalSmiles: "CCCCCC1=CC(=C2C3C(CC(C)(C)O2)C3C(C)C1)O",
        mw: 314.46,
        tpsa: 29.5
      }
    },
    { 
      id: 'cbdp', 
      name: 'Cannabidiphorol (CBDP)', 
      class: 'cannabinoid', 
      classLabel: 'Cannabinoid', 
      svg: svgCannabinoid, 
      halfLife: 'medium', 
      effects: { arousal: -0.3, dampening: 0.8, chaos: -0.2, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.12,
        volumeOfDistributionLkg: 28.0,
        canonicalSmiles: "CCCCCCC1=CC(=C(C(=C1)O)[C@@H]2C=C(C)CC[C@H]2C(=C)C)O",
        mw: 342.52,
        tpsa: 40.5
      }
    },
    
    // --- DEPRESSANTS, BENZODIAZEPINES & OPIOIDS ---
    {
      id: 'alpraz',
      name: 'Alprazolam',
      class: 'depressant',
      classLabel: 'Benzodiazepine',
      svg: svgTricyclic,
      halfLife: 'medium',
      addictionPotential: 0.8,
      effects: { arousal: -1.2, dampening: 1.4, chaos: -0.6, repair: -0.3 },
      regimen: { frequency: 'prn', standardRange: { min: 0.25, max: 2.0, unit: 'mg' } },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 1.1,
        canonicalSmiles: "Cc1nnc2n1-c3ccc(Cl)cc3-c4ccccc4C=N2",
        mw: 308.8,
        tpsa: 36.6
      }
    },
    { 
      id: 'clonaz', 
      name: 'Clonazepam', 
      class: 'depressant', 
      classLabel: 'Benzodiazepine', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.7, 
      effects: { arousal: -1.0, dampening: 1.3, chaos: -0.5, repair: -0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 3.0,
        canonicalSmiles: "C1=CC(=CC=C1C2=NCC(=O)NC3=C2C=C(C=C3)[N+](=O)[O-])Cl",
        mw: 315.72,
        tpsa: 75.3
      }
    },
    { 
      id: 'diaz', 
      name: 'Diazepam', 
      class: 'depressant', 
      classLabel: 'Benzodiazepine', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.6, 
      effects: { arousal: -0.9, dampening: 1.2, chaos: -0.4, repair: -0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.93,
        volumeOfDistributionLkg: 1.1,
        canonicalSmiles: "CN1C(=O)CN=C(C2=C1C=CC(=C2)Cl)C3=CC=CC=C3",
        mw: 284.74,
        tpsa: 32.7
      }
    },
    { 
      id: 'loraz', 
      name: 'Lorazepam', 
      class: 'depressant', 
      classLabel: 'Benzodiazepine', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.75, 
      effects: { arousal: -1.1, dampening: 1.3, chaos: -0.5, repair: -0.2 },
      smilesPhysics: {
        bioavailabilityF: 0.85,
        volumeOfDistributionLkg: 1.3,
        canonicalSmiles: "C1=CC(=CC=C1C2=NC(C(=O)NC3=C2C=C(C=C3)Cl)O)Cl",
        mw: 321.16,
        tpsa: 52.9
      }
    },
    { 
      id: 'pregab', 
      name: 'Pregabalin', 
      class: 'depressant', 
      classLabel: 'Gabapentinoid', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.4, 
      effects: { arousal: -0.6, dampening: 0.9, chaos: -0.3, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 0.5,
        canonicalSmiles: "CC(C)CC(CN)CC(=O)O",
        mw: 159.23,
        tpsa: 63.3
      }
    },
    { 
      id: 'gaba', 
      name: 'Gabapentin', 
      class: 'depressant', 
      classLabel: 'Gabapentinoid', 
      svg: svgPhen, 
      halfLife: 'medium', 
      effects: { arousal: -0.5, dampening: 0.8, chaos: -0.2, repair: 0.0 },
      smilesPhysics: {
        bioavailabilityF: 0.60,
        volumeOfDistributionLkg: 0.8,
        canonicalSmiles: "C1CCC(CC1)(CN)CC(=O)O",
        mw: 171.24,
        tpsa: 63.3
      }
    },
    { 
      id: 'zolp', 
      name: 'Zolpidem', 
      class: 'depressant', 
      classLabel: 'Z-Drug', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.6, 
      effects: { arousal: -1.5, dampening: 1.6, chaos: 0.2, repair: -0.4 },
      smilesPhysics: {
        bioavailabilityF: 0.70,
        volumeOfDistributionLkg: 0.5,
        canonicalSmiles: "CC1=CC=C(C=C1)C2=CN3C(=C2CC(=O)N(C)C)C=C(C=N3)C",
        mw: 307.39,
        tpsa: 32.7
      }
    },
    { 
      id: 'zopic', 
      name: 'Zopiclone', 
      class: 'depressant', 
      classLabel: 'Z-Drug', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.6, 
      effects: { arousal: -1.4, dampening: 1.5, chaos: 0.1, repair: -0.3 },
      smilesPhysics: {
        bioavailabilityF: 0.77,
        volumeOfDistributionLkg: 1.3,
        canonicalSmiles: "CN1CCN(CC1)C(=O)OC2C3=NC=CN=C3C(=O)N2C4=NC=C(C=C4)Cl",
        mw: 388.81,
        tpsa: 79.1
      }
    },
    { 
      id: 'alc', 
      name: 'Ethanol (Alcohol)', 
      class: 'depressant', 
      classLabel: 'GABAergic', 
      svg: svgPhen, 
      halfLife: 'medium', 
      addictionPotential: 0.8, 
      effects: { arousal: -0.5, dampening: 1.0, chaos: 1.2, repair: -0.8 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 0.6,
        canonicalSmiles: "CCO",
        mw: 46.07,
        tpsa: 20.2
      }
    },
    { 
      id: 'fent', 
      name: 'Fentanyl', 
      class: 'depressant', 
      classLabel: 'Mu-Opioid Agonist', 
      svg: svgTricyclic, 
      halfLife: 'short', 
      addictionPotential: 1.0, 
      effects: { arousal: -1.5, dampening: 2.5, chaos: 0.2, repair: 1.2 },
      smilesPhysics: {
        bioavailabilityF: 0.92,
        volumeOfDistributionLkg: 4.0,
        canonicalSmiles: "CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3",
        mw: 336.47,
        tpsa: 23.6
      }
    },
    { 
      id: 'oxy', 
      name: 'Oxycodone', 
      class: 'depressant', 
      classLabel: 'Mu-Opioid Agonist', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      addictionPotential: 0.8, 
      effects: { arousal: -0.8, dampening: 1.8, chaos: 0.3, repair: 1.0 },
      smilesPhysics: {
        bioavailabilityF: 0.60,
        volumeOfDistributionLkg: 2.6,
        canonicalSmiles: "CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O",
        mw: 315.36,
        tpsa: 58.9
      }
    },
    
    // --- CHOLINERGICS & NMDA CHANNEL MODULATORS ---
    { 
      id: 'donepezil', 
      name: 'Donepezil', 
      class: 'stimulant', 
      classLabel: 'AChEI', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.4, dampening: 0.0, chaos: -0.1, repair: 0.2 },
      smilesPhysics: {
        bioavailabilityF: 1.00,
        volumeOfDistributionLkg: 12.0,
        canonicalSmiles: "COC1=C(C=C2C(=C1)CC(C2=O)CC3CCN(CC3)CC4=CC=CC=C4)OC",
        mw: 379.50,
        tpsa: 38.8
      }
    },
    { 
      id: 'memantine', 
      name: 'Memantine', 
      class: 'depressant', 
      classLabel: 'NMDA Antagonist', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: -0.1, dampening: 0.3, chaos: -0.2, repair: 0.3 },
      smilesPhysics: {
        bioavailabilityF: 1.00,
        volumeOfDistributionLkg: 10.0,
        canonicalSmiles: "CC12CC3CC(C1)(CC(C3)(C2)N)C",
        mw: 179.3,
        tpsa: 26.0
      }
    },
    { 
      id: 'dextro', 
      name: 'Dextromethorphan (DXM)', 
      class: 'depressant', 
      classLabel: 'NMDA Antagonist', 
      svg: svgTricyclic, 
      halfLife: 'medium', 
      effects: { arousal: 0.1, dampening: 0.6, chaos: 0.9, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.11,
        volumeOfDistributionLkg: 5.0,
        canonicalSmiles: "CN1CCC23C4CCCC3C1CC5=C2C(=CC=C5)OC",
        mw: 271.4,
        tpsa: 12.5
      }
    },

    // --- WITHDRAWAL & CORRECTIVE PROCEDURES ---
    { 
      id: 'sr17', 
      name: 'SR17-018', 
      class: 'corrective', 
      classLabel: 'Biased Opioid Agonist', 
      isBlue: true, 
      svg: svgIndole, 
      halfLife: 'long', 
      isCure: true, 
      targetAddiction: 'depressant', 
      reversesClass: 'depressant', 
      reversalEfficacy: 0.9, 
      effects: { arousal: 0.1, dampening: 0.2, chaos: -1.5, repair: 2.0 },
      smilesPhysics: {
        bioavailabilityF: 0.70,
        volumeOfDistributionLkg: 3.5,
        canonicalSmiles: "C1CN(CCC12COCC2)C(=O)C3=C(C=C(S3)Cl)Cl",
        mw: 362.27,
        tpsa: 42.4
      }
    },
    { 
      id: 'nrg01', 
      name: 'NRG-01 (DopaRestore)', 
      class: 'corrective', 
      classLabel: 'DA Plasticity Enhancer', 
      isBabelForge: true, 
      svg: svgPhen, 
      halfLife: 'long', 
      isCure: true, 
      targetAddiction: 'stimulant', 
      reversesClass: 'stimulant', 
      reversalEfficacy: 0.95, 
      effects: { arousal: 0.4, dampening: 0.0, chaos: -0.5, repair: 2.2 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 2.5,
        canonicalSmiles: "CN1CCC(CC1)C2=CC3=C(S2)C(=O)NC(=O)N3",
        mw: 251.31,
        tpsa: 54.1
      }
    },
    { 
      id: 'methadone', 
      name: 'Methadone', 
      class: 'depressant', 
      classLabel: 'Mu-Opioid Agonist', 
      svg: svgTricyclic, 
      halfLife: 'long', 
      addictionPotential: 0.5, 
      isCure: true, 
      targetAddiction: 'depressant', 
      effects: { arousal: -0.5, dampening: 1.5, chaos: -0.8, repair: 0.5 },
      smilesPhysics: {
        bioavailabilityF: 0.80,
        volumeOfDistributionLkg: 4.0,
        canonicalSmiles: "CCC(=O)C(CC(C)N(C)C)(C1=CC=CC=C1)C2=CC=CC=C2",
        mw: 309.45,
        tpsa: 20.3
      }
    },
    { 
      id: 'buprenorphine', 
      name: 'Buprenorphine', 
      class: 'depressant', 
      classLabel: 'Partial Opioid Agonist', 
      svg: svgTricyclic, 
      halfLife: 'long', 
      addictionPotential: 0.3, 
      isCure: true, 
      targetAddiction: 'depressant', 
      effects: { arousal: -0.2, dampening: 1.0, chaos: -1.0, repair: 0.8 },
      smilesPhysics: {
        bioavailabilityF: 0.30,
        volumeOfDistributionLkg: 2.8,
        canonicalSmiles: "CC1(C)CC2CC(C3=C2C=CC(=C3)O)N(CC4CC4)C1",
        mw: 467.64,
        tpsa: 41.5
      }
    },
    { 
      id: 'clonidine', 
      name: 'Clonidine', 
      class: 'corrective', 
      classLabel: 'Alpha-2 Agonist', 
      svg: svgPhen, 
      halfLife: 'medium', 
      isCure: true, 
      targetAddiction: 'stimulant', 
      reversesClass: 'stimulant', 
      reversalEfficacy: 0.75, 
      effects: { arousal: -0.8, dampening: 0.9, chaos: -0.6, repair: 0.1 },
      smilesPhysics: {
        bioavailabilityF: 0.75,
        volumeOfDistributionLkg: 2.1,
        canonicalSmiles: "C1CN=C(N1)NC2=C(C=CC=C2Cl)Cl",
        mw: 230.09,
        tpsa: 24.4
      }
    },
    { 
      id: 'acamprosate', 
      name: 'Acamprosate', 
      class: 'corrective', 
      classLabel: 'GABA/Glu Modulator', 
      svg: svgPhen, 
      halfLife: 'medium', 
      isCure: true, 
      targetAddiction: 'depressant', 
      reversesClass: 'depressant', 
      reversalEfficacy: 0.8, 
      effects: { arousal: -0.1, dampening: 0.4, chaos: -0.8, repair: 0.3 },
      smilesPhysics: {
        bioavailabilityF: 0.11,
        volumeOfDistributionLkg: 1.0,
        canonicalSmiles: "CC(=O)NCCCS(=O)(=O)O",
        mw: 181.21,
        tpsa: 74.6
      }
    },
    { 
      id: 'flumazenil', 
      name: 'Flumazenil', 
      class: 'corrective', 
      classLabel: 'GABA-A Antagonist', 
      svg: svgTricyclic, 
      halfLife: 'short', 
      targetClass: 'depressant', 
      reversesClass: 'depressant', 
      reversalEfficacy: 0.8, 
      effects: { arousal: 0.5, dampening: -0.4, chaos: 0.3, repair: 1.0 },
      smilesPhysics: {
        bioavailabilityF: 0.50,
        volumeOfDistributionLkg: 1.1,
        canonicalSmiles: "CCOC(=O)C1=CN=C2N1C(=O)CN=C(C3=C2C=C(C=C3)F)C",
        mw: 303.29,
        tpsa: 58.4
      }
    },
    { 
      id: 'nac', 
      name: 'N-Acetylcysteine (NAC)', 
      class: 'corrective', 
      classLabel: 'Glutamate Modulator', 
      svg: svgPhen, 
      halfLife: 'short', 
      targetClass: 'multiple', 
      reversesClass: 'multiple', 
      reversalEfficacy: 0.6, 
      effects: { arousal: 0.0, dampening: 0.2, chaos: -0.4, repair: 1.2 },
      smilesPhysics: {
        bioavailabilityF: 0.10,
        volumeOfDistributionLkg: 0.4,
        canonicalSmiles: "CC(=O)N[C@@H](CS)C(=O)O",
        mw: 163.20,
        tpsa: 64.3
      }
    },
    { 
      id: 'agmatine', 
      name: 'Agmatine Sulfate', 
      class: 'corrective', 
      classLabel: 'NMDA Modulator / NOSI', 
      svg: svgPhen, 
      halfLife: 'medium', 
      targetClass: 'multiple', 
      reversesClass: 'multiple', 
      reversalEfficacy: 0.7, 
      effects: { arousal: -0.1, dampening: 0.3, chaos: -0.3, repair: 1.4 },
      smilesPhysics: {
        bioavailabilityF: 0.20,
        volumeOfDistributionLkg: 0.8,
        canonicalSmiles: "C(CCN=C(N)N)CN",
        mw: 130.20,
        tpsa: 84.7
      }
    },
    { 
      id: 'galantamine', 
      name: 'Galantamine', 
      class: 'corrective', 
      classLabel: 'AChE Inhibitor / PAM', 
      svg: svgTricyclic, 
      halfLife: 'long', 
      targetClass: 'cannabinoid', 
      reversesClass: 'cannabinoid', 
      reversalEfficacy: 0.75, 
      effects: { arousal: 0.4, dampening: 0.0, chaos: -0.1, repair: 1.1 },
      smilesPhysics: {
        bioavailabilityF: 0.90,
        volumeOfDistributionLkg: 1.8,
        canonicalSmiles: "CN1CCC23C=CC(CC2OC4=C(CC1)C=CC(=C43)OC)O",
        mw: 287.35,
        tpsa: 41.9
      }
    },

    // --- LIFESTYLE & HOLISTIC INTERVENTIONS (Graceful Degradation / SVGs) ---
    { id: 'z2cardio', name: 'Zone 2 Cardio', class: 'lifestyle', classLabel: 'Aerobic Exercise', isLifestyle: true, svg: svgPhen, halfLife: 'medium', effects: { arousal: 0.4, dampening: -0.2, chaos: -0.4, repair: 0.8 } },
    { id: 'hiit', name: 'HIIT', class: 'lifestyle', classLabel: 'Anaerobic Exercise', isLifestyle: true, svg: svgPhen, halfLife: 'short', effects: { arousal: 1.2, dampening: -0.1, chaos: 0.2, repair: 0.5 } },
    { id: 'meditation', name: 'Mindfulness Meditation', class: 'lifestyle', classLabel: 'Contemplative Practice', isLifestyle: true, svg: svgIndole, halfLife: 'short', effects: { arousal: -0.3, dampening: 0.5, chaos: -0.6, repair: 0.7 } },
    { id: 'cbt', name: 'CBT / Talk Therapy', class: 'lifestyle', classLabel: 'Psychotherapy', isLifestyle: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.9, repair: 1.2 } },
    { id: 'keto', name: 'Ketogenic Diet', class: 'lifestyle', classLabel: 'Metabolic Therapy', isLifestyle: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.2, dampening: 0.3, chaos: -0.3, repair: 0.6 } },
    { id: 'sleep', name: 'Optimized Sleep (8hr+)', class: 'lifestyle', classLabel: 'Circadian Rhythm', isLifestyle: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -0.2, dampening: 0.4, chaos: -1.0, repair: 1.8 } },
    { id: 'omega3', name: 'Omega-3 (EPA/DHA)', class: 'lifestyle', classLabel: 'Nutritional Support', isLifestyle: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.2, repair: 0.4 } },
    { id: 'sauna', name: 'Sauna / Heat Therapy', class: 'lifestyle', classLabel: 'Thermal Stress', isLifestyle: true, svg: svgTricyclic, halfLife: 'short', effects: { arousal: 0.3, dampening: 0.4, chaos: -0.1, repair: 0.6 } },
    { id: 'hbot', name: 'Hyperbaric Oxygen (HBOT)', class: 'lifestyle', classLabel: 'Oxygen Therapy', isLifestyle: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 0.1, dampening: 0.1, chaos: -0.5, repair: 1.6 } },
    { id: 'coldplunge', name: 'Cold Plunge / Immersion', class: 'lifestyle', classLabel: 'Thermal Stress', isLifestyle: true, svg: svgPhen, halfLife: 'short', effects: { arousal: 0.8, dampening: -0.2, chaos: -0.3, repair: 0.9 } },
    { id: 'breathwork', name: 'Somatic Breathwork', class: 'lifestyle', classLabel: 'Contemplative Practice', isLifestyle: true, svg: svgIndole, halfLife: 'short', effects: { arousal: -0.5, dampening: 0.8, chaos: -0.7, repair: 1.0 } },
    { id: 'lionmane', name: 'Lion\'s Mane Mushroom', class: 'lifestyle', classLabel: 'Nutritional Support', isLifestyle: true, svg: svgIndole, halfLife: 'long', effects: { arousal: 0.2, dampening: 0.0, chaos: -0.2, repair: 1.4 } },

    // --- NEUROMODULATION & SURGICAL CLINICAL PROCEDURES ---
    { id: 'tms', name: 'Transcranial Magnetic Stimulation', class: 'novel', classLabel: 'Neuromodulation', isBlue: true, svg: svgPhen, halfLife: 'long', effects: { arousal: 0.8, dampening: -0.1, chaos: -0.5, repair: 1.5 } },
    { id: 'dbs', name: 'Deep Brain Stimulation (DBS)', class: 'novel', classLabel: 'Surgical Implant', isBlue: true, svg: svgTricyclic, halfLife: 'long', effects: { arousal: 1.0, dampening: 1.2, chaos: -1.0, repair: 0.5 } },
    { id: 'vns', name: 'Vagus Nerve Stimulation (VNS)', class: 'novel', classLabel: 'Surgical Implant', isBlue: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -0.2, dampening: 0.6, chaos: -0.8, repair: 0.8 } },
    { id: 'ect', name: 'Electroconvulsive Therapy (ECT)', class: 'novel', classLabel: 'Neuromodulation', svg: svgPhen, halfLife: 'medium', effects: { arousal: -0.5, dampening: 1.5, chaos: 1.0, repair: 2.0 } },
    { id: 'tcca', name: 'Targeted Cliques-Complex Ablation', class: 'novel', classLabel: 'HIFU Ablation', isBabelForge: true, svg: svgIndole, halfLife: 'long', effects: { arousal: -1.5, dampening: 1.5, chaos: -2.0, repair: 0.0 } },
];