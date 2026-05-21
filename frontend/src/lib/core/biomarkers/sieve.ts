/**
 * @file sieve.ts
 * @description Logos Sieve Feature Extractor
 * 
 * Biological Analogue: Targeted biomarker identification in clinical EEG/fMRI datasets.
 * Physics Principle: Sieve filtering and feature mapping onto boundary holographic spaces.
 * Runtime Complexity: O(1) to evaluate the hardcoded top-10 prioritized hotspot filter maps; O(N) overall.
 * Role in Prevention: Flags early signal drop-offs in critical networks, triggering proactive topological repairs.
 */

import { get32FrequencyBins } from "../data/harmonizer";

export interface HottestFeature {
  index: number;
  roi: number;
  roiName: string;
  bin: number;
  frequencyHz: number;
  network: "DorsAttn" | "Vis" | "SalVentAttn" | "Control" | "Default" | "SomatoMotor" | "Limbic";
  importanceScore: number; // empirical feature importance weight
}

/**
 * Hardcoded optimized prioritizing filter map containing the top-10 hottest subnetwork keys
 * identified in the user's clinical ML notebook.
 */
export const TOP_10_HOTTEST_FEATURES: HottestFeature[] = [
  {
    index: 41 * 32 + 9,
    roi: 42,
    roiName: "7Networks_LH_DorsAttn_FEF_2",
    bin: 9,
    frequencyHz: 0.036,
    network: "DorsAttn",
    importanceScore: 0.952
  },
  {
    index: 41 * 32 + 7,
    roi: 42,
    roiName: "7Networks_LH_DorsAttn_FEF_2",
    bin: 7,
    frequencyHz: 0.030,
    network: "DorsAttn",
    importanceScore: 0.914
  },
  {
    index: 52 * 32 + 7,
    roi: 53,
    roiName: "7Networks_LH_SalVentAttn_Med_2",
    bin: 7,
    frequencyHz: 0.030,
    network: "SalVentAttn",
    importanceScore: 0.895
  },
  {
    index: 179 * 32 + 10,
    roi: 180,
    roiName: "7Networks_RH_Cont_PFCmp_1",
    bin: 10,
    frequencyHz: 0.039,
    network: "Control",
    importanceScore: 0.887
  },
  {
    index: 141 * 32 + 10,
    roi: 142,
    roiName: "7Networks_RH_DorsAttn_Post_8",
    bin: 10,
    frequencyHz: 0.039,
    network: "DorsAttn",
    importanceScore: 0.865
  },
  {
    index: 141 * 32 + 9,
    roi: 142,
    roiName: "7Networks_RH_DorsAttn_Post_8",
    bin: 9,
    frequencyHz: 0.036,
    network: "DorsAttn",
    importanceScore: 0.842
  },
  {
    index: 145 * 32 + 9,
    roi: 146,
    roiName: "7Networks_RH_DorsAttn_FEF_2",
    bin: 9,
    frequencyHz: 0.036,
    network: "DorsAttn",
    importanceScore: 0.821
  },
  {
    index: 8 * 32 + 8,
    roi: 9,
    roiName: "7Networks_LH_Vis_9",
    bin: 8,
    frequencyHz: 0.033,
    network: "Vis",
    importanceScore: 0.812
  },
  {
    index: 33 * 32 + 8,
    roi: 34,
    roiName: "7Networks_LH_DorsAttn_Post_4",
    bin: 8,
    frequencyHz: 0.033,
    network: "DorsAttn",
    importanceScore: 0.798
  },
  {
    index: 145 * 32 + 8,
    roi: 146,
    roiName: "7Networks_RH_DorsAttn_FEF_2",
    bin: 8,
    frequencyHz: 0.033,
    network: "DorsAttn",
    importanceScore: 0.784
  }
];

export interface EvaluatedFeature extends HottestFeature {
  amplitude: number;
  anomalyScore: number;
}

/**
 * Extracts the top clinical hotspot features from the subject vector,
 * showing their active spectral amplitudes.
 */
export function extractLogosSieveImportances(vector: number[]): EvaluatedFeature[] {
  if (vector.length !== 6400) {
    return TOP_10_HOTTEST_FEATURES.map(f => ({ ...f, amplitude: 0, anomalyScore: 0 }));
  }
  
  return TOP_10_HOTTEST_FEATURES.map(feat => {
    const amplitude = vector[feat.index] ?? 0;
    
    // Anomaly score is higher when amplitude departs significantly from a baseline healthy value (~1.0)
    // Especially for positive-weight features where higher amplitude indicates pathological resistance
    const anomalyScore = feat.roiName.includes("FEF") || feat.roiName.includes("SalVentAttn")
      ? Math.max(0, amplitude - 0.4) * feat.importanceScore
      : Math.max(0, 0.8 - amplitude) * feat.importanceScore;
      
    return {
      ...feat,
      amplitude: parseFloat(amplitude.toFixed(4)),
      anomalyScore: parseFloat(anomalyScore.toFixed(4))
    };
  });
}

/**
 * Holographic Boundary Collapse Evaluator:
 * Functional information drop-offs inside these explicit clinical networks
 * directly trigger calculated collapses of corresponding multi-dimensional bulk cavities.
 * 
 * If a critical hotspot's amplitude drops below or spikes above threshold, we flag the corresponding
 * network node as "collapsed" which indicates the bulk cavities containing it have collapsed!
 */
export function evaluateHolographicBoundaryCollapse(
  vector: number[],
  amplitudeThreshold = 0.35
): {
  collapsedNetworks: string[];
  collapsedNodes: number[];
  bulkCavityCollapseIndices: number[];
} {
  const evaluated = extractLogosSieveImportances(vector);
  
  const collapsedNetworks = new Set<string>();
  const collapsedNodes: number[] = [];
  const bulkCavityCollapseIndices: number[] = [];
  
  evaluated.forEach((feat, idx) => {
    // Check if the signal has decayed (amplitude too low or pathological hyperarousal)
    const isAnomaly = feat.anomalyScore > 0.3;
    
    if (isAnomaly) {
      collapsedNetworks.add(feat.network);
      collapsedNodes.push(feat.roi - 1); // 0-indexed node
      
      // Map directly to corresponding bulk cavities.
      // Top features trigger collapses in specific bulk cavities indexed by the feature ranking.
      bulkCavityCollapseIndices.push(idx);
    }
  });
  
  return {
    collapsedNetworks: Array.from(collapsedNetworks),
    collapsedNodes,
    bulkCavityCollapseIndices
  };
}
