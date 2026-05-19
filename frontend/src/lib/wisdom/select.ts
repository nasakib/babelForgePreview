/**
 * babelForge — Wisdom relevance ranker.
 *
 * Pure scoring: given current `WisdomState`, return the top-K insights
 * from the corpus most relevant to that state. No model calls, no async.
 *
 * Ranking is deliberately transparent: every match adds a documented
 * weight, and `score()` is the sum. We don't use ML here because the
 * corpus is small and explainability is a feature — a clinician should
 * be able to read the rules and tell why an insight surfaced.
 */

import { WISDOM_CORPUS } from "./corpus";
import type { Citation, Insight, WisdomContext, WisdomState } from "./types";

// Per-match weights, tuned so a single strong contextual match (pathology
// or module) ranks above a generic "always" entry, and metric-triggered
// alerts (e.g. low integrity) outrank passive context matches.
const W = {
  module: 2,
  pathology: 3,
  compoundClass: 2.5,
  compound: 4,
  metricMatch: 5,
  always: 0.4,
} as const;

function contextScore(ctx: WisdomContext, state: WisdomState): number {
  switch (ctx.kind) {
    case "always":
      return W.always;
    case "module":
      return state.module === ctx.module ? W.module : 0;
    case "pathology":
      return state.pathologies.includes(ctx.pathology) ? W.pathology : 0;
    case "compound-class":
      return state.stack.some((s) => s.class === ctx.class) ? W.compoundClass : 0;
    case "compound":
      return state.stack.some((s) => s.id === ctx.id) ? W.compound : 0;
    case "metric": {
      const val =
        ctx.key === "integrity"
          ? state.integrity
          : ctx.key === "R"
            ? state.R
            : ctx.key === "K"
              ? state.K
              : null;
      if (val == null) return 0;
      const aboveOk = ctx.above == null || val > ctx.above;
      const belowOk = ctx.below == null || val < ctx.below;
      // If neither bound is specified, presence of the metric alone counts.
      if (ctx.above == null && ctx.below == null) return W.metricMatch * 0.4;
      return aboveOk && belowOk ? W.metricMatch : 0;
    }
  }
}

export function score(insight: Insight, state: WisdomState): number {
  let s = 0;
  for (const ctx of insight.contexts) s += contextScore(ctx, state);
  // Multiply by self-confidence so high-confidence entries break ties.
  return s * (0.5 + 0.5 * insight.confidence);
}

export interface RankedInsight extends Insight {
  /** Computed relevance score for the active state. */
  _score: number;
}

/**
 * Returns the top `limit` insights sorted by relevance to `state`.
 * Insights with zero score are dropped.
 */
export function selectInsights(state: WisdomState, limit = 5): RankedInsight[] {
  const ranked: RankedInsight[] = [];
  for (const ins of WISDOM_CORPUS) {
    const s = score(ins, state);
    if (s > 0) ranked.push({ ...ins, _score: s });
  }
  ranked.sort((a, b) => b._score - a._score);
  return ranked.slice(0, limit);
}

/** Build a clickable URL for a citation. */
export function citationUrl(c: Citation): string | null {
  if (c.url) return c.url;
  switch (c.scheme) {
    case "doi":
      return `https://doi.org/${c.id}`;
    case "pmid":
      return `https://pubmed.ncbi.nlm.nih.gov/${c.id}/`;
    case "arxiv":
      return `https://arxiv.org/abs/${c.id}`;
    case "fda":
      return null; // FDA dockets vary; rely on `url` field if provided.
    case "url":
      return null;
  }
}

/**
 * Compact, model-friendly serialization of ranked wisdom — passed to the
 * AI assistant as grounding context so it cites the corpus instead of
 * hallucinating references. Kept under ~1 KB by design.
 */
export function wisdomForPrompt(ranked: RankedInsight[]): string {
  if (ranked.length === 0) return "";
  const lines = ranked.map((r) => {
    const cite = r.citations
      .map((c) => `${c.label} [${c.scheme}:${c.id}]`)
      .join("; ");
    const caveat = r.caveats?.length ? ` Caveats: ${r.caveats.join(" ")}` : "";
    return `- (${r.evidence}, conf=${r.confidence.toFixed(2)}) ${r.claim}${caveat} Sources: ${cite}`;
  });
  return `Grounding evidence (cite by source label when relevant):\n${lines.join("\n")}`;
}
