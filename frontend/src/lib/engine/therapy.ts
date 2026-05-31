// ----------------------------------------------------------------------------
// Clinical Translation & State-Space Trajectory Engine
// ----------------------------------------------------------------------------
// Maps functional connectivity profiles and high-dimensional persistent
// homologies to concrete clinical therapies, contrasting conventional pathways
// against experimental pathways under rigorous quantitative constraints.
// ----------------------------------------------------------------------------

import { type Pathology, PATHOLOGY_META } from "./topology";

export interface TopologicalMetrics {
  nodeCentrality: string;
  meanPathLength: string;
  homologicalPersistence: string;
}

export interface PathwayProjection {
  name: string;
  targetNodes: string[];
  clinicalEfficacy: string;
  expectedTopologicalShift: string;
  metrics: {
    deltaR: number; // e.g. vmPFC-Amygdala delta tracking correlation
    cliquesDisrupted: number;
    couplingShift: string;
  };
  details: string[];
}

export interface ExperimentalPathwayProjection {
  name: string;
  targetNodes: string[];
  stereotaxicCoordinates: string; // MNI [x, y, z]
  biophysicalConstraints: string; // E-field validation constraints
  topologicalMetrics: TopologicalMetrics;
  details: string[];
}

export interface TrajectoryStep {
  month: number;
  distanceToRemission: number; // in % (0% = complete remission)
  integrity: number;           // Φ score
  entropy: number;             // functional entropy
}

export interface TrajectorySimulation {
  convergenceRate: number;      // percentage improvement per month
  currentDistance: number;      // initial distance
  projectedDistance: number;    // final projected distance
  status: string;               // e.g., "Optimal Convergence Projected"
  steps: TrajectoryStep[];
  isHighVariance: boolean;
  missingValidationMetrics: string[];
}

export interface TherapyProjection {
  baselineCliques: string[];
  conventional: PathwayProjection;
  experimental: ExperimentalPathwayProjection;
  trajectory: TrajectorySimulation;
}

// Stereotaxic seed database mapped to anatomical parcels
const MNI_SEEDS: Record<string, string> = {
  dlPFC: "MNI [x: -42, y: 35, z: 35] (Left dlPFC Hub)",
  vmPFC: "MNI [x: -6, y: 46, z: -12] (Ventromedial Prefrontal)",
  amygdala: "MNI [x: -24, y: -6, z: -20] (Left Basolateral Amygdala)",
  sgACC: "MNI [x: -4, y: 25, z: -10] (Subgenual Cingulate)",
  dACC: "MNI [x: 8, y: 22, z: 36] (Dorsal Anterior Cingulate)",
  insula: "MNI [x: -38, y: 12, z: 4] (Anterior Insula Hub)",
  S1: "MNI [x: -40, y: -28, z: 54] (Primary Somatosensory Cortex)"
};

export function computeTherapyProjection(
  pathologies: Pathology[],
  activeStackCount = 0,
  baseIntegrity = 100
): TherapyProjection {
  const primary = pathologies[0] || "DEPRESSION";

  // 1. Baseline Topology Analysis
  const baselineCliques: string[] = [];
  if (pathologies.length === 0) {
    baselineCliques.push("No pathological deformations detected. Connectome operates in dynamic homeostatic equilibrium.");
  } else {
    pathologies.forEach((p) => {
      const meta = PATHOLOGY_META[p];
      if (p === "DEPRESSION") {
        baselineCliques.push("Rigid, hyper-synchronized 1-dimensional graph loops spanning DMN hubs (PCC/vmPFC), locking cognitive resources into self-referential rumination cycles.");
        baselineCliques.push("Attenuated control-to-limbic clique complexes causing loss of top-down emotional regulation.");
      } else if (p === "PTSD") {
        baselineCliques.push("Hyper-reactive 3D persistent cavities inside the Limbic Network (amygdala/hippocampus), inducing chronological collapse and somatic flash-backs.");
        baselineCliques.push("Reduced functional edge weight along vmPFC-amygdala pathway ($r < 0.15$).");
      } else if (p === "ADHD") {
        baselineCliques.push("Fragmented clique topology within the Frontoparietal Control Network (dlPFC), accelerating task-set decay and latent sensory static.");
      } else if (p === "CRPS") {
        baselineCliques.push("Blurred topological boundaries in the Somatomotor network, showing local S1 hyper-clustering and loss of somatotopic dimensional boundaries.");
      } else {
        baselineCliques.push(`Pathological hyperconnectivity within the ${meta?.region ?? "Limbic"} Network, creating high-dimensional rigid subgraphs that resist dynamic phase-shifting.`);
      }
    });
  }

  // 2. Conventional Intervention Vector
  let conventional: PathwayProjection;
  switch (primary) {
    case "PTSD":
      conventional = {
        name: "Trauma-Focused Cognitive Behavioral Therapy (TF-CBT) & CPT",
        targetNodes: ["L_vmPFC", "R_vmPFC", "L_AMY", "R_AMY"],
        clinicalEfficacy: "Class A Medical Recommendation. Induces sustained prefrontal-to-limbic downregulation over 12-24 sessions.",
        expectedTopologicalShift: "Re-establishment of top-down inhibitory feedback from vmPFC to basolateral amygdala, suppressing hyper-reactive limbic nodes.",
        metrics: {
          deltaR: 0.38,
          cliquesDisrupted: 14,
          couplingShift: "Limbic internal coupling reduced from 0.85 to 0.42"
        },
        details: [
          "Increases vmPFC-Amygdala BOLD phase-tracking correlation by projected Δr = +0.38.",
          "Restores normal 2-dimensional simplicial complexes in Limbic networks.",
          "Reduces somatic autonomic vigilance by restoring ventral attention homeostasis."
        ]
      };
      break;
    case "ADHD":
      conventional = {
        name: "First-Line Psychostimulants (Methylphenidate) & Cognitive Regimens",
        targetNodes: ["L_DLPFC", "R_DLPFC", "L_IPL", "R_IPL"],
        clinicalEfficacy: "FDA-Approved DAT/NET blockade. Rapidly enhances synaptic dopamine/norepinephrine density in control circuits.",
        expectedTopologicalShift: "Upregulation of the Frontoparietal Control Network (FPN), lowering structural graph distance between executive and sensory hubs.",
        metrics: {
          deltaR: 0.35,
          cliquesDisrupted: 8,
          couplingShift: "Control network coupling increased from 0.32 to 0.58"
        },
        details: [
          "Restores frontoparietal clique coherence with target Δr = +0.35.",
          "Decreases mean path length between Control and Default Mode networks, facilitating seamless task switching.",
          "Decreases sub-threshold phase-drift within Somatomotor and Visual channels."
        ]
      };
      break;
    case "CRPS":
      conventional = {
        name: "Intensive Physical Therapy, Sympathetic Blockade & Agmatine Sulfate",
        targetNodes: ["L_S1", "R_S1", "L_FEF", "R_FEF"],
        clinicalEfficacy: "Budapest criteria reversal protocol. Standardized somatic retraining paired with ganglion sympathetic blocks.",
        expectedTopologicalShift: "Re-differentiation of primary somatosensory cortex (S1) boundaries, reversing somatotopy blurring.",
        metrics: {
          deltaR: 0.36,
          cliquesDisrupted: 12,
          couplingShift: "SomatoMotor hyperconnectivity normalized by 28%"
        },
        details: [
          "Increases bilateral S1 functional modularity index by Δr = +0.36.",
          "Restores normal baseline Kuramoto frequency to Somatomotor coordinates.",
          "Mitigates mechanical allodynia by decreasing hyperconnectivity to the insular cortex."
        ]
      };
      break;
    case "DEPRESSION":
    default:
      conventional = {
        name: "Trauma-Informed CBT paired with SSRI Pharmacotherapy (Sertraline)",
        targetNodes: ["L_VMPFC", "R_VMPFC", "L_PCC", "R_P PCC", "L_AMY", "R_AMY"],
        clinicalEfficacy: "Standard clinical gold-standard care. Combines cognitive restructuring with chronic serotonin transporter blockade.",
        expectedTopologicalShift: "Downregulation of hyper-stable Default Mode Network (DMN) connectivity, dispersing rigid self-referential subgraphs.",
        metrics: {
          deltaR: 0.41,
          cliquesDisrupted: 18,
          couplingShift: "DMN internal coupling reduced from 0.72 to 0.44"
        },
        details: [
          "Disrupts hyper-stable DMN loops, enabling functional dynamic flexibility.",
          "Promotes vmPFC-Amygdala phase correlation shift of Δr = +0.41 over a 6-week timeframe.",
          "Re-entrains frontoparietal control over baseline DMN stability."
        ]
      };
      break;
  }

  // 3. Experimental Intervention Vector (Targeted neuromodulation / molecular reset)
  let experimental: ExperimentalPathwayProjection;
  switch (primary) {
    case "PTSD":
      experimental = {
        name: "Calculated intermittent Theta-Burst Stimulation (iTBS) & Noribogaine Infusion",
        targetNodes: ["L_DLPFC", "L_AMY", "L_HPC"],
        stereotaxicCoordinates: `${MNI_SEEDS.dlPFC} targeting amygdala seed: ${MNI_SEEDS.amygdala}`,
        biophysicalConstraints: "E-Field Validation: Requires exact stereotaxic coordinates calculated from seed-based FC, validated against standard biophysical E-field models showing peak induced voltage >120 V/m inside target cortical layers.",
        topologicalMetrics: {
          nodeCentrality: "Left dlPFC node hubness index upregulated from 1.15 to 2.80, restoring top-down executive command.",
          meanPathLength: "Control-to-Limbic topological shortest-path decreased by 22% (facilitating rapid downregulation).",
          homologicalPersistence: "Sustained dissolution of rigid 3-dimensional persistent cavities (H2) inside the Salience network within 72 hours."
        },
        details: [
          "Stereotaxically targeted magnetic fields stimulate prefrontal inhibition over hyper-reactive amygdala circuits.",
          "Noribogaine multi-receptor modulation (KOR/NMDA) initiates localized neurogenesis (repair vector ρ target = 3.0).",
          "Permanent structural connectome remodeling is achieved by increasing Hebbian learning capacity by 35%."
        ]
      };
      break;
    case "ADHD":
      experimental = {
        name: "Navigated High-Frequency rTMS at FPN Coordinates & NX-44 Neuromodulation",
        targetNodes: ["R_DLPFC", "R_IPL"],
        stereotaxicCoordinates: `${MNI_SEEDS.dlPFC} targeting contralateral seed: MNI [x: 42, y: 35, z: 35]`,
        biophysicalConstraints: "E-Field Validation: Direct targeting of the Right dlPFC using an external figure-of-eight coil; requires E-field gradient >85 V/m focused strictly within the middle frontal gyrus.",
        topologicalMetrics: {
          nodeCentrality: "Right dlPFC hubness index boosted by 140%, forcing the Frontoparietal Control network out of hypo-connectivity.",
          meanPathLength: "Mean topological path length within the Control network decreased by 18%, accelerating executive task-set lock.",
          homologicalPersistence: "Fractions out chaotic 1-dimensional cycle loops (H1) that cause transient cognitive drifts and attention fracturing."
        },
        details: [
          "High-frequency 20Hz rTMS induces long-term potentiation (LTP) in bilateral frontoparietal projection loops.",
          "NX-44 molecular BDNF synergy accelerates local synaptic remodeling and increases axonal growth densities.",
          "Suppresses task-negative DMN intrusion during effortful focus."
        ]
      };
      break;
    case "CRPS":
      experimental = {
        name: "Direct S1 Low-Frequency rTMS & Precision S-Ketamine Infusion Protocol",
        targetNodes: ["L_S1", "R_S1", "L_INS"],
        stereotaxicCoordinates: `${MNI_SEEDS.S1} targeting contralateral sensory coordinates`,
        biophysicalConstraints: "E-Field Validation: Target S1 mapping via MRI-navigated neuronavigation, demanding localized E-field maximums focused at the central sulcus, paired with low-frequency (1Hz) inhibitory protocols.",
        topologicalMetrics: {
          nodeCentrality: "S1 somatotopy cluster coefficient reduced from 0.76 to 0.44, resolving pathological hyper-clustering.",
          meanPathLength: "Topological path length between S1 and anterior insular cortex increased, blocking nociceptive amplification loops.",
          homologicalPersistence: "Dissolves rigid somatomotor-to-limbic persistent homology structures that code for chronic central sensitization."
        },
        details: [
          "Low-frequency inhibitory rTMS down-regulates hyper-excited primary sensory coordinates.",
          "S-Ketamine NMDA receptor blockade induces a profound synaptic reset (repair vector ρ target = 2.5), quietening hyperactive CSTC loops.",
          "Reverses Budapest criteria indices by restoring clear spatial boundaries to cortical representation maps."
        ]
      };
      break;
    case "DEPRESSION":
    default:
      experimental = {
        name: "Navigated Left dlPFC iTBS (Stanford Saint Protocol) & Epigenetic SPUR-MTDL",
        targetNodes: ["L_DLPFC", "L_sgACC", "L_VMPFC"],
        stereotaxicCoordinates: `${MNI_SEEDS.dlPFC} targeting subgenual seed: ${MNI_SEEDS.sgACC}`,
        biophysicalConstraints: "E-Field Validation: Accelerated SAINT protocol consisting of 10 daily sessions of 1800 pulses at 120% motor threshold, with E-field density strictly focused within the subgenual cingulate projection coordinate.",
        topologicalMetrics: {
          nodeCentrality: "Left dlPFC node centrality index increased from 0.90 to 2.45; sgACC hyperconnectivity reduced by 34%.",
          meanPathLength: "Mean network shortest-path from control nodes to subgenual coordinates decreased by 25%.",
          homologicalPersistence: "Rapid dissolution of persistent 1D cycle loops (H1) and hyper-stable cliques in the subgenual DMN projection."
        },
        details: [
          "Stanford Neuromodulation Therapy (SAINT) protocol achieves rapid remission of refractory depression by disrupting pathological DMN phase-locking.",
          "SPUR-MTDL initiates rapid epigenetic remodeling via site-specific CpG demethylation of BDNF promoters.",
          "Upregulates active neuroplastic repair vectors to repair decayed structural connectome edges."
        ]
      };
      break;
  }

  // 4. State-Space Trajectory Simulation
  const isHighVariance = pathologies.length > 1;
  const missingValidationMetrics: string[] = [];
  if (isHighVariance) {
    missingValidationMetrics.push("Bilateral seed-based Granger Causality metrics to verify prefrontal-to-limbic directionality.");
    missingValidationMetrics.push("Individualized gray matter thickness indices to scale rTMS induced E-field penetration depth.");
  }

  // Calculate convergence rate and distance to remission based on baseline integrity and stack count
  const initialDistance = 100 - baseIntegrity;
  const convergenceRate = Math.min(25, Math.max(8, 12 + activeStackCount * 4));
  
  const steps: TrajectoryStep[] = [
    { month: 0, distanceToRemission: initialDistance, integrity: baseIntegrity, entropy: 0.65 }
  ];

  let currentDist = initialDistance;
  let currentInteg = baseIntegrity;
  let currentEntropy = 0.65;

  const monthIntervals = [1, 2, 3, 6];
  monthIntervals.forEach((m) => {
    const elapsedMonths = m - steps[steps.length - 1].month;
    const factor = Math.exp(- (convergenceRate / 100) * elapsedMonths);
    currentDist = +(currentDist * factor).toFixed(2);
    currentInteg = Math.round(100 - currentDist);
    currentEntropy = +(0.35 + (currentEntropy - 0.35) * factor).toFixed(3);
    
    steps.push({
      month: m,
      distanceToRemission: currentDist,
      integrity: currentInteg,
      entropy: currentEntropy
    });
  });

  const finalProjectedDistance = steps[steps.length - 1].distanceToRemission;
  const status = finalProjectedDistance < 5 
    ? "Optimal Remission Convergence Projected" 
    : (finalProjectedDistance < 15 ? "Partial Response Convergence Projected" : "High Resistance - Regimen Adjustment Required");

  const trajectory: TrajectorySimulation = {
    convergenceRate,
    currentDistance: initialDistance,
    projectedDistance: finalProjectedDistance,
    status,
    steps,
    isHighVariance,
    missingValidationMetrics
  };

  return {
    baselineCliques,
    conventional,
    experimental,
    trajectory
  };
}
