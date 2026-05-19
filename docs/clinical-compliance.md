# Clinical Compliance Roadmap

> **Today's posture: NOT compliant with HIPAA, GDPR Article 9, SOC 2, or
> 21 CFR Part 11.** babelForgePreview is a research instrument. No real
> PHI may be entered.

This document is the path from "research preview" to a system a clinic
could legally use.

---

## 1. Frameworks in scope

| Framework | Applies when… | Status |
|---|---|---|
| **HIPAA** (US) | We touch PHI on behalf of a covered entity. | Not started — need BAAs + technical safeguards. |
| **GDPR Art. 9** (EU) | Any EU data subject. Health data is "special category." | Not started — need lawful basis + DPIA. |
| **SOC 2 Type II** | Enterprise customers require it. | Not started — control framework needed. |
| **21 CFR Part 11** (FDA) | If output is used in regulated trials. | Out of scope until clinical-trial customers exist. |
| **HITRUST CSF** | Hospitals often request. | Out of scope — adopt only after SOC 2. |

---

## 2. HIPAA Security Rule control gap

| Control area | What HIPAA requires | What we have | Gap |
|---|---|---|---|
| Access control | Unique user IDs, automatic logoff, role-based | Anonymous app | Need auth (see `auth-roadmap.md`) |
| Audit controls | Log access to PHI | None | Need backend audit log |
| Integrity | Detect unauthorized PHI alteration | None | Need write-versioning + checksums |
| Transmission security | Encrypt PHI in motion | TLS to backend (no PHI flows today) | Maintain when PHI is added |
| Encryption at rest | Encrypt PHI at rest | `localStorage` is unencrypted | Move to backend with KMS-managed keys |
| Workstation security | Lock screens / device controls | Out of our control | Document in customer-facing playbook |
| Contingency | Backup + disaster recovery | None | Backend RPO/RTO targets needed |
| Sanctions | Workforce training, sanctions | N/A | Operational policy needed |

---

## 3. Vendor BAAs to procure (in order)

1. **Hosting** — GCP Cloud Run (existing) — BAA available, must be requested.
2. **Identity provider** — see `auth-roadmap.md`.
3. **AI vendor** — Gemini API touches user input. If patient context ever goes into a prompt, we need a BAA from Google Cloud (Vertex AI), not generative-language-api. **Today: do not send PHI to `/api/chat`.**
4. **Email / notifications** — pick vendor with BAA (Postmark, SendGrid).
5. **Error tracking** — Sentry has a HIPAA-eligible plan; scrub PHI from breadcrumbs.

---

## 4. Data-classification rules (enforce now even though no PHI flows)

| Class | Examples | Where allowed today |
|---|---|---|
| Public | Marketing copy, methodology docs | Anywhere |
| Internal | Aggregate cohort stats, anonymized N | Anywhere |
| Confidential | De-identified surrogates (initials, age range) | localStorage only |
| Restricted (PHI) | Real names, DOB, MRN, address, biometrics tied to identity | **Nowhere in this build.** |

The Patient form's HIPAA banner enforces this verbally; we should add a
client-side regex tripwire for obvious offenders (e.g. 9-digit numeric
strings → block save with a warning) before we let real users in.

---

## 5. Required documents (none exist yet)

- [ ] Privacy Notice (HIPAA Notice of Privacy Practices when covered)
- [ ] Terms of Service
- [ ] DPA template (for GDPR controllers)
- [ ] BAA template (for HIPAA covered entities)
- [ ] Acceptable Use Policy
- [ ] Incident Response Runbook
- [ ] Data Retention & Deletion Policy
- [ ] Subprocessor list

---

## 6. Engineering controls to add before any PHI is permitted

1. Auth + RBAC end-to-end (see `auth-roadmap.md` Phase C+).
2. Audit log table — append-only — every PHI read/write.
3. Field-level encryption envelope for PHI columns.
4. Backup encryption + restore drill (quarterly).
5. PHI redaction in error tracking + application logs.
6. Penetration test (annually).
7. Vulnerability scanning (Dependabot already, add Snyk/Trivy).
8. Secrets management (no secrets in `next.config.js`; use GCP Secret Manager).
