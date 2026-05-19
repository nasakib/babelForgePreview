/**
 * babelForge — wearables abstraction.
 *
 * This module unifies the data we want to ingest from consumer-grade
 * wearables (Oura, Whoop, Fitbit, Apple Health, Garmin, Muse, Dexcom,
 * Polar, Withings, Empatica, Levels, etc.) into a single canonical
 * snapshot shape. Real OAuth + ingest is wired in `providers.ts` (mocks
 * for now). The engines, BodyContext drawer, and the AI grounding all
 * consume the canonical snapshot — never a vendor-specific shape.
 *
 * Why this matters: heart-rate variability, sleep architecture, and
 * continuous glucose are the three most clinically informative streams
 * a modern wearable produces. babelForge maps each into the
 * `PatientProfile.vitals` and `PatientProfile.labs` fields so every
 * downstream engine improves automatically when a wearable is connected.
 *
 * Citation anchors:
 *   - Shaffer & Ginsberg, Front Public Health 2017 (HRV norms).
 *   - Walker MP, Why We Sleep 2017 (sleep architecture interpretation).
 *   - American Diabetes Association, Diabetes Care 2024 (CGM ranges).
 *   - Quer G et al., Lancet Digital Health 2020 (wearable resting HR drift).
 */

export type WearableProvider =
  | "apple_health"
  | "google_fit"
  | "fitbit"
  | "oura"
  | "whoop"
  | "garmin"
  | "muse"
  | "dexcom"
  | "polar"
  | "withings"
  | "empatica"
  | "levels"
  | "mock";

export interface WearableHeartStream {
  /** Resting HR (bpm). */
  rest?: number;
  /** Mean daily HR (bpm). */
  meanDay?: number;
  /** HRV (RMSSD, ms). */
  hrvRmssd?: number;
  /** HRV (SDNN, ms). */
  hrvSdnn?: number;
  /** SDNN/RMSSD trend over 7 days, % vs baseline. */
  trend7dPct?: number;
}

export interface WearableSleepStream {
  /** Total sleep time (min). */
  totalMinutes?: number;
  /** Sleep efficiency (%). */
  efficiency?: number;
  /** Stage minutes. */
  stages?: { rem: number; n3: number; n2: number; n1: number; wake: number };
  /** Sleep score 0..100 (provider-specific composite). */
  score?: number;
  /** Estimated sleep latency (min). */
  latency?: number;
  /** Mid-sleep time (HH:MM in user's TZ). */
  midSleep?: string;
}

export interface WearableActivityStream {
  steps?: number;
  /** Active minutes (moderate + vigorous). */
  activeMinutes?: number;
  /** kcal active. */
  activeKcal?: number;
  /** VO2max estimate. */
  vo2max?: number;
}

export interface WearableBodyStream {
  /** Skin temperature deviation (°C, vs 7-day baseline). */
  tempDeltaC?: number;
  /** Continuous SpO2 minimum overnight (%). */
  spo2NocturnalMin?: number;
  /** Continuous glucose mean (mg/dL). */
  cgmMeanMgDl?: number;
  /** Time in CGM range 70–180 mg/dL (%). */
  cgmTimeInRangePct?: number;
  /** Estimated body weight (kg) — smart scale. */
  weightKg?: number;
}

export interface WearableEegStream {
  /** Average alpha power during meditation (Muse). */
  alphaMeditation?: number;
  /** Average theta power. */
  thetaMeditation?: number;
  /** Calm score 0..100. */
  calmScore?: number;
}

export interface WearableSnapshot {
  provider: WearableProvider;
  capturedAt: number;
  heart?: WearableHeartStream;
  sleep?: WearableSleepStream;
  activity?: WearableActivityStream;
  body?: WearableBodyStream;
  eeg?: WearableEegStream;
}

/**
 * Coalesce snapshots from multiple providers into a single best-of
 * snapshot — preferring the freshest non-null field per stream.
 */
export function mergeSnapshots(snaps: WearableSnapshot[]): WearableSnapshot | null {
  if (!snaps.length) return null;
  const sorted = [...snaps].sort((a, b) => b.capturedAt - a.capturedAt);
  const out: WearableSnapshot = {
    provider: sorted[0].provider,
    capturedAt: sorted[0].capturedAt,
    heart: {},
    sleep: {},
    activity: {},
    body: {},
    eeg: {},
  };
  for (const s of sorted) {
    out.heart = { ...s.heart, ...out.heart };
    out.sleep = { ...s.sleep, ...out.sleep };
    out.activity = { ...s.activity, ...out.activity };
    out.body = { ...s.body, ...out.body };
    out.eeg = { ...s.eeg, ...out.eeg };
  }
  return out;
}
