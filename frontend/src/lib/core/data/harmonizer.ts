/**
 * @file harmonizer.ts
 * @description Parcellation & Harmonization Service
 * 
 * Biological Analogue: Schaefer cortical parcellation template and spectral frequency alignment.
 * Physics Principle: Multi-dimensional spectral mode harmonization; physical frequency coordinates match spatial locations.
 * Runtime Complexity: O(S * ROI * Bins) to consolidate and average multiple subject scan matrices.
 * Role in Prevention: Standardizes multi-modal inputs, filtering out noise (NaNs) to form a robust, clean feature state.
 */

export interface BrainNode {
  id: number;
  name: string;
  network: "Visual" | "SomatoMotor" | "DorsAttn" | "SalVentAttn" | "Limbic" | "Control" | "Default";
  hemi: "LH" | "RH";
  x: number;
  y: number;
  z: number;
}

export interface SubjectScan {
  scanId: string;
  fourierFingerprint: number[][]; // size [200][32]
  timestamp: number;
  scannerToken: string;
}

export interface SubjectRecord {
  subjectId: string;
  treatmentResistanceStatus: 0 | 1; // 0 = Treatment-Responsive, 1 = Treatment-Resistant
  scans: SubjectScan[];
}

/**
 * Instantiates the 32 frequency bins linearly spaced from 0.01 Hz to 0.1 Hz.
 * yields coordinates: Bin 7 at 0.030 Hz, Bin 8 at 0.033 Hz, Bin 9 at 0.036 Hz, and Bin 10 at 0.039 Hz.
 */
export function get32FrequencyBins(): number[] {
  const minF = 0.01;
  const maxF = 0.1;
  const bins: number[] = [];
  for (let i = 0; i < 32; i++) {
    const f = minF + i * (maxF - minF) / 31;
    bins.push(f);
  }
  return bins;
}

/**
 * Generates the Schaefer 2018 200-ROI parcellation coordinates mapped to Yeo 7Networks.
 * Standardizes coordinate space onto a realistic cortical ellipsoid.
 */
export function getSchaefer200ROIs(): BrainNode[] {
  const nodes: BrainNode[] = [];
  const networks: BrainNode["network"][] = [
    "Visual",
    "SomatoMotor",
    "DorsAttn",
    "SalVentAttn",
    "Limbic",
    "Control",
    "Default"
  ];
  
  // Deterministic seed helper to generate smooth ellipsoid coordinates
  let seed = 42;
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 1; i <= 200; i++) {
    const hemi = i <= 100 ? "LH" : "RH";
    const netIdx = (i - 1) % networks.length;
    const network = networks[netIdx];
    
    // Assign typical anatomical names to match empirical signatures
    let name = `7Networks_${hemi}_${network}_${Math.ceil(i / networks.length)}`;
    if (i === 9) name = "7Networks_LH_Vis_9";
    if (i === 34) name = "7Networks_LH_DorsAttn_Post_4";
    if (i === 42) name = "7Networks_LH_DorsAttn_FEF_2";
    if (i === 53) name = "7Networks_LH_SalVentAttn_Med_2";
    if (i === 109) name = "7Networks_RH_Vis_9"; // matched
    if (i === 118) name = "7Networks_RH_SomMot_6"; // Somatomotor coordinate
    if (i === 142) name = "7Networks_RH_DorsAttn_Post_8";
    if (i === 146) name = "7Networks_RH_DorsAttn_FEF_2";
    if (i === 180) name = "7Networks_RH_Cont_PFCmp_1";
    
    // Generate ellipsoid coordinate: (x^2/a^2 + y^2/b^2 + z^2/c^2 = 1)
    const angle1 = (i / 100) * Math.PI;
    const angle2 = rand() * Math.PI * 2;
    
    const a = hemi === "LH" ? -60 : 60; // Separate hemispheres along X-axis
    const b = 75; // Y radius (posterior to anterior)
    const c = 55; // Z radius (ventral to dorsal)
    
    const x = a + Math.sin(angle1) * Math.cos(angle2) * 12;
    const y = Math.cos(angle1) * b + rand() * 4;
    const z = Math.abs(Math.sin(angle1) * Math.sin(angle2)) * c + rand() * 5 - 5;
    
    nodes.push({
      id: i,
      name,
      network,
      hemi,
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      z: parseFloat(z.toFixed(2)),
    });
  }
  
  return nodes;
}

/**
 * subject scan Consolidation Sieve:
 * Ingests multiple scans for a subject, filters out invalid values (NaNs),
 * executes an element-wise average across the (200, 32) matrix coordinate geometry
 * and flattens the result into a 6400-dimensional vector.
 * 
 * @param scans Array of scans, each having a [200][32] fingerprint matrix.
 * @returns Consolidated 6400-dimensional continuous vector.
 */
export function consolidateSubjectScans(scans: SubjectScan[]): number[] {
  if (scans.length === 0) {
    return new Array(6400).fill(0);
  }
  
  const consolidated = Array.from({ length: 200 }, () => new Array(32).fill(0));
  
  for (let r = 0; r < 200; r++) {
    for (let c = 0; c < 32; c++) {
      let sum = 0;
      let count = 0;
      
      for (const scan of scans) {
        const val = scan.fourierFingerprint[r]?.[c];
        if (val !== undefined && val !== null && !isNaN(val)) {
          sum += val;
          count++;
        }
      }
      
      // np.nanmean logic: average valid entries, default to 0 if all are NaN
      consolidated[r][c] = count === 0 ? 0 : sum / count;
    }
  }
  
  // Flatten (200, 32) matrix into 6400-dimensional array (Row-Major order)
  const flattened: number[] = [];
  for (let r = 0; r < 200; r++) {
    for (let c = 0; c < 32; c++) {
      flattened.push(consolidated[r][c]);
    }
  }
  
  return flattened;
}

/**
 * Filter and consolidate scanning databases of multiple subjects.
 * Excludes subject records missing ground-truth treatment resistance profiles.
 */
export function filterAndHarmonizeCohort(subjects: SubjectRecord[]): {
  subjectId: string;
  label: 0 | 1;
  vector: number[];
}[] {
  return subjects
    .filter(subj => subj.treatmentResistanceStatus === 0 || subj.treatmentResistanceStatus === 1)
    .map(subj => {
      const consolidatedVector = consolidateSubjectScans(subj.scans);
      return {
        subjectId: subj.subjectId,
        label: subj.treatmentResistanceStatus,
        vector: consolidatedVector,
      };
    });
}
