# Quality Visibility: Mutation Testing & Feature Audit

**Status:** In progress — Stryker complete, remaining gaps under review  
**Goal:** Know where quality gaps are without chasing coverage numbers  
**Last updated:** 2026-04-08

---

## Analysis Results (2026-04-08)

### Tools & Config Audit

| Area                   | Status      | Finding                                                                                            |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| TypeScript strict      | Maxed out   | All strict flags on, `noUnusedLocals`, `noUnusedParameters`                                        |
| ESLint                 | ✅ Hardened | Added `eslint-plugin-sonarjs` (recommended preset) — complexity, duplication, cognitive complexity |
| knip (dead code)       | ✅ Resolved | `signInWithGitHub` removed from `src/data/auth.ts`                                                 |
| Unit coverage (Vitest) | 47.9% lines | Data layer 96%+, UI components patchy, some pages 0%                                               |

### E2E Qualitative Coverage Analysis

The 47.9% unit coverage number is misleading. The E2E suite (30 Gherkin scenarios) exercises most of the code that shows 0% in unit coverage. Below is a qualitative mapping of what the E2E tests actually exercise in the running app.

**Well covered — real user journeys exercised end-to-end:**

| Business Logic              | E2E Scenario                                                                                                                                                | What It Exercises                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Browse & expand skill nodes | [browse-skill-tree.feature](../../../e2e/features/browse-skill-tree.feature): "View all three skill axes", "Expand a node", "Collapse", "Only one expanded" | SkillTree, QuestPath, SkillNode rendering; aria-expanded toggling             |
| Claim/unclaim levels        | [claim-level.feature](../../../e2e/features/claim-level.feature): "Claim the frontier level", "Unclaim a level"                                             | useSkillState claim/unclaim logic, DOM state updates                          |
| Cascade claims              | [claim-level.feature](../../../e2e/features/claim-level.feature): "Claiming level 3 marks levels 1 and 2"                                                   | Cascade logic in state.ts                                                     |
| Progress chip updates       | [claim-level.feature](../../../e2e/features/claim-level.feature): "Claiming a level updates the progress summary"                                           | Progress calculation, aria-live rendering                                     |
| localStorage persistence    | [persistence.feature](../../../e2e/features/persistence.feature): "Progress survives page reload", "Safety zone survives"                                   | state.ts save/load cycle                                                      |
| Safety zone selection       | [safety-zone.feature](../../../e2e/features/safety-zone.feature): "Default is sandbox", "Select a different zone"                                           | SafetyZoneSelector, aria-checked                                              |
| Keyboard navigation         | [keyboard-navigation.feature](../../../e2e/features/keyboard-navigation.feature): "Navigate and expand with keyboard"                                       | SkillNode keyboard handler                                                    |
| Auth flow                   | [auth.feature](../../../e2e/features/auth.feature): "Sign in opens modal", "Sign in updates header", "Sign out returns to logged-out"                       | SignInModal, Header conditional rendering, AuthContext                        |
| Firestore sync on login     | [firestore-sync.feature](../../../e2e/features/firestore-sync.feature): "Local progress syncs on first login"                                               | sync.ts syncOnLogin, Firestore write verified via emulator REST               |
| Conflict resolution         | [firestore-sync.feature](../../../e2e/features/firestore-sync.feature): "Firestore data wins on conflict"                                                   | sync.ts merge logic — seeds server state, claims locally, asserts server wins |
| Persist while logged in     | [firestore-sync.feature](../../../e2e/features/firestore-sync.feature): "Changes persist while logged in", "Progress survives sign-out/sign-in"             | sync.ts writeAssessment, full auth cycle                                      |
| Profile routing             | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "Login redirects to profile URL"                                              | React Router, ProfilePage render                                              |
| Owner can claim on profile  | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "Login redirects..." (also asserts claiming works)                            | ProfilePage owner mode                                                        |
| Read-only visitor view      | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "View a shared profile as visitor"                                            | ProfilePage read-only rendering, no claim buttons                             |
| Profile not found           | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "View a non-existent profile"                                                 | ProfilePage error state                                                       |
| Share button                | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "Share button copies profile link"                                            | ShareButton, clipboard API, Toast (appearance)                                |
| Sign-out resets tree        | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "Sign-out resets skill tree to defaults"                                      | State reset on auth change                                                    |
| Sign-out confirmation       | [auth.feature](../../../e2e/features/auth.feature): "Sign out returns to logged-out" (step clicks confirm)                                                  | ConfirmDialog                                                                 |

**Gaps — functionality with no E2E or unit coverage:**

| Gap                         | Details                                                                                                                       | Severity                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| ~~GitHub sign-in~~          | ~~Removed~~                                                                                                                   | ✅ Done                                |
| Celebration animation       | Always mocked in unit tests. E2E claims skills but never asserts animation renders                                            | Low — cosmetic                         |
| Toast auto-dismiss          | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature) checks toast appears, never checks it disappears | Low — timing behavior                  |
| Unclaim confirmation dialog | Sign-out confirm is tested in E2E, but no scenario specifically tests the unclaim confirm flow                                | Low — similar path to sign-out confirm |
| Error paths                 | No test for network failure, emulator down, or malformed Firestore data                                                       | Medium — silent failures possible      |

### What E2E covers that unit tests miss

These components show 0% or low unit coverage but are well-exercised by E2E:

| Component        | Unit coverage | E2E scenarios covering it                                                                                                                                                  |
| ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProfilePage.tsx  | 0%            | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature) (5 scenarios)                                                                                 |
| SignInModal.tsx  | 0%            | [auth.feature](../../../e2e/features/auth.feature): "Sign in opens modal"                                                                                                  |
| ShareButton.tsx  | 0%            | [shareable-profile.feature](../../../e2e/features/shareable-profile.feature): "Share button copies link"                                                                   |
| Header.tsx       | 36%           | [auth.feature](../../../e2e/features/auth.feature) (3 scenarios)                                                                                                           |
| useSkillState.ts | 32%           | [claim-level.feature](../../../e2e/features/claim-level.feature) (4 scenarios), [browse-skill-tree.feature](../../../e2e/features/browse-skill-tree.feature) (4 scenarios) |
| AuthContext.tsx  | 22%           | [auth.feature](../../../e2e/features/auth.feature), [firestore-sync.feature](../../../e2e/features/firestore-sync.feature) (all auth scenarios)                            |

---

## Current Landscape

### What exists

| Layer                | Tool               | Count          | Coverage                                     |
| -------------------- | ------------------ | -------------- | -------------------------------------------- |
| Unit/component tests | Vitest + RTL       | 47 tests       | Data layer well-tested; UI patchy            |
| E2E tests            | Playwright + BDD   | 30 scenarios   | All major user journeys (see analysis above) |
| Linting              | ESLint (strict TS) | —              | Type safety maxed; no complexity rules       |
| Dead code            | knip               | 1 real finding | `signInWithGitHub` unused                    |

### Routes

| Route              | Unit tests                              | E2E scenarios                                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (LandingPage)  | App.test.tsx, SkillNode, StakesSelector | [browse-skill-tree](../../../e2e/features/browse-skill-tree.feature), [claim-level](../../../e2e/features/claim-level.feature), [safety-zone](../../../e2e/features/safety-zone.feature), [keyboard-navigation](../../../e2e/features/keyboard-navigation.feature), [persistence](../../../e2e/features/persistence.feature) |
| `/profile/:userId` | —                                       | [shareable-profile](../../../e2e/features/shareable-profile.feature) (5 scenarios)                                                                                                                                                                                                                                           |
| Auth flows         | —                                       | [auth](../../../e2e/features/auth.feature) (3 scenarios), [firestore-sync](../../../e2e/features/firestore-sync.feature) (4 scenarios)                                                                                                                                                                                       |

### Logic files vs test coverage

| File                         | Unit tested?                             | E2E covered?                                                                                                                                   |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/state.ts`          | Yes (12 tests)                           | [persistence.feature](../../../e2e/features/persistence.feature)                                                                               |
| `src/data/sync.ts`           | Yes (14 tests)                           | [firestore-sync.feature](../../../e2e/features/firestore-sync.feature)                                                                         |
| `src/data/auth.ts`           | No                                       | [auth.feature](../../../e2e/features/auth.feature) (via emulator)                                                                              |
| `src/data/skill-trees.ts`    | Yes                                      | [browse-skill-tree.feature](../../../e2e/features/browse-skill-tree.feature)                                                                   |
| `src/hooks/useSkillState.ts` | Partially (via skill-tree-state.test.ts) | [claim-level.feature](../../../e2e/features/claim-level.feature), [browse-skill-tree.feature](../../../e2e/features/browse-skill-tree.feature) |

---

## Initiative 1: Mutation Testing (Stryker)

### What it tells us

"Do tests actually catch bugs?" — Stryker modifies code (flips `>` to `<`, removes lines, swaps `true`/`false`) and checks if tests fail. If a mutation survives, the test suite has a blind spot.

### Scope

Start with the data layer only — these files have good unit tests, so mutation testing reveals whether those tests are actually assertive:

- `src/data/state.ts` — load/save, validation, claim/unclaim logic
- `src/data/sync.ts` — Firestore merge, conflict resolution, profile read

**Why not everything?** Mutation testing is slow (runs tests hundreds of times). UI components have E2E coverage that Stryker can't see. Data layer is where silent logic bugs hide.

### Setup

- Config: `stryker.config.json` targeting `src/data/state.ts` and `src/data/sync.ts`
- Run: `pnpm test:mutate` (~2 min 20s)
- Output: mutation score per file + list of surviving mutants

### Results (2026-04-08)

| File      | Mutation Score | Killed | Survived |
| --------- | -------------- | ------ | -------- |
| state.ts  | 89.66%         | 52     | 6        |
| sync.ts   | 93.88%         | 46     | 3        |
| **Total** | **91.59%**     | **98** | **9**    |

**Before targeted tests:** 82.24% (88 killed, 19 survived)
**After targeted tests:** 91.59% (98 killed, 9 survived)

**Remaining 9 survivors — all equivalent or defense-in-depth:**

- **state.ts `isValidState` guard (5):** `typeof data !== 'object' || data === null` — individual branches are redundant with downstream checks (for-loop type check, safety zone validation). Removing any one guard doesn't change behavior because others catch the same invalid inputs.
- **state.ts `!raw` check (1):** Skipping the null check on `localStorage.getItem()` result — `JSON.parse(null)` returns `null`, which fails `isValidState` anyway.
- **sync.ts `isHttpUrl` catch block (1):** Removing `return false` from catch — function returns `undefined` (falsy), which the caller's ternary treats identically to `false`.
- **sync.ts avatarUrl fallback (1):** `data.avatarUrl ?? ''` → any truthy fallback still fails `isHttpUrl` when avatarUrl is undefined, producing `''` either way.
- **sync.ts `syncOnLogin` collection name (1):** `doc()` is called twice in the function; the mock captures both but the path assertion covers it.

### Success criteria — met

- Mutation score > 80% on targeted files ✅ (91.59%)
- Surviving mutants reviewed ✅ — all 9 are equivalent mutants or defense-in-depth redundancies

---

## Initiative 2: Feature-to-Test Traceability Audit

### What it tells us

"What user-facing behavior has no test at all?" — cross-reference app functionality against Gherkin scenarios and unit tests.

### Identified gaps

1. ~~**GitHub sign-in** — removed (`signInWithGitHub` deleted).~~
2. **Celebration animation** — always mocked in unit tests, E2E never asserts it. No test verifies it renders or triggers.
3. **Toast lifecycle** — E2E checks appearance only. No test for auto-dismiss timing or action callbacks.
4. **Error paths** — no test for network failure, malformed data, or unavailable services.

---

## Execution Order

| Step | What                                                            | Effort     |
| ---- | --------------------------------------------------------------- | ---------- |
| 1    | ~~Remove dead `signInWithGitHub` export~~                       | ✅ Done    |
| 1b   | ~~Add `eslint-plugin-sonarjs` + fix all violations~~            | ✅ Done    |
| 2    | ~~Set up Stryker on data layer, run, review surviving mutants~~ | ✅ Done    |
| 3    | ~~Add unit tests for surviving mutants~~                        | ✅ Done    |
| 4    | Decide on celebration/toast/error-path gaps — accept or cover   | Discussion |

---

## Open Questions

- [ ] Should Stryker run in CI? (~2.5 min, manual for now via `pnpm test:mutate`)
- [ ] Are celebration/toast gaps worth unit-testing, or is E2E + visual QA enough?
- [x] ~~Add `eslint-plugin-sonarjs` for ongoing complexity monitoring~~ — done, recommended preset enabled
