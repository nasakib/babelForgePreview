# SaaS Architecture — Target State

> Today: single-page Next.js front-end + stateless FastAPI backend on
> Cloud Run, no auth, no per-user data. This document is the destination.

---

## Tenant model

```
Organization (clinic / lab)
├── billing.plan: preview | clinical | enterprise
├── billing.baaSigned: bool
├── Users
│   ├── role: owner | clinician | researcher | viewer
│   └── (each user belongs to exactly one org in v1; multi-org in v2)
└── Patients
    ├── owned by org, not user
    └── access controlled by role (see lib/auth/types.ts CAPABILITIES)
```

Single-org-per-user keeps v1 simple. The capability matrix already
accommodates multi-org by promoting `Role` to `OrgMembership`.

---

## Data plane

| Layer | Today | Target |
|---|---|---|
| Identity | none | Clerk (or equivalent) → JWT |
| Front-end state | localStorage | localStorage cache + server hydration |
| Patient storage | localStorage | Postgres (Cloud SQL) with row-level org filter |
| Topology computations | FastAPI on Cloud Run, stateless | Same. Add per-org rate limits. |
| AI assistant | FastAPI proxy to Gemini | Vertex AI under GCP BAA (only when patient context is enabled) |
| File uploads (fMRI) | direct FastAPI upload | GCS signed URLs, scoped to `orgId/userId/runId` |
| Audit log | none | BigQuery append-only `audit_events` |

---

## Service boundaries

```
[Browser]
   │  JWT
   ▼
[Next.js (SSR optional)]
   │  pass-through JWT
   ▼
[FastAPI gateway]──verify JWT, attach orgId
   ├──▶ topology service (CPU-bound, stateless)
   ├──▶ pharma service (catalog lookup, projection)
   ├──▶ patient service (Postgres + RLS)
   ├──▶ ai service (proxy, scrubs PHI from prompts unless BAA met)
   └──▶ audit service (fire-and-forget pub/sub → BigQuery)
```

`topology` and `pharma` stay stateless and can scale to zero.
`patient` and `audit` are the only stateful services.

---

## Billing model (Stripe)

| Plan | Price (USD/mo) | maxPatients | BAA available | Limits |
|---|---|---|---|---|
| Preview | Free | 5 | No | Public AI assistant, no PHI |
| Clinical | $99/clinician | 250 | Yes | Audit log, exports, BAA |
| Enterprise | Custom | ∞ | Yes | SSO, dedicated tenant, SLO 99.9% |

`PLAN_FEATURES` in `frontend/src/lib/auth/types.ts` is the canonical
table; the billing UI reads from it so plan changes propagate.

---

## Observability targets

| Signal | Target |
|---|---|
| Request error rate | < 0.1% rolling 24h |
| AI assistant p95 latency | < 4s |
| Topology compute p95 | < 1.5s |
| Audit log lag (write → BigQuery) | < 60s |
| Uptime SLO (clinical plan) | 99.5% |

Stack: Cloud Run native metrics → Cloud Monitoring → PagerDuty for SEV-1.

---

## Tenancy isolation tests (must exist before GA)

1. Cross-org Patient read returns 404 (not 403 — do not leak existence).
2. JWT swap mid-request fails with audit event.
3. Export endpoint returns only requesting org's rows.
4. Audit events themselves are read-only and org-scoped.
5. Stripe webhook signatures verified server-side; replay rejected.
