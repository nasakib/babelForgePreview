import type { Pathology } from "./topology";
import type { PharmaVectors, PatientParams } from "./diagnosis";
import type { PatientProfile } from "@/lib/patient/profile";

export interface CognitiveDomains {
  focus: number;             // 0..100
  affectiveValence: number;  // 0..100
  perceptualEntropy: number; // 0..100
  autonomicTone: number;     // 0..100
}

export interface SubjectiveProfile {
  qualiaClass: string;
  qualiaDescription: string;
  domains: CognitiveDomains;
  tags: string[];
  narrative: string;
}

export function translateSubjective(
  states: Pathology[],
  vectors: PharmaVectors,
  patient: PatientParams,
  reportData: { R: number; K: number; noise: number; integrity: number },
  stack: any[] = []
): SubjectiveProfile {
  // Extract active molecules in stack
  const activeIds = new Set<string>();
  if (stack && Array.isArray(stack)) {
    for (const item of stack) {
      const dose = item.dose ?? item.currentIntensity ?? 0;
      if (dose > 0) {
        activeIds.add(item.id);
      }
    }
  }

  // Retrieve full patient profile if available
  const profile = patient.profile;
  const vitals = profile?.vitals ?? {};
  const labs = profile?.labs ?? {};
  const lifestyle = profile?.lifestyle ?? {};
  const pgx = (profile?.pgx ?? {}) as any;
  const psych = profile?.psychometric ?? {};
  const demo = profile?.demographics ?? {};

  // ---------------------------------------------------------------------------
  // 1. CALCULATE COGNITIVE DOMAINS
  // ---------------------------------------------------------------------------
  
  // A. FOCUS (Executive functioning, dopamine/acetylcholine/arousal driven)
  let focus = 70;
  focus += vectors.arousal * 15;
  focus -= vectors.dampening * 8;
  if (states.includes("DEPRESSION")) focus -= 20;
  if (states.includes("ADDICTION")) focus -= 15;
  if (states.includes("WITHDRAWAL_OPIOID")) focus -= 30;
  if (states.includes("PTSD")) focus -= 10;
  
  // Specific stimulant bonuses
  if (activeIds.has("modaf") || activeIds.has("armodaf")) focus += 18;
  if (activeIds.has("mph") || activeIds.has("dexmph")) focus += 22;
  if (activeIds.has("lisdexamph") || activeIds.has("amph")) focus += 25;
  if (activeIds.has("caffeine")) focus += 8;
  if (activeIds.has("ss20")) focus += 28; // SynaptoStim

  // Deep Patient Profile Modifiers for Focus
  if (lifestyle.sleepHours !== undefined) {
    if (lifestyle.sleepHours < 6.5) {
      // Focus penalty for sleep deprivation
      focus -= (6.5 - lifestyle.sleepHours) * 8;
    } else if (lifestyle.sleepHours > 8.0) {
      focus += 3; // restoration bonus
    }
  }
  if (lifestyle.perceivedStress !== undefined && lifestyle.perceivedStress >= 7) {
    focus -= (lifestyle.perceivedStress - 5) * 3;
  }
  if (psych.moca !== undefined && psych.moca < 26) {
    // Cognitive impairment penalty
    focus -= (26 - psych.moca) * 5;
  }
  if (labs.vitB12 !== undefined && labs.vitB12 < 250) {
    focus -= 12; // neurological fatigue from B12 sub-optimal myelination
  }
  if (lifestyle.caffeineMgPerDay !== undefined) {
    if (lifestyle.caffeineMgPerDay > 500) {
      focus -= 8; // excessive caffeine jitter/focus fragmentation
    } else if (lifestyle.caffeineMgPerDay >= 100) {
      focus += 4;
    }
  }

  // COMT focus multiplier
  let comtFocusMultiplier = 1.0;
  if (pgx.comt === "Met/Met") {
    comtFocusMultiplier = 1.15;
  } else if (pgx.comt === "Val/Val") {
    comtFocusMultiplier = 0.88;
  }
  focus = Math.round(focus * comtFocusMultiplier);

  // Focus penalty for extreme chaos (hallucination/delirium)
  if (vectors.chaos > 1.2) focus -= (vectors.chaos - 1.2) * 20;
  focus = Math.max(5, Math.min(100, Math.round(focus)));

  // B. AFFECTIVE VALENCE (Emotional baseline and emotional capacity)
  let valence = 65;
  valence -= states.includes("DEPRESSION") ? 35 : 0;
  valence -= states.includes("PTSD") ? 20 : 0;
  valence -= states.includes("WITHDRAWAL_OPIOID") ? 40 : 0;
  valence -= states.includes("ADDICTION") ? 10 : 0;

  valence += vectors.repair * 15; // neuroplasticity boosts valence long-term
  valence += vectors.arousal * 4;  // dopamine booster

  if (activeIds.has("zb01")) valence += 25;   // ZenBud
  if (activeIds.has("nx44")) valence += 20;   // NeuroX
  if (activeIds.has("mdma")) valence += 35;   // Empathogen
  if (activeIds.has("psilo")) valence += 15;  // Classic psychedelic mood lift
  if (activeIds.has("cbt") && states.includes("DEPRESSION")) valence += 15; // CBT therapy

  // Deep Patient Profile Modifiers for Valence
  if (psych.phq9 !== undefined) {
    if (psych.phq9 >= 20) valence -= 30; // Severe clinical depression locks valence
    else if (psych.phq9 >= 15) valence -= 22;
    else if (psych.phq9 >= 10) valence -= 15;
    else if (psych.phq9 >= 5) valence -= 6;
  }
  if (psych.gad7 !== undefined && psych.gad7 >= 10) {
    valence -= 10; // anxiety emotional burden
  }
  if (psych.pcl5 !== undefined && psych.pcl5 >= 33) {
    valence -= 12; // PTSD hyper-vigilance burden
  }
  if (labs.vitD !== undefined && labs.vitD < 30) {
    valence -= 8; // sub-optimal vitamin D lowers baseline serotonin synthesis
  }
  if (lifestyle.sleepQuality !== undefined && lifestyle.sleepQuality < 5) {
    valence -= (5 - lifestyle.sleepQuality) * 4;
  }
  if (lifestyle.drinksPerWeek !== undefined && lifestyle.drinksPerWeek > 14) {
    valence -= 10; // post-alcohol reward suppression
  }

  // Heavy suppression/toxicity reduces valence
  if (vectors.dampening > 2.0) valence -= (vectors.dampening - 2.0) * 15;
  if (vectors.chaos > 2.0) valence -= (vectors.chaos - 2.0) * 10;
  valence = Math.max(0, Math.min(100, Math.round(valence)));

  // C. PERCEPTUAL ENTROPY (Sensory chaos, hallucinogenic state, disintegration)
  let entropy = 10;
  entropy += vectors.chaos * 25;
  entropy += reportData.noise * 40;

  if (activeIds.has("lsd")) entropy += 60;
  if (activeIds.has("psilo")) entropy += 50;
  if (activeIds.has("jianshouqing")) entropy += 70;
  if (activeIds.has("ketamine")) entropy += 40;
  if (activeIds.has("thc") || activeIds.has("thcp") || activeIds.has("thco")) entropy += 15;
  
  // Antipsychotics suppress sensory entropy
  if (activeIds.has("halo") || activeIds.has("cloz") || activeIds.has("olan")) entropy -= 25;
  if (activeIds.has("arip") || activeIds.has("queti")) entropy -= 15;
  
  // Deep Patient Profile Modifiers for Entropy
  if (lifestyle.perceivedStress !== undefined && lifestyle.perceivedStress >= 8) {
    entropy += 8; // stress-induced sensory hyper-sensitivity
  }
  if (psych.gad7 !== undefined && psych.gad7 >= 15) {
    entropy += 6; // acute anxiety sensory overload
  }
  if (labs.vitB12 !== undefined && labs.vitB12 < 180) {
    entropy += 5; // paresthesia/sensory glitches from severe B12 deficiency
  }

  entropy = Math.max(0, Math.min(100, Math.round(entropy)));

  // D. AUTONOMIC TONE (Sympathetic excitation vs parasympathetic suppression. 50 = Perfect Balance)
  let autonomic = 50;
  autonomic += vectors.arousal * 18;
  autonomic -= vectors.dampening * 20;
  if (states.includes("PTSD")) autonomic += 20;
  if (states.includes("WITHDRAWAL_OPIOID")) autonomic += 35;
  
  // Specific mitigators
  if (activeIds.has("clonidine")) autonomic -= 18;
  if (activeIds.has("breathwork")) autonomic -= 12;
  if (activeIds.has("meditation")) autonomic -= 8;
  if (activeIds.has("sleep")) autonomic -= 10;
  if (activeIds.has("alpraz") || activeIds.has("clonaz") || activeIds.has("loraz")) autonomic -= 25;

  // Deep Patient Profile Modifiers for Autonomic Tone
  if (vitals.hrRest !== undefined) {
    if (vitals.hrRest > 85) {
      autonomic += Math.min(25, (vitals.hrRest - 70) * 0.7); // elevated HR sympathetic shift
    } else if (vitals.hrRest < 55) {
      autonomic -= 5; // vagal/parasympathetic athletic tone
    }
  }
  if (vitals.hrvRmssd !== undefined) {
    if (vitals.hrvRmssd < 25) {
      autonomic += 15; // low vagal reserve = high autonomic tension
    } else if (vitals.hrvRmssd > 60) {
      // Vagal safety buffer dampens sympathetic surges
      const dev = autonomic - 50;
      if (dev > 0) autonomic = 50 + (dev * 0.6);
    }
  }
  if (vitals.sbp !== undefined && vitals.sbp > 140) {
    autonomic += 8; // vascular sympathetic load
  }
  if (lifestyle.perceivedStress !== undefined && lifestyle.perceivedStress >= 6) {
    autonomic += (lifestyle.perceivedStress - 5) * 3;
  }
  if (psych.gad7 !== undefined && psych.gad7 >= 12) {
    autonomic += 10;
  }
  if (psych.pcl5 !== undefined && psych.pcl5 >= 38) {
    autonomic += 12;
  }
  if (lifestyle.caffeineMgPerDay !== undefined && lifestyle.caffeineMgPerDay > 400) {
    autonomic += 10; // caffeinism sympathetic shift
  }

  autonomic = Math.max(0, Math.min(100, Math.round(autonomic)));

  // ---------------------------------------------------------------------------
  // 2. DETECT QUALIA CLASS & DESCRIPTION
  // ---------------------------------------------------------------------------
  let qualiaClass = "Healthy Homeostatic Coherence";
  let qualiaDescription = "Network entrainment within normal physiological limits. Baseline connectivity is stable.";

  if (vectors.dampening > 1.6 && autonomic < 30) {
    qualiaClass = "CNS Suppression & Somnolence";
    qualiaDescription = "GABAergic and down-regulatory networks dominate. Slow-wave entrainment reduces cognitive latency and reflexes.";
  } else if (vectors.arousal > 1.8 && autonomic > 70) {
    qualiaClass = "Adrenergic Sympathetic Hyperarousal";
    qualiaDescription = "High monoaminergic firing rates shifts power spectral density to beta/gamma bands. Increased somatic stress.";
  } else if (entropy > 55) {
    qualiaClass = "Cortical High-Entropy Entrainment";
    qualiaDescription = "Serotonergic 5-HT2A activation disrupts default cortical hierarchies. Connectome micro-cliques expand dynamically.";
  } else if (states.includes("WITHDRAWAL_OPIOID") && autonomic > 75) {
    qualiaClass = "Hyper-Adrenergic Receptor Crisis";
    qualiaDescription = "Abrupt cessation of inhibitory mu-opioid signalling triggers massive sympathetic discharge and structural chaos.";
  } else if (states.includes("DEPRESSION") && reportData.integrity < 50 && vectors.repair < 0.4) {
    qualiaClass = "Default Mode Network Rigidity";
    qualiaDescription = "Hyper-coherent sub-cliques within the DMN lock the connectome into rigid self-referential negative feedback loops.";
  } else if (states.includes("PTSD") && autonomic > 68 && vectors.dampening < 0.4) {
    qualiaClass = "Hyper-Sensitized Amygdaloid Resonance";
    qualiaDescription = "Sensory integration centers exhibit pathological coupling to threat-detection sub-networks. Autonomic instability.";
  } else if (reportData.R > 0.85 && reportData.integrity > 85 && vectors.repair > 0.8 && vectors.chaos < 0.4) {
    qualiaClass = "Optimal Synaptic Integration (Flow State)";
    qualiaDescription = "Maximum entrainment of structural and functional connectome layers. Widened Arnold tongues with optimized neuroplastic growth.";
  } else if (reportData.integrity > 75 && vectors.repair > 0.4 && vectors.chaos < 0.3) {
    qualiaClass = "Coherent Connectome Stabilization";
    qualiaDescription = "Pathological deviations are actively corrected. Connectome alignment converges toward healthy baseline.";
  }

  // ---------------------------------------------------------------------------
  // 3. GENERATE STATE TAGS
  // ---------------------------------------------------------------------------
  const tags: string[] = [];
  if (valence < 40) tags.push("Anhedonia");
  if (valence > 75) tags.push("Emotional Serenity");
  if (focus > 82 && reportData.R > 0.82) tags.push("Flow State");
  if (focus < 40) tags.push("Cognitive Fatigue");
  if (entropy > 50) tags.push("Synesthesia");
  if (entropy > 25 && entropy <= 50) tags.push("Expanded Bandwidth");
  if (vectors.repair > 1.2) tags.push("Accelerated Plasticity");
  if (autonomic > 72) tags.push("Tachycardia Risk");
  if (autonomic < 28) tags.push("Soporific");
  if (autonomic >= 42 && autonomic <= 58) tags.push("Autonomic Balance");
  if (states.length > 0 && reportData.integrity < 40) tags.push("Connectome Decay");
  if (activeIds.has("sr17") || activeIds.has("nrg01")) tags.push("Active Repair Reversion");
  if (activeIds.has("spur01")) {
    tags.push("TrkB Agonism");
    tags.push("Epigenetic Rewrite");
  }

  // Deep Patient Profile Tags
  if (labs.vitD !== undefined && labs.vitD < 30) tags.push("Vit D Deficit");
  if (labs.vitB12 !== undefined && labs.vitB12 < 200) tags.push("Vit B12 Deficit");
  if (vitals.hrvRmssd !== undefined && vitals.hrvRmssd < 25) tags.push("Vagal Depletion");
  if (psych.phq9 !== undefined && psych.phq9 >= 15) tags.push("Severe DMN Lock");
  if (psych.gad7 !== undefined && psych.gad7 >= 15) tags.push("Acute Hyperarousal");
  if (pgx.cyp2d6 === "PM" || pgx.cyp2c19 === "PM") tags.push("CYP Poor Metabolizer");
  if (demo.pregnant === true) tags.push("Gestational Caution");

  // Keep max 6 tags
  const finalTags = tags.slice(0, 6);
  if (finalTags.length === 0) finalTags.push("Homeostasis");

  // ---------------------------------------------------------------------------
  // 4. PROCEDURALLY GENERATED CLINICAL NARRATIVE
  // ---------------------------------------------------------------------------
  let narrative = "";

  // Segment 1: Pathology & Baseline Connectome Physics
  if (states.length === 0) {
    narrative += "In the absence of active pathology, the biological connectome exhibits a healthy homeostatic equilibrium. Neuronal synchronization oscillates within the optimal Kuramoto reference boundary, maintaining an integrated default mode network. ";
  } else {
    narrative += `The presence of ${states.map(s => s.toLowerCase()).join(" and ")} pathology induces severe topological deviations. `;
    if (states.includes("DEPRESSION")) {
      narrative += "Default Mode Network hyper-connectivity locks the patient into self-referential rumination, while neural plasticity and BDNF synthesis are chronically suppressed. ";
    }
    if (states.includes("PTSD")) {
      narrative += "Limbic hyper-resonance hyper-sensitizes the autonomic nervous system, leading to sustained adrenergic over-firing and autonomic tension. ";
    }
    if (states.includes("WITHDRAWAL_OPIOID") || states.includes("ADDICTION")) {
      narrative += "Dopaminergic and GABAergic receptor structures are heavily dysregulated due to chronic exogenous ligand exposure, resulting in structural edge-atrophy and reward pathway fragmentation. ";
    }
  }

  // Segment 2: Deep Clinical Patient Profile Integration
  if (profile) {
    let patientDetails: string[] = [];
    
    // Autonomic/HRV analysis
    if (vitals.hrvRmssd !== undefined && vitals.hrvRmssd < 25) {
      patientDetails.push(`Baseline physiological reserve is compromised by a severely depressed heart-rate variability (RMSSD = ${vitals.hrvRmssd} ms), representing advanced sympathetic tone domination and a highly fragile stress boundary.`);
    } else if (vitals.hrvRmssd !== undefined && vitals.hrvRmssd > 60) {
      patientDetails.push(`Excellent vagal tone (RMSSD = ${vitals.hrvRmssd} ms) reflects high parasympathetic reserves, shielding the patient's connectome from chronic adrenergic shock.`);
    }

    if (vitals.hrRest !== undefined && vitals.hrRest > 85) {
      patientDetails.push(`A resting heart rate of ${vitals.hrRest} bpm suggests baseline somatic hyperarousal, lowering the threshold for vascular stress.`);
    }

    // Psychometrics analysis
    if (psych.phq9 !== undefined && psych.phq9 >= 15) {
      patientDetails.push(`A clinical PHQ-9 score of ${psych.phq9} confirms severe depressive load, reflecting deep functional locking within default cognitive sub-cliques.`);
    }
    if (psych.gad7 !== undefined && psych.gad7 >= 12) {
      patientDetails.push(`An elevated GAD-7 score of ${psych.gad7} highlights active generalized anxiety, maintaining high phase noise and sensory hyper-sensitivity.`);
    }

    // Labs & deficiencies analysis
    if (labs.vitD !== undefined && labs.vitD < 30) {
      patientDetails.push(`Active metabolic panels reveal a clinical Vitamin D deficiency (${labs.vitD} ng/mL), which chronically restricts serotonergic synthesis and BDNF transcription velocity.`);
    }
    if (labs.vitB12 !== undefined && labs.vitB12 < 200) {
      patientDetails.push(`A verified Vitamin B12 deficiency (${labs.vitB12} pg/mL) is present, risking slow axonal myelination, sub-optimal nerve transduction, and chronic neuro-fatigue.`);
    }

    // Pharmacogenomics (PGx)
    if (pgx.cyp2d6 === "PM" || pgx.cyp2c19 === "PM") {
      const cypLabel = pgx.cyp2d6 === "PM" ? "CYP2D6" : "CYP2C19";
      patientDetails.push(`Genotypic mapping identifies a ${cypLabel} Poor Metabolizer (PM) phenotype. This severely limits enzymatic clearance of associated agents, extending active compound half-lives and exacerbating receptor saturation kinetics.`);
    }

    if (pgx.bdnf === "Met/Met" || (demo.ethnicity === "east_asian" && !pgx.bdnf)) {
      patientDetails.push("The patient's genotypic profile carries the BDNF Met/Met variant (or East Asian ancestral default), which severely limits activity-dependent BDNF secretion. This reduces long-term synaptic repair and limits synaptogenesis velocity by approximately 35%.");
    } else if (pgx.bdnf === "Val/Met") {
      patientDetails.push("The patient carries the heterozygous BDNF Val/Met variant, which imposes an intermediate restriction on neuroplastic repair and synaptogenesis capacity.");
    }

    if (pgx.comt === "Met/Met") {
      patientDetails.push("Genotypic mapping of the COMT Val158Met allele reveals a Met/Met homozygous profile. While this low-activity enzyme enhances baseline executive focus due to higher prefrontal dopamine concentrations, it renders the patient highly vulnerable to stress-induced cognitive fragmentation and phase noise ('worrier' phenotype).");
    } else if (pgx.comt === "Val/Val") {
      patientDetails.push("The patient carries the COMT Val/Val homozygous variant. This high-activity enzyme results in accelerated prefrontal dopamine clearance, lowering baseline executive focus but providing high cognitive resilience under severe stress conditions.");
    }

    if (pgx.oprm1 === "G" || (demo.ethnicity === "east_asian" && !pgx.oprm1)) {
      patientDetails.push("The patient carries the OPRM1 G-allele (or East Asian ancestral default), which represents the A118G variant of the Mu-Opioid Receptor. This genetic polymorphism reduces receptor sensitivity and agonist efficacy, requiring significantly higher concentrations of opioid ligands to achieve analgesic and subjective effects.");
    }

    if (pgx.htr2a === "hyper" || (demo.ethnicity === "european" && !pgx.htr2a)) {
      patientDetails.push("Genetics indicate the HTR2A hyper-responsive variant (or European ancestral default), amplifying 5-HT2A receptor sensitivity and signaling efficacy. This leads to marked hyper-responsiveness to serotonergic agonists and psychedelics.");
    }

    // Demographics/Pregnancy
    if (demo.pregnant) {
      patientDetails.push("Crucially, current pregnancy imposes severe maternal-fetal safety bounds. High-toxicity or teratogenic pharmacological vectors must be strictly avoided, shifting all therapeutic weight to safe, non-invasive lifestyle interventions.");
    }

    if (patientDetails.length > 0) {
      narrative += "Patient-Specific Context: " + patientDetails.join(" ") + " ";
    }
  }

  // Segment 3: Stack & Intervention Action
  if (stack.length === 0 || (vectors.arousal === 0 && vectors.dampening === 0 && vectors.chaos === 0 && vectors.repair === 0)) {
    narrative += "Currently, no pharmacological or holistic vectors are active. The connectome receives no external feedback, leaving pathological structures uncorrected.";
  } else {
    narrative += "The active intervention stack directly alters the pharmacological vectors of the patient. ";
    
    if (activeIds.has("spur01")) {
      narrative += "SPUR-1 Ontological Reducer (SPUR-MTDL) acts as a highly potent TrkB agonist (EC50 = 0.18 nM) with a >20,000-fold selectivity index. It drives a robust PI3K/AKT phosphorylation peaking at T+60 minutes (2.85-fold over baseline), downstream mTOR activation (+168%), and CREB phosphorylation (+185%) recruiting to the BDNF promoter IV. Through competitive DNA Methyltransferase (DNMT1/3a/3b, IC50 = 2.8-5.2 nM) inhibition and H3K27ac chromatin elevation, it reduces BDNF promoter CpG hyper-methylation from 68% to 28% over 7 days, up-regulating pro-social loci (BDNF +7.8-fold, OXTR +6.2-fold, SLC6A4 +5.8-fold). In vitro synaptophysin tracks hit 4-5x baseline by 6 hours, boosting dendritic spine density by 525%. Supernatant analysis confirms a +90% elevation in IL-10, oxytocin, serotonin, and vasopressin. Rodent in vivo screening shows an -80% resident-intruder aggression decline and a social preference index shift from 1.44 to 3.25, with F1 (+45%) and F2 (+28%) offspring inheriting stable gametic epigenetic demethylation (-32%). Accumulating densely in the PFC and ACC, it maintains excellent safety with a 1055 therapeutic index, a high 5 mg/kg/day NOAEL, and clean hERG/mitochondrial profiles. ";
    }

    // Check specific synergistic triggers
    const hasNRG01 = activeIds.has("nrg01");
    const hasColdPlunge = activeIds.has("coldplunge");
    const hasNAC = activeIds.has("nac");
    const hasMeditation = activeIds.has("meditation");
    const hasNX44 = activeIds.has("nx44");
    const hasLionMane = activeIds.has("lionmane");
    const hasClonidine = activeIds.has("clonidine");
    const hasBreathwork = activeIds.has("breathwork");

    if (hasNRG01 && hasColdPlunge) {
      narrative += "Co-activation of NRG-01 and Cold Plunge triggers deep **Dopaminergic Regeneration**, accelerating dopamine receptor resensitization and stabilizing central reward pathways. ";
    }
    if (hasNAC && hasMeditation) {
      narrative += "The synergy of NAC and Mindfulness Meditation facilitates **Glutamatergic Stabilization**, down-regulating excitotoxic glutamate surge and calming baseline cortical noise. ";
    }
    if (hasNX44 && hasLionMane) {
      narrative += "Combining the precision BDNF enhancer NX-44 with Lion's Mane mushroom projections generates maximum **Axonal Regrowth**, boosting structural nerve growth factors and repair metrics. ";
    }
    if (hasClonidine && hasBreathwork) {
      narrative += "The autonomic rebalancing synergy of Clonidine and Somatic Breathwork actively suppresses hyper-adrenergic distress, re-entraining cardiac and limbic sympathetic tone. ";
    }

    // Lifestyle standard effects
    if (activeIds.has("cbt") && states.includes("DEPRESSION")) {
      narrative += "Structured CBT / Talk Therapy disrupts persistent depressive loops, actively dampening pathological DMN sub-clique integration. ";
    }
    if (activeIds.has("sleep")) {
      narrative += "Optimized Sleep serves as a primary restorative driver, facilitating axonal rejuvenation, metabolic waste clearance, and systemic connectome repair. ";
    }

    // Psychedelic entropy
    if (activeIds.has("psilo") || activeIds.has("lsd")) {
      narrative += "The classic psychedelic compounds introduce structural high-entropy dynamics into the cortex, dissolving rigid default pathways and projecting a wide window of neuroplastic hyper-receptive learning. ";
    }

    if (activeIds.has("jianshouqing")) {
      narrative += "The Yunnan Jianshouqing Mushroom (*Lanmaoa asiatica*) introduces profound visual coordinate transformations. Under the oxidation kinetics of Variegatic Acid, its high-chaos entropic vectors and M1/HT2A receptor displacements trigger highly structured, vivid oneirogenic visual animations (colloquially 'little people') and a marked disruption of rigid default mode network structures, allowing a fluid topological reorganizing of sensory-visual projections. ";
    }

    // Opioid corrective agonist
    if (activeIds.has("sr17")) {
      narrative += "The biased opioid receptor agonist SR17-018 actively overrides depressive CNS signals without respiratory suppression, promoting high-potency connectome repair and reversing withdrawal edge-atrophy. ";
    }

    // Conventional medications
    if (activeIds.has("sert") || activeIds.has("fluox") || activeIds.has("escit")) {
      narrative += "Standard Selective Serotonin Reuptake Inhibitors (SSRIs) stabilize mood axes by slowly up-regulating synaptic serotonin levels, dampening pathological amygdala firing. ";
    }

    // Stimulants
    if (activeIds.has("amph") || activeIds.has("mph") || activeIds.has("lisdexamph")) {
      narrative += "Conventional prescription stimulants strongly enhance synaptic catecholamine concentration, significantly raising executive focus while introducing mild sympathetic somatic stress. ";
    }
  }

  // Segment 4: Coherence & Projection
  narrative += ` Overall, the patient's connectome registers a Topological Integrity score of Φ = ${reportData.integrity}%, indicating a projected baseline convergence progress of ${reportData.integrity}%. Functional coherence (Kuramoto R ≈ ${reportData.R}) is stabilized at effective coupling K ≈ ${reportData.K}.`;

  return {
    qualiaClass,
    qualiaDescription,
    domains: {
      focus,
      affectiveValence: valence,
      perceptualEntropy: entropy,
      autonomicTone: autonomic,
    },
    tags: finalTags,
    narrative,
  };
}
