# Auth & Identity Roadmap

> Status (May 2026): **Anonymous.** No user accounts. App is a single-tenant
> research preview running entirely client-side, hitting a public FastAPI
> backend. Patient records live in browser `localStorage`.

The scaffolding already in the repo is intentionally minimal so the app
keeps working with zero auth, while every future surface that *will* need
identity can already speak to the right abstraction.

---

## Already in the repo

| File | What it gives us |
|---|---|
| `frontend/src/lib/auth/types.ts` | `User`, `Organization`, `Session`, `Role`, `Plan`, `Capability`, `can()` capability matrix, `PLAN_FEATURES` quota table. |
| `frontend/src/lib/auth/client.ts` | `authClient` — local demo provider. **This is the single swap-out point.** Replace its body with the real provider's SDK calls; nothing else in the app needs to change. |
| `frontend/src/context/AuthContext.tsx` | React provider + `useAuth()` hook. Currently NOT wired into `app/layout.tsx` so the app boots unauthenticated. |
| `frontend/src/context/UserModeContext.tsx` | UX mode (`explorer` / `patient` / `clinical`). Tolerates a missing AuthProvider — falls back to anonymous defaults. |
| `frontend/src/lib/patient/store.ts` | Local patient store. Key namespace `babelforge:patients:v1` — must become `babelforge:patients:v1:<orgId>` once we have orgs. |

---

## Provider trade-off matrix

| Provider | Multi-tenant orgs | BAA available | Cost at 100 clinicians | Notes |
|---|---|---|---|---|
| **Clerk** | Native (Organizations API) | Yes, on Enterprise | ~$25 + $0.02/MAU | Fastest path to multi-tenant. Drop-in React components. |
| **Auth0** | Yes (Organizations) | Yes (HIPAA add-on) | $240+/mo at clinician scale | Mature. Heavier integration. |
| **Supabase Auth** | Manual (via RLS) | Yes on Team/Enterprise | $25+/mo | Pairs naturally if we also adopt Supabase Postgres. |
| **AWS Cognito** | Manual (groups) | Yes (BAA across AWS) | ~$0.0055/MAU | Best if backend goes ECS/Fargate in AWS. |
| **Custom OIDC on FastAPI** | We build it | We build it | Eng time only | Maximum control, maximum compliance burden. |

**Recommendation:** Clerk for v1 (orgs out of the box, BAA available),
revisit at the SOC 2 milestone.

---

## Phased rollout

### Phase A — Optional sign-in (no gating)
- Wire `AuthProvider` into `app/layout.tsx`.
- Add `<AccountMenu />` to the Navbar (sign in / out / role badge).
- All routes still render anonymously. Signed-in users gain: cloud-synced patient cohort, shareable cohort links, AI assistant context memory.

### Phase B — Org-scoped data
- Introduce `orgId` namespacing in `patientStore` (`babelforge:patients:v1:<orgId>`).
- Migrate any pre-existing anonymous records into the user's default org on first sign-in (one-shot migration on `AuthContext` `signedIn` event).
- Add `<RoleGate capability="patient.write">` around prescribing surfaces.

### Phase C — Server-side identity
- Backend (`backend/main.py`) adds an OIDC verifier middleware.
- Patient store dual-writes to backend behind a feature flag.
- Once backend-of-record is authoritative, demote `localStorage` to cache.

### Phase D — SSO / Enterprise
- SAML for hospital identity providers (Okta, Azure AD).
- SCIM provisioning for cohort onboarding.
- Audit log surfaces at `/admin/audit`.

---

## Acceptance criteria for "we can stop calling it a preview"

1. All PHI write paths require an authenticated, role-checked, audit-logged transaction.
2. `authClient` is no longer the demo impl.
3. `localStorage` no longer holds anything tagged `// PHI` in `types.ts` — it's a cache only.
4. BAA on file with: identity provider, hosting provider, AI vendor (if AI gets PHI context).
5. SOC 2 Type I report (Type II within 12 months).

---

## Swap-out checklist (when we pick the provider)

- [ ] Replace bodies in `frontend/src/lib/auth/client.ts` (`signIn`, `signOut`, `getSession`, `subscribe`).
- [ ] Map provider's user shape → our `User` interface in `types.ts`.
- [ ] Map provider's org shape → our `Organization` interface.
- [ ] Wire `<AuthProvider>` in `app/layout.tsx`.
- [ ] Add provider's React SDK to `frontend/package.json`.
- [ ] Add `.env.local` keys; document them in `frontend/README.md`.
- [ ] Add Playwright smoke test: sign in → see account menu → sign out.
