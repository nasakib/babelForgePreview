# babelForge — Planning Bundle

This folder is the **forward-planning workspace** for babelForge. Nothing
here is wired into the running app. It exists so the next engineer
(human or agent) can read one folder and know what we intend to build,
why, and in what order.

| File | Purpose |
|---|---|
| [`BABELFORGE_MASTER_OPERATOR_MANUAL.md`](BABELFORGE_MASTER_OPERATOR_MANUAL.md) | **The Master Operator & Engineering Manual:** The single source of truth detailing the high-dimensional algebraic topology engine, Kuramoto dynamics, clinical optimization framework, ProTox-3.0 toxicity criteria, Yunnan mushroom kinetics, comparative diagnostics, and operational guidelines. |
| [`auth-roadmap.md`](auth-roadmap.md) | How we evolve from anonymous → multi-tenant SaaS auth. Provider trade-offs, swap-out boundary, migration steps. |
| [`clinical-compliance.md`](clinical-compliance.md) | HIPAA / GDPR / SOC 2 / 21 CFR Part 11 posture, gap analysis, controls roadmap. |
| [`patient-feature-roadmap.md`](patient-feature-roadmap.md) | The patient module phased plan (cohort, scales, PGx, longitudinal). |
| [`saas-architecture.md`](saas-architecture.md) | Multi-tenant data model, billing, isolation, observability. |
| [`ux-personas.md`](ux-personas.md) | Three audiences (Explorer / Patient / Clinician) and how the UX flexes per mode. |
| [`prompts/`](prompts/) | Prompt templates a clinician (or the in-app AI assistant) can paste — diagnostic narrative, regimen rationale, patient-friendly explanations. |

## How to use this folder

- When picking up work, **read [`patient-feature-roadmap.md`](patient-feature-roadmap.md) first** — that's the live workstream.
- When integrating a real auth provider, follow [`auth-roadmap.md`](auth-roadmap.md) — the swap-out boundary is already in place at `frontend/src/lib/auth/client.ts`.
- Before touching anything that could store PHI on a backend, read [`clinical-compliance.md`](clinical-compliance.md). Today the answer is "no backend storage of PHI, period."
