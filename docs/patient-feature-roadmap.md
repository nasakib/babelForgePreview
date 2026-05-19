# Patient Module — Feature Roadmap

> Source of truth for the Patients workstream. The user has explicitly
> named HIPAA as a *future* concern, so every phase below ships with the
> safety posture of "no real PHI may be entered yet."

---

## Phase 0 — Foundation (DONE)

- `frontend/src/lib/patient/types.ts` — full domain model + clinical scales + PGx + helper fns.
- `frontend/src/lib/patient/store.ts` — local-first store with pub/sub, export, purge.
- `frontend/src/components/patient/HipaaNotice.tsx` — privacy banner.
- `frontend/src/context/PatientContext.tsx` — reactive bridge to `AIContext`.

## Phase 1 — Minimum usable cohort (NEXT)

- `components/patient/PatientForm.tsx`
  - Sections: Identifiers → Demographics → Biometrics → Allergies/Meds → Pathologies → Scales → PGx → Vitals → Notes.
  - Live banding chips for PHQ-9, GAD-7.
  - Save / Cancel.
- `components/patient/PatientList.tsx`
  - Sorted by `updatedAt`. Set Active. Delete (with confirm). Purge All. Export JSON.
- `components/patient/PatientCard.tsx`
  - Read-only summary tile.
- `app/patients/page.tsx`
  - Two-pane (list + form/detail).
- Wire `PatientProvider` into `app/layout.tsx`.
- Add `/patients` to `NAV_ITEMS` (F10) in `Navbar.tsx`.

## Phase 2 — Patient-facing surface

- `app/my-health/page.tsx` (active in `patient` UX mode only).
- Self-report scale entry (PHQ-9 / GAD-7 quick-take with plain-language items).
- Symptom diary (mood, sleep, side-effects) with weekly trendlines.
- "Share with clinician" → exports a single-patient JSON or PDF.
- Crisis disclaimer footer.

## Phase 3 — Clinician workflow integration

- Active patient → auto-loads pathologies into Console topology composer (DONE in `PatientContext`).
- Active patient → CYP phenotypes adjust Stack Simulator dose suggestions via `cypDoseMultiplier()`.
- Patient → printable encounter note (regimen + integrity score delta + rationale).

## Phase 4 — Longitudinal / cohort analytics

- Trendlines per scale per patient.
- Cohort aggregate view (no individual identifiers).
- Compare-by-cohort: response rates per regimen across pathology bucket.

## Phase 5 — Server-side (gated on auth + BAA)

- Backend persistence — see `clinical-compliance.md` Section 6.
- Multi-user write conflict resolution.
- Patient-portal invites (clinician → patient sign-up link).
- Encrypted PHI fields with field-level keys.

---

## UX rules (apply to every phase)

1. **No DOB, no full name, no full address** — form must refuse to save them. Tripwire planned: regex catch on save, soft block with explanation.
2. **HIPAA banner stays sticky** on every patient surface until BAA is in place.
3. **Active patient chip** in Navbar should be visible everywhere so clinicians always know whose record drives the current simulation.
4. **Severity is required** when a pathology is added — drives downstream simulation weighting.
5. Pathology codes are the same enum the Console already uses; do not introduce a parallel taxonomy.

---

## Open questions

- Do we want a "clinician handoff" PDF, or only JSON/FHIR export?
- Do we adopt FHIR R4 `Patient` + `Observation` shapes now, or stay on the internal shape until backend lands?
  - Leaning: internal shape now, FHIR projection at backend cutover.
- How do we treat pediatric records? Currently age range `{0,17}` is supported but consent/assent UX is undefined.
