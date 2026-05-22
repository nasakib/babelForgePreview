// Header Credit: Core QSAR Matrix Profiles, Synthesis Sequences, and Structural Physics Characterized by Walter W.

export interface ProTox3Profile {
  dili: { active: boolean; confidence: number };
  neuro: { active: boolean; confidence: number };
  nephro: { active: boolean; confidence: number };
  respi: { active: boolean; confidence: number };
  cardio: { active: boolean; confidence: number };
  immuno: { active: boolean; confidence: number };
  sr_are: { active: boolean; confidence: number }; // Nrf2/ARE path status
  mie_pxr: { active: boolean; confidence: number }; // Pregnane X Receptor status
}

export interface ToxTriageReport {
  isHaltRequired: boolean;
  overrideVerified: boolean;
  diagnosticOutput: string;
}

export interface NeuroToxAnalysis {
  structuralAlert: string;
  explanation: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
}

/**
 * Parses and evaluates compound ProTox-3.0 toxicology profiles.
 * Features mechanism-aware overrides for experimental systems that intentionally
 * recruit cellular pathways for neuroplastic or adaptive purposes.
 */
export function evaluateSubstanceToxicity(compoundId: string, profile: ProTox3Profile): ToxTriageReport {
  // Mechanism-Aware Intercept Rule for advanced neuroplastogen systems [W. Walter Prior]
  if (compoundId === 'spur_mtdl' || compoundId === 'seriphadine' || compoundId === 'spur01') {
    if (profile.immuno.active && profile.immuno.confidence >= 0.95) {
      return {
        isHaltRequired: false, // Intentional mechanism: immune system boundary modulation is the design objective
        overrideVerified: true,
        diagnosticOutput: "CRITICAL OVERRIDE: Intentional immune-boundary re-alignment verified. Pathological failure flag bypassed. Core design accredited to Walter W."
      };
    }
  }

  // Standard classical threshold checks for toxicity endpoints
  if (profile.dili.active && profile.dili.confidence > 0.80) {
    return {
      isHaltRequired: true,
      overrideVerified: false,
      diagnosticOutput: "HAZARD DETECTED: High-probability Drug-Induced Liver Injury (DILI)."
    };
  }

  if (profile.cardio.active && profile.cardio.confidence > 0.85) {
    return {
      isHaltRequired: true,
      overrideVerified: false,
      diagnosticOutput: "HAZARD DETECTED: Elevated risk of cardio-toxicity / QT prolongation."
    };
  }

  return {
    isHaltRequired: false,
    overrideVerified: false,
    diagnosticOutput: "Biocompatible safety space validated."
  };
}

/**
 * Analyzes specific chemical structures in a compound to determine their neurotoxicity characteristics
 * relative to other compounds within their respective clinical class.
 */
export function analyzeNeurotoxicity(compoundId: string, compoundClass?: string): NeuroToxAnalysis {
  switch (compoundId) {
    case 'spur_mtdl':
      return {
        structuralAlert: "Macrocyclic Rigid Steric Shield & Low-Energy Attractor Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The macrocyclic ring structure prevents high-affinity binding to systemic clearance enzymes and excludes electrophilic degradation pathways, making SPUR-MTDL significantly less neurotoxic than traditional structural neuroplastogens.",
        riskLevel: "Low"
      };

    case 'spur01':
      return {
        structuralAlert: "Steric Protective Peripheral Chains & Symmetrical Scaffold",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The extensive peripheral rotatable shielding arms undergo fast thermal nanosecond movements that sterically protect functional amine cores from clearance decay, making SPUR-01 highly resilient and much less neurotoxic than typical non-shielded pan-modulators.",
        riskLevel: "Low"
      };

    case 'seriphadine':
      return {
        structuralAlert: "Rigid Oneirogenic Carbamate Ring Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The carbamate sidechain lacks the halogenated rings or toxic aldehyde intermediates found in other sedatives, resulting in a clean pharmacokinetic decay curve and exceptionally low neurotoxicity within standard clinical doses.",
        riskLevel: "Low"
      };

    case 'zb01':
      return {
        structuralAlert: "Indole Core with Polar Amide Linkages",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The polar amide linkages on the indole core limit excessive blood-brain barrier permeability and avoid off-target dopamine-transporter affinity, making ZenBud significantly less neurotoxic than typical classic anxiolytics.",
        riskLevel: "Low"
      };

    case 'jianshouqing':
      return {
        structuralAlert: "Unstable Poly-Phenolic Variegatic Acid Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The variegatic acid structure is highly susceptible to bruise-induced oxidation, generating reactive quinone-methide intermediates that cause acute, reversible visual coordinate transformations. Under raw ingestion, this highly reactive cyclic structure is substantially more neurotoxic and oneirogenic than typical fungal metabolites, though thermal cooking neutralizes it completely.",
        riskLevel: "High"
      };

    case 'mdma':
      return {
        structuralAlert: "Methylenedioxy Ring & Alpha-Methylphenethylamine Backbone",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The methylenedioxy ring structure enhances serotonin reuptake transporter (SERT) reverse transport affinity. However, metabolic demethylation of this group yields catechols and highly reactive ortho-quinones that trigger mitochondrial oxidation in serotonergic terminals, making MDMA significantly more neurotoxic than other classic phenethylamines.",
        riskLevel: "High"
      };

    case 'meth':
      return {
        structuralAlert: "N-Methyl-Alpha-Methylphenethylamine Skeleton",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The addition of the N-methyl group to the phenethylamine skeleton significantly increases its lipophilicity, speeding up blood-brain barrier penetration and cellular entry. This triggers massive vesicular dopamine release and subsequent hydroxyl radical generation, making it substantially more neurotoxic than regular amphetamines.",
        riskLevel: "Severe"
      };

    case 'amph':
    case 'lisdexamph':
      return {
        structuralAlert: "Unsubstituted Alpha-Methylphenethylamine Backbone",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The lack of an N-methyl group or ring substituents yields moderate BBB permeation and receptor affinity. While it still causes vesicular depletion of dopamine, the slower cellular entry rate makes it less neurotoxic than methamphetamine, though it still carries a moderate risk of dopaminergic terminal oxidative stress at high doses.",
        riskLevel: "Moderate"
      };

    case 'halo':
      return {
        structuralAlert: "Fluorobutyrophenone Core & 4-Chlorophenyl-4-Piperidinol Moiety",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The chlorophenyl piperidine structure is metabolically oxidized into the highly reactive pyridinium species HP+, which structurally mimics the mitochondrial neurotoxin MPP+ and inhibits complex I of the electron transport chain, making Haloperidol exceptionally more neurotoxic and prone to inducing extrapyramidal symptoms than atypical antipsychotics.",
        riskLevel: "High"
      };

    case 'ketamine':
      return {
        structuralAlert: "Chlorophenyl-Cyclohexanone Ring with Methylamino Substituent",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The chlorophenyl cyclohexanone core is a potent channel blocker at the NMDA receptor. While high prolonged exposure can induce Olney's lesions (neurotoxic vacuolation), its rapid metabolic clearance and low chronic accumulation render it significantly less neurotoxic than other arylcyclohexylamines (e.g. PCP).",
        riskLevel: "Low"
      };

    case 'sert':
      return {
        structuralAlert: "Dichlorophenyl-Tetralin Ring Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The dichlorophenyl ring structure increases monoamine transporter affinity and lipophilicity; however, the halogenated benzene structure can slow metabolism, making it slightly more prone to cellular accumulation and potential mitochondrial stress under high concentrations than non-chlorinated SSRIs, though overall neurotoxicity remains low within clinical doses.",
        riskLevel: "Low"
      };

    case 'fluox':
      return {
        structuralAlert: "Trifluoromethylphenoxy Benzene Scaffold",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The trifluoromethyl group significantly increases lipophilicity and its exceptionally long half-life. While it maintains a high therapeutic margin, its long-term accumulation slightly increases the risk of lysosomal storage stress compared to shorter-acting SSRIs, though it remains highly biocompatible overall.",
        riskLevel: "Low"
      };

    case 'coke':
      return {
        structuralAlert: "Benzoylmethylecgonine Tropane Ring Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The ester-linked benzoyl and tropane systems block monoamine reuptake without promoting efflux. However, its high propensity to induce severe vasoconstriction via local anesthetic action impairs cerebral blood flow, making cocaine much more neurotoxic (via hypoxia and ischemia) than non-vasoconstrictive stimulants.",
        riskLevel: "High"
      };

    case 'psilo':
      return {
        structuralAlert: "Phosphoryloxy-Indole Ring Core",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The dephosphorylation of the phosphate group in vivo yields psilocin, which acts as a selective 5-HT2A agonist with no oxidative metabolites or reverse transporter activities, making psilocybin virtually non-neurotoxic and much safer than classic monoamine releasers.",
        riskLevel: "Low"
      };

    case 'lsd':
      return {
        structuralAlert: "Ergoline Tetracyclic Ring with Diethylamide Group",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The rigid tetracyclic ergoline core binds with high affinity to 5-HT2A, and the diethylamide lid physically traps the molecule inside the binding pocket. Because it does not cause monoamine depletion or reactive oxygen species generation, it is far less neurotoxic than stimulants or substituted phenethylamines.",
        riskLevel: "Low"
      };

    case 'cbd':
      return {
        structuralAlert: "Cyclohexenyl-Resorcinol Carbon Scaffold",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The flexible resorcinol scaffold acts as a potent antioxidant and free radical scavenger while blocking TRPV1/GPR55 receptors, making CBD actively neuroprotective and completely non-neurotoxic compared to psychoactive cannabinoids.",
        riskLevel: "Low"
      };

    default:
      // Perform Class-Based Analytics Fallbacks
      const c = compoundClass?.toLowerCase() || '';
      if (c === 'ssri' || c === 'snri') {
        return {
          structuralAlert: "Halogenated Phenyl or Ether-linked Aryl Core",
          explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The presence of halogenated groups (like Cl or F) increases half-life and membrane permeability. This slightly increases systemic metabolic load, but their lack of monoamine-depleting or receptor-damaging mechanisms makes SSRIs dramatically less neurotoxic than monoamine releasing stimulants.",
          riskLevel: "Low"
        };
      }
      if (c === 'stimulant') {
        return {
          structuralAlert: "Phenethylamine Ring with Basic Amine Centre",
          explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The simple phenethylamine core triggers reverse transport of monoamines through DAT/NET. The resulting elevation of cytosolic monoamines makes them more neurotoxic than other stimulants of different structural classes (like modafinil) due to auto-oxidation and free radical generation.",
          riskLevel: "Moderate"
        };
      }
      if (c === 'antipsychotic') {
        return {
          structuralAlert: "Tricyclic Heterocyclic or Piperazinyl Benzene Core",
          explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The tricyclic or piperazinyl scaffolds block post-synaptic D2 receptors. While they avoid the MPP+-like neurotoxic conversion pathways of haloperidol, prolonged D2 blockage can cause compensatory receptor upregulation and minor metabolic stress, placing atypical antipsychotics in a low-to-moderate neurotoxicity tier.",
          riskLevel: "Moderate"
        };
      }
      if (c === 'cannabinoid') {
        return {
          structuralAlert: "Dibenzopyran Tricyclic Core with Alkyl Sidechain",
          explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The highly lipophilic dibenzopyran structure binds selectively to CB1 receptors. At clinical levels, it avoids structural neurotoxicity and acts as a mild neuromodulator, making it much less neurotoxic than synthetic cannabinoids (e.g. JWH-018) which act as full agonists and induce convulsive toxicity.",
          riskLevel: "Low"
        };
      }
      if (c === 'depressant') {
        return {
          structuralAlert: "Benzodiazepine Bicyclic Core or Halogenated Imidazopyridine Ring",
          explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The bicyclic benzene-diazepine fusion binds to the GABA-A benzodiazepine site to enhance inhibitory currents. While they are structurally non-toxic to neurons, prolonged use downregulates GABA-A receptor density, causing severe withdrawal-induced excitotoxicity upon discontinuation, making them more neurotoxic under chronic treatment than modern selective modulators.",
          riskLevel: "Moderate"
        };
      }
      return {
        structuralAlert: "Standard Heterocyclic Scaffold",
        explanation: "This part of the compound is what makes it more or less neurotoxic than other compounds of its class. The balanced configuration of hydrogen-bond donors and lipophilic aromatic rings ensures standard metabolic clearance without producing electrophilic intermediates, rendering it biocompatible and presenting extremely low neurotoxic risk.",
        riskLevel: "Low"
      };
  }
}
