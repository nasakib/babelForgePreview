/**
 * babelForge — fMRI dataset model.
 *
 * Canonical in-memory representation of an uploaded fMRI scan after the
 * backend `/api/fmri/analyze` endpoint has parsed it. Engines operate on
 * this object, NeuroCanvas renders from it, the AI tokenizer summarizes
 * it. One type, one source of truth.
 */

export type ParcelNetwork =
  | "Default"
  | "Control"
  | "Limbic"
  | "Visual"
  | "SomatoMotor"
  | "VentAttn"
  | "DorsalAttn"
  | "Subcortical"
  | "Brainstem"
  | "Cerebellum";

export interface Parcel {
  index: number;
  /** Stable id like "L_V1". */
  id: string;
  /** Display name. */
  name: string;
  network: ParcelNetwork;
  hemi: "LH" | "RH";
  /** MNI centroid (mm). */
  mni: [number, number, number];
  /** Dominant frequency (Hz) for motion/animation coding. */
  freqHz: number;
}

export interface FmriDataset {
  /** Original filename or synthetic label. */
  filename: string;
  /** "csv" if user-supplied numerical data was used, else "synthesized". */
  source: "csv" | "synthesized";
  /** Pathology labels the backend detected; routed into AIContext. */
  diagnosticProfile: string[];
  /** Parcel metadata aligned 1:1 with rows of `timeSeries` and `fcMatrix`. */
  parcels: Parcel[];
  /** TR (repetition time) in seconds. */
  tr: number;
  /** BOLD time series [n_parcels][n_TR], z-scored per parcel. */
  timeSeries: number[][];
  /** Pearson functional connectivity [n][n] in [-1, 1]. */
  fcMatrix: number[][];
  /** Backend-derived stats for headline display. */
  stats: {
    totalEdges: number;
    meanFC: number;
    entropy: number;
  };
}

/**
 * Parse the backend response into a FmriDataset, raising if required
 * fields are missing or malformed. Returns null when the response is
 * incompatible (e.g. legacy backend without numerical fields).
 */
export function parseBackendResponse(resp: any): FmriDataset | null {
  if (!resp || typeof resp !== "object") return null;
  if (!Array.isArray(resp.parcels)) return null;
  if (!Array.isArray(resp.time_series)) return null;
  if (!Array.isArray(resp.fc_matrix)) return null;

  const parcels: Parcel[] = resp.parcels.map((p: any, i: number) => ({
    index: typeof p.index === "number" ? p.index : i,
    id: String(p.id ?? `P${i}`),
    name: String(p.name ?? p.id ?? `Parcel ${i}`),
    network: (p.network as ParcelNetwork) ?? "Default",
    hemi: p.hemi === "RH" ? "RH" : "LH",
    mni: Array.isArray(p.mni) && p.mni.length === 3
      ? [Number(p.mni[0]), Number(p.mni[1]), Number(p.mni[2])]
      : [0, 0, 0],
    freqHz: Number(p.freqHz ?? 10),
  }));

  const timeSeries: number[][] = resp.time_series.map((row: any) =>
    (row as any[]).map((v) => Number(v)),
  );
  const fcMatrix: number[][] = resp.fc_matrix.map((row: any) =>
    (row as any[]).map((v) => Number(v)),
  );

  const stats = resp.topology?.stats ?? {};
  return {
    filename: String(resp.filename ?? "unknown"),
    source: resp.source === "csv" ? "csv" : "synthesized",
    diagnosticProfile: Array.isArray(resp.diagnostic_profile)
      ? resp.diagnostic_profile.map((s: any) => String(s))
      : [],
    parcels,
    tr: Number(resp.tr ?? 2.0),
    timeSeries,
    fcMatrix,
    stats: {
      totalEdges: Number(stats.total_edges ?? 0),
      meanFC: Number(stats.mean_fc ?? 0),
      entropy: Number(stats.estimated_entropy ?? 0),
    },
  };
}

/** Quick shape-validation hook for engine functions. */
export function validateDataset(d: FmriDataset): string | null {
  if (d.parcels.length === 0) return "No parcels in dataset.";
  if (d.timeSeries.length !== d.parcels.length) {
    return `timeSeries rows (${d.timeSeries.length}) ≠ parcels (${d.parcels.length}).`;
  }
  if (d.fcMatrix.length !== d.parcels.length) {
    return `fcMatrix rows (${d.fcMatrix.length}) ≠ parcels (${d.parcels.length}).`;
  }
  if (d.timeSeries[0]?.length < 16) {
    return "Time series too short for spectral analysis (need ≥ 16 samples).";
  }
  return null;
}
