/**
 * Centralized client for the babelForge FastAPI backend.
 *
 * Single source of truth for the backend URL, endpoints, request/response
 * shapes, and timeout policy. Every UI surface that touches the API should
 * go through this module so the docs and behaviour stay in lockstep.
 *
 * Backend repo: babelForge (FastAPI / Cloud Run)
 * Frontend repo: babelForgePreview (this project)
 */

export const BABELFORGE_API_URL: string =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "https://babelforge-backend-6zvkkshyoq-uc.a.run.app";

export const DEFAULT_TIMEOUT_MS = 10_000;

export type ApiEndpointMethod = "GET" | "POST";

export interface ApiEndpointDoc {
  method: ApiEndpointMethod;
  path: string;
  title: string;
  /** One-paragraph clinical-grade description for the docs page. */
  description: string;
  /** Optional curl-style payload example. */
  requestExample?: string;
  /** Optional shape note describing the response. */
  responseShape?: string;
  /** Whether this endpoint requires a server-side secret (e.g. GEMINI_API_KEY). */
  requiresSecret?: boolean;
}

/**
 * Canonical endpoint catalog. Surfaced 1:1 in the in-app docs page so
 * users always see what the deployed backend actually exposes.
 */
export const BABELFORGE_ENDPOINTS: ApiEndpointDoc[] = [
  {
    method: "GET",
    path: "/api/health",
    title: "Health probe",
    description:
      "Lightweight liveness check used by the Navbar status badge and the in-app docs page to confirm the backend is reachable.",
    responseShape: '{ "status": "healthy" }',
  },
  {
    method: "GET",
    path: "/api/topology",
    title: "Healthy topology + pathology modifiers",
    description:
      "Returns a Schaefer-style baseline connectome (≈200 nodes) plus additive topological modifiers for PTSD, ADHD, Tourette's and Depression. Modifiers list added/removed edges and added/removed cliques, allowing the client to compose comorbid states on the fly.",
    responseShape:
      '{ baseline: { nodes, edges, cliques, stats }, modifiers: { PTSD, ADHD, TOURETTES, DEPRESSION } }',
  },
  {
    method: "GET",
    path: "/api/pharma",
    title: "Pharmacopeia projection",
    description:
      "Returns the pharmacological projection used by the Pharma Projection page: candidate compound nodes, pre/post-treatment edge sets, and a curated drug list (precision, conventional, recreational, functional).",
    responseShape: "{ nodes, states: { pre_treatment, post_treatment }, drugs }",
  },
  {
    method: "POST",
    path: "/api/chat",
    title: "FORGEai clinical assistant",
    description:
      "Forwards a free-text query plus the current UI context (module, pathologies, stack, integrity score) to a Gemini 1.5 Flash model with a babelForge-tuned system prompt. Returns a single textual response. Falls back to a local heuristic responder if the backend or secret is unavailable.",
    requestExample:
      'POST /api/chat\n{\n  "message": "Explain the topological collapse in PTSD",\n  "context": { "module": "stack-simulator", "pathologies": ["PTSD"], "stack": [], "integrityScore": 72 }\n}',
    responseShape: '{ "response": string }',
    requiresSecret: true,
  },
  {
    method: "POST",
    path: "/api/fmri/analyze",
    title: "fMRI ingest + topology extraction",
    description:
      "Accepts a BOLD file upload (multipart/form-data, field name 'file'), simulates the extraction pipeline and returns a patient-specific topology with detected pathologies. In production this is wired to a nilearn/nibabel pipeline; the preview returns deterministic synthetic output.",
    requestExample: 'POST /api/fmri/analyze  (multipart/form-data)\n  file: <BOLD.nii.gz>',
    responseShape:
      '{ filename, status, diagnostic_profile: string[], topology: { nodes, edges, stats } }',
  },
  {
    method: "POST",
    path: "/api/simulate",
    title: "Experience Simulator",
    description:
      "Accepts natural language text describing a subjective experience, intervention, or state, and maps it to the engine's 4D pharmacological/topological vector space (arousal, dampening, chaos, repair). Uses Gemini 1.5 Flash.",
    requestExample:
      'POST /api/simulate\n{\n  "experience": "I just ran 5 miles and then meditated",\n  "context": { "pathologies": [] }\n}',
    responseShape: '{ "arousal": float, "dampening": float, "chaos": float, "repair": float, "label": string, "desc": string, "subj": string }',
    requiresSecret: true,
  },
  {
    method: "POST",
    path: "/api/optimize",
    title: "Dual-Pathway Auto-Optimizer",
    description:
      "Accepts the active pathology state names and patient metrics. Runs both a categorical greedy search over the compound database and a continuous 4D vector space gradient descent solver to locate the mathematically ideal intervention vectors.",
    requestExample:
      'POST /api/optimize\n{\n  "states": ["depression", "adhd"],\n  "weightKg": 70,\n  "ageYears": 35\n}',
    responseShape: '{ "greedy_optimal_stack": [{ id, name, dose }], "greedy_reasoning": string[], "projected_greedy_integrity": float, "continuous_mathematical_solver": { target_vectors, recommended_match } }',
  },
];

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeout = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${BABELFORGE_API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new ApiError(`API ${res.status} ${res.statusText}`, res.status);
    return (await res.json()) as T;
  } catch (err: any) {
    if (err?.name === "AbortError") throw new ApiError("Request timed out", 0);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || "Network error", 0);
  } finally {
    clearTimeout(t);
  }
}

export interface HealthResponse { status: string }
export interface ChatResponse { response: string }
export interface ChatContext {
  module?: string;
  pathologies?: string[];
  stack?: Array<{ name: string; dose: number | string }>;
  integrityScore?: number;
}

export const babelforgeApi = {
  baseUrl: BABELFORGE_API_URL,
  endpoints: BABELFORGE_ENDPOINTS,

  health: (timeout = 4000) =>
    request<HealthResponse>("/api/health", { method: "GET" }, timeout),

  topology: () => request<any>("/api/topology", { method: "GET" }),

  pharma: () => request<any>("/api/pharma", { method: "GET" }),

  chat: (message: string, context: ChatContext = {}) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    }),

  simulate: (experience: string, context: ChatContext = {}) =>
    request<any>("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experience, context }),
    }),

  optimize: (states: string[], patient: { weightKg?: number; ageYears?: number; toleranceMonths?: number; simulationTimeMonths?: number } = {}) =>
    request<any>("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ states, ...patient }),
    }),

  fmri: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<any>(
      "/api/fmri/analyze",
      { method: "POST", body: form },
      60_000
    );
  },
};
