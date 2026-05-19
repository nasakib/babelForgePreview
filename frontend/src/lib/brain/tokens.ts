/**
 * babelForge — brain tokenizer.
 *
 * Compresses ambient state (active pathologies, stack, optionally an
 * uploaded fMRI dataset) into a compact, color/motion/frequency-coded
 * token stream that the AI assistant can quote and reason about. Each
 * token carries a short id (e.g. "R:HPC", "M:5HT", "B:gamma"), a weight
 * (how strongly it dominates the current state), and rendering metadata.
 *
 * Token kinds:
 *   R:<id>   region            (atlas-derived)
 *   M:<id>   neuromodulator    (DA, 5HT, NE, ACh, HA, OXY)
 *   B:<id>   EEG band          (delta..gamma)
 *   N:<id>   Yeo network       (Default..Cerebellum)
 *   P:<id>   pathology         (depression, anxiety, ...)
 *   C:<id>   compound          (active stack item)
 *   S:<id>   scale rung        (subatomic..behavioral)
 *   Q:<id>   quantum/quantal phenomenon flag
 *   X:<key>  metric            (integrity, R, modularity, ...)
 */

import { REGIONS, networkColor, bandColor, BAND_HZ } from "./atlas";
import { NEUROMODULATORS } from "./neuromodulators";
import { SCALE_LADDER } from "./scales";
import type { FmriDataset } from "@/lib/fmri/dataset";

export type TokenKind = "R" | "M" | "B" | "N" | "P" | "C" | "S" | "Q" | "X";

export interface BrainToken {
  /** Canonical token string, e.g. "R:HPC". */
  token: string;
  kind: TokenKind;
  label: string;
  /** Hex color for rendering. */
  color: string;
  /** Hz for any motion/animation that wants to pulse this token. */
  freqHz: number;
  /** Motion semantic (animation hint). */
  motion: "pulse" | "ripple" | "burst" | "shimmer" | "drift" | "tremor" | "spiral" | "still";
  /** Salience in the current state (0..1). */
  weight: number;
  /** One-line detail the AI can quote verbatim. */
  detail: string;
}

export interface TokenizerInput {
  pathologies: string[];
  stack: Array<{ id?: string; name?: string; class?: string; dose?: number }>;
  /** Optional uploaded dataset — if present, dominant regions are tokenized. */
  dataset?: FmriDataset | null;
  /** Live coherence / integrity score (0..100). */
  integrity?: number;
  /** Live Kuramoto R, if available (0..1). */
  R?: number;
}

const PATHOLOGY_REGION_HINTS: Record<string, string[]> = {
  depression: ["R:VMPFC", "R:ACC", "R:HPC", "R:DLPFC", "R:DRN", "R:LC"],
  anxiety: ["R:AMY", "R:INS", "R:ACC", "R:LC"],
  ptsd: ["R:AMY", "R:HPC", "R:VMPFC", "R:LC"],
  ocd: ["R:ACC", "R:OFC", "R:STR"],
  addiction: ["R:NAC", "R:VTA", "R:INS", "R:OFC"],
  parkinsons: ["R:SNc", "R:STN", "R:STR", "R:GPi", "R:M1"],
  schizophrenia: ["R:DLPFC", "R:THA", "R:A1"],
  adhd: ["R:DLPFC", "R:STR", "R:VTA"],
};

const PATHOLOGY_MODULATOR_HINTS: Record<string, string[]> = {
  depression: ["M:5HT", "M:NE", "M:DA"],
  anxiety: ["M:5HT", "M:NE"],
  ptsd: ["M:NE", "M:5HT"],
  ocd: ["M:5HT", "M:DA"],
  addiction: ["M:DA"],
  parkinsons: ["M:DA"],
  schizophrenia: ["M:DA", "M:5HT"],
  adhd: ["M:DA", "M:NE"],
};

const COMPOUND_MODULATOR_HINTS: Record<string, string[]> = {
  ssri: ["M:5HT"],
  snri: ["M:5HT", "M:NE"],
  stimulant: ["M:DA", "M:NE"],
  antipsychotic: ["M:DA", "M:5HT"],
  depressant: ["M:HA"],
  cannabinoid: ["M:DA"],
  novel: [],
};

/** Build the token stream from the current ambient state. */
export function tokenize(input: TokenizerInput): BrainToken[] {
  const out = new Map<string, BrainToken>();
  const bump = (t: BrainToken, w: number) => {
    const existing = out.get(t.token);
    if (existing) {
      existing.weight = Math.min(1, existing.weight + w);
    } else {
      out.set(t.token, { ...t, weight: Math.min(1, w) });
    }
  };

  // Pathologies → regions + modulators
  for (const p of input.pathologies) {
    const pid = p.toLowerCase();
    bump(
      {
        token: `P:${pid}`,
        kind: "P",
        label: p,
        color: "#ef5765",
        freqHz: 0,
        motion: "tremor",
        weight: 0,
        detail: `Active pathology: ${p}`,
      },
      0.9,
    );
    for (const rt of PATHOLOGY_REGION_HINTS[pid] ?? []) {
      const region = REGIONS.find((r) => r.token === rt);
      if (region) {
        bump(
          {
            token: region.token,
            kind: "R",
            label: region.name,
            color: networkColor(region.network),
            freqHz: region.freqHz,
            motion: region.motion as BrainToken["motion"],
            weight: 0,
            detail: region.function,
          },
          0.7,
        );
      }
    }
    for (const mt of PATHOLOGY_MODULATOR_HINTS[pid] ?? []) {
      const m = NEUROMODULATORS.find((x) => x.token === mt);
      if (m) {
        bump(
          {
            token: m.token,
            kind: "M",
            label: m.name,
            color: m.color,
            freqHz: m.motionHz,
            motion: m.motion,
            weight: 0,
            detail: `${m.name}: ${m.functions.join(", ")}`,
          },
          0.6,
        );
      }
    }
  }

  // Stack → compound tokens + modulator hints
  for (const s of input.stack) {
    const id = s.id ?? s.name ?? "drug";
    bump(
      {
        token: `C:${id}`,
        kind: "C",
        label: s.name ?? id,
        color: "#4d8dff",
        freqHz: 0,
        motion: "pulse",
        weight: 0,
        detail: `Stack compound (${s.class ?? "unknown"}) dose ${s.dose ?? "?"}`,
      },
      Math.min(1, 0.4 + 0.2 * (s.dose ?? 1)),
    );
    for (const mt of COMPOUND_MODULATOR_HINTS[s.class ?? ""] ?? []) {
      const m = NEUROMODULATORS.find((x) => x.token === mt);
      if (m) {
        bump(
          {
            token: m.token,
            kind: "M",
            label: m.name,
            color: m.color,
            freqHz: m.motionHz,
            motion: m.motion,
            weight: 0,
            detail: `${m.name}: ${m.functions.join(", ")}`,
          },
          0.5,
        );
      }
    }
  }

  // fMRI dataset → top hub regions + dominant band
  if (input.dataset && input.dataset.parcels.length > 0) {
    const ds = input.dataset;
    const degree = ds.fcMatrix.map((row, i) =>
      row.reduce((a, v, j) => a + (i !== j ? Math.abs(v) : 0), 0),
    );
    const ranked = degree
      .map((d, i) => ({ d, i }))
      .sort((a, b) => b.d - a.d)
      .slice(0, 5);
    for (const { i, d } of ranked) {
      const parcel = ds.parcels[i];
      const w = Math.min(1, d / Math.max(...degree, 1));
      // Try to map to atlas region by name match; fall back to ad-hoc token.
      const region = REGIONS.find((r) =>
        parcel.name.toLowerCase().includes(r.id.replace(/[^a-z]/g, "")),
      );
      bump(
        {
          token: region ? region.token : `R:${parcel.id}`,
          kind: "R",
          label: parcel.name,
          color: networkColor(parcel.network as any),
          freqHz: parcel.freqHz,
          motion: "pulse",
          weight: 0,
          detail: `Hub region from upload (degree ${d.toFixed(2)})`,
        },
        0.4 + 0.4 * w,
      );
    }
    bump(
      {
        token: "X:meanFC",
        kind: "X",
        label: "mean FC",
        color: "#4dc9dd",
        freqHz: 0,
        motion: "drift",
        weight: 0,
        detail: `Mean off-diagonal FC = ${ds.stats.meanFC.toFixed(3)}`,
      },
      0.7,
    );
    bump(
      {
        token: "X:entropy",
        kind: "X",
        label: "FC entropy",
        color: "#4dc9dd",
        freqHz: 0,
        motion: "shimmer",
        weight: 0,
        detail: `Normalised FC histogram entropy = ${ds.stats.entropy.toFixed(3)}`,
      },
      0.5,
    );
  }

  // Live metrics
  if (typeof input.integrity === "number") {
    bump(
      {
        token: "X:integrity",
        kind: "X",
        label: "integrity",
        color: input.integrity > 70 ? "#34c997" : input.integrity > 40 ? "#f0b154" : "#ef5765",
        freqHz: 0,
        motion: "pulse",
        weight: 0,
        detail: `Live integrity score = ${input.integrity}/100`,
      },
      0.6,
    );
  }
  if (typeof input.R === "number") {
    bump(
      {
        token: "X:R",
        kind: "X",
        label: "Kuramoto R",
        color: "#4d8dff",
        freqHz: BAND_HZ.alpha,
        motion: "spiral",
        weight: 0,
        detail: `Live Kuramoto order parameter R = ${input.R.toFixed(3)}`,
      },
      0.5,
    );
  }

  // Always emit scale rungs in play (areal, network, behavioral are always relevant)
  for (const sid of ["network", "areal", "behavioral"] as const) {
    const rung = SCALE_LADDER.find((s) => s.id === sid);
    if (rung) {
      bump(
        {
          token: `S:${rung.id}`,
          kind: "S",
          label: rung.name,
          color: "#a8b0bf",
          freqHz: 0,
          motion: "still",
          weight: 0,
          detail: `Scale rung: ${rung.name} — laws: ${rung.laws.join("; ")}`,
        },
        0.2,
      );
    }
  }

  // Sort by weight desc
  return Array.from(out.values()).sort((a, b) => b.weight - a.weight);
}

/**
 * Serialize tokens into a compact line for the AI prompt. Keeps the most
 * informative tokens within `maxChars` so we don't blow the context.
 */
export function tokensForPrompt(tokens: BrainToken[], maxChars: number = 600): string {
  if (tokens.length === 0) return "";
  const lines: string[] = ["# brain tokens (weight·token — detail)"];
  for (const t of tokens) {
    const line = `${t.weight.toFixed(2)}·${t.token} — ${t.detail}`;
    if (lines.join("\n").length + line.length > maxChars) break;
    lines.push(line);
  }
  return lines.join("\n");
}
