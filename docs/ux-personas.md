# UX Personas & Mode Strategy

Three audiences share one app via the `UserMode` switch
(`frontend/src/lib/ux/mode.ts`). Mode is a UX dimension; `Role` is a
permission dimension; they are independent so a clinician can demo
"explorer mode" to a patient without losing permissions.

---

## Persona 1 — Explorer (novice / curious public)

| Goal | "I want to understand what this thing does." |
|---|---|
| Default landing | `/welcome` |
| Visible modules | Console (narrated), 11D topology, Signal analyzer (single band), Compounds (read-only), Docs |
| Hidden | Stack Builder prescribing controls, Pharma projection numbers without legend, Patients |
| Voice | Plain language. No acronyms without `<Glossary>` tooltip. |
| Safety footer | "Research simulation. Not medical advice." |
| Onboarding | 4-step product tour on first load. |

## Persona 2 — Patient

| Goal | "Track how I feel; share it with my clinician." |
|---|---|
| Default landing | `/my-health` |
| Visible modules | My Health (own record), Self-report scales, Symptom diary, Compounds (read-only education), Docs (patient-flavored) |
| Hidden | Cohort, prescribing, other patients |
| Voice | Plain language. Always reference "your clinician," never give advice. |
| Safety footer | "Does not diagnose or treat. In crisis, call your local emergency services or crisis line." |
| Onboarding | 1-screen explainer + consent banner. |

## Persona 3 — Clinician / Researcher

| Goal | "Run simulations against this patient. Compare regimens. Decide." |
|---|---|
| Default landing | `/` (Console) |
| Visible modules | Everything. Stack Builder, Pharma Projection, Patients, Cohort. |
| Hidden | Onboarding overlays after first dismiss. |
| Voice | Technical. Domain acronyms used directly. |
| Safety footer | "Research instrument. Not a substitute for clinical judgment." |
| Onboarding | Single tour of new modules per release. |

---

## Mode-aware components (to build)

| Component | Purpose |
|---|---|
| `<ModeAware show={['clinical']}>` | Wraps any clinical-only UI. Renders null in other modes. |
| `<Glossary term="Kuramoto">` | Wraps jargon. In `explorer`/`patient` mode, becomes a hover tooltip with plain-language definition. In `clinical` mode, renders the term unchanged. |
| `<SafetyFooter />` | Reads `DISCLAIMERS[mode.disclaimer]`. Render once per page. |
| `<ModeSwitcher />` | In account menu. Constrained by `allowedModesForRole`. |
| `<OnboardingWizard />` | 3-card persona picker on first load. Persists to `babelforge:onboarding:v1`. |

These are NOT built yet — they are listed here so the next implementation
pass has a contract to code against.

---

## Glossary terms to seed (minimum 40)

> Plain-language definitions live in a future `frontend/src/lib/ux/glossary.ts`. Suggested initial set:

Kuramoto, oscillator, phase, coherence, integrity score, topology, clique, network, parcel, Schaefer-200, DMN (Default Mode Network), salience network, executive control, alpha/beta/gamma/delta/theta band, PHQ-9, GAD-7, PCL-5, ASRS, YGTSS, MoCA, AUDIT-C, CYP2D6, CYP2C19, pharmacogenomics, ultrarapid metabolizer, poor metabolizer, dopamine, serotonin, GABA, glutamate, NMDA, SSRI, SNRI, stimulant, atomoxetine, guanfacine, methylphenidate, sertraline, comorbidity, severity, regimen, dose, schedule, BAA, PHI.

Each entry: `{ term, short (one line), long (one paragraph), seeAlso?[] }`.
