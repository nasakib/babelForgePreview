/**
 * babelForge — Wisdom layer.
 *
 * "Wisdom" = curated, citation-grounded clinical and scientific insights
 * with provenance, confidence, and caveats. This is the *epistemic
 * substrate* of the engine: it converts ambient state (which module is
 * open, which pathologies are active, what compounds are stacked, what
 * the current integrity score is) into a small set of relevant,
 * literature-anchored claims.
 *
 * Why this exists separately from the simulation engine:
 *   - Simulation answers "what happens if". Wisdom answers "what do we
 *     actually know, and how well".
 *   - The AI assistant uses Wisdom as grounding context so it cites
 *     instead of confabulates.
 *   - The UI surfaces 1–3 insights contextually so the user never sees a
 *     metric without an interpretive frame.
 *
 * Provenance discipline: every Insight MUST carry at least one Citation
 * with a real DOI / PMID / FDA docket. We do not invent references.
 *
 * This file defines types only. The corpus lives in `corpus.ts` and the
 * relevance ranker lives in `select.ts`.
 */

/** Strength of evidence behind a claim. Mirrors GRADE / OCEBM levels. */
export type EvidenceTier =
  | "guideline"     // formal clinical guideline (APA, NICE, WHO, FDA label)
  | "meta-analysis" // pooled RCT evidence
  | "rct"           // single randomized controlled trial
  | "cohort"        // prospective observational / longitudinal
  | "mechanistic"   // bench science, well-replicated
  | "theoretical";  // model-derived, not yet validated empirically

/** Where an insight is contextually relevant. */
export type WisdomContext =
  | { kind: "module"; module: string }
  | { kind: "pathology"; pathology: string }
  | { kind: "compound-class"; class: string }
  | { kind: "compound"; id: string }
  | { kind: "metric"; key: "integrity" | "R" | "K" | "tolerance"; below?: number; above?: number }
  | { kind: "always" };

export interface Citation {
  /** Display label, e.g. "Yeo et al., 2011, J Neurophysiol". */
  label: string;
  /** Stable identifier: DOI, PMID, FDA docket, arXiv id. */
  id: string;
  /** Identifier scheme. */
  scheme: "doi" | "pmid" | "fda" | "arxiv" | "url";
  /** Optional canonical URL. */
  url?: string;
  /** Publication year for quick recency assessment. */
  year: number;
}

export interface Insight {
  /** Stable id (kebab-case, unique within corpus). */
  id: string;
  /** One-sentence claim, written for a clinically literate reader. */
  claim: string;
  /** 1–3 sentence expansion, optional. */
  detail?: string;
  /** Category for grouping in UI. */
  category:
    | "neuroscience"
    | "psychiatry"
    | "pharmacology"
    | "topology"
    | "dynamics"
    | "measurement"
    | "ethics";
  evidence: EvidenceTier;
  /** Confidence the engine assigns to surfacing this in context (0–1). */
  confidence: number;
  /** Optional list of caveats / contraindications. */
  caveats?: string[];
  /** When this insight is relevant. Any match triggers ranking. */
  contexts: WisdomContext[];
  /** Required: at least one citation. */
  citations: Citation[];
}

/** Snapshot of app state used to rank wisdom relevance. */
export interface WisdomState {
  module: string | null;
  pathologies: string[];
  stack: { id?: string; name: string; class?: string; dose?: number }[];
  integrity: number | null;
  R?: number | null;
  K?: number | null;
}
