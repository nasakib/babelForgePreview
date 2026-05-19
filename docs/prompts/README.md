# Clinician Prompt Library

A working set of prompts the in-app AI assistant (or a clinician
directly) can use against the babelForge simulation context. Each prompt
is a starting template — clinicians should edit before sending and
must never paste real PHI.

## Index

| File | Use case |
|---|---|
| [`diagnostic-narrative.md`](diagnostic-narrative.md) | Translate a topology + scale snapshot into a clinical narrative. |
| [`regimen-rationale.md`](regimen-rationale.md) | Explain *why* a proposed stack should move the integrity score the way the model predicts. |
| [`patient-explainer.md`](patient-explainer.md) | Rewrite a clinical finding in plain language for a patient. |
| [`differential.md`](differential.md) | Suggest differential considerations given a symptom + scale profile. |
| [`pgx-dosing.md`](pgx-dosing.md) | Apply CPIC-style dose multipliers to a proposed regimen. |
| [`safety-screen.md`](safety-screen.md) | Pre-prescribing safety check (pregnancy, allergy, HLA risk alleles, polypharmacy). |
| [`encounter-summary.md`](encounter-summary.md) | One-page encounter note from session state. |
| [`research-question.md`](research-question.md) | Frame a research question against the simulation primitives. |

## Conventions used in every prompt

- `{{PATIENT_SUMMARY}}` — placeholder for a **de-identified** summary (age range, sex, pathology codes, scale scores). Never substitute real identifiers.
- `{{TOPOLOGY_STATE}}` — placeholder for `{ activePathologies, integrityScore, viewPerspective }` JSON.
- `{{STACK}}` — placeholder for proposed regimen list.
- `{{MODE}}` — `explorer` | `patient` | `clinical` — controls voice.

Every prompt ends with the same trailer:

> Treat this output as **decision support, not a decision**. Do not present it to a patient verbatim without clinician review.
