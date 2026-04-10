# Quality Fixes Plan — Round 2

59 new findings from section-by-section code critique. All fixed.

**Final status:** 0 errors, 80/80 tests passing, 0 lint errors (2 pre-existing warnings).

## Batch 1 (parallel — no file overlap)

### Group 1: Data Layer (`src/data/`)

- [x] P1: `hasValidSkills` → renamed `hasValidUserData`, added `safetyZone` validation, moved to `firestore-utils.ts`
- [x] P2: `syncOnLogin` SRP — extracted `updateProfileInfo` function
- [x] P2: Moved shared utils (`hasValidUserData`, `toSkillState`, `FirestoreUserRead`) to `src/data/firestore-utils.ts`

### Group 2: Firebase (`src/firebase.ts`)

- [x] P1: Guard `window` access in emulator block
- [x] P1: E2E scaffolding — cleaned up, window guard wraps entire block
- [x] P2: SRP — organized with section comments
- [x] P2: Renamed `__emulatorsConnected` → `EMULATORS_CONNECTED_KEY`
- [x] P2: Dynamic re-import kept (required by test mock setup)
- [x] P3: Extracted `shouldConnectEmulators()`

### Group 3: Skill Tree Components

- [x] P1: Standardized on `readOnly` (camelCase) across all 4 components
- [x] P2: Inlined `QuestPathNode` back into map loop
- [x] P2: Split `handleActionClick` into per-button inline handlers
- [x] P2: Extracted `getNodeState` function, used in connector and map
- [x] P3: Renamed `claimedLevel` → `claimedLevelIndex`
- [x] P3: Added optional `axisIds` prop to `SkillTree`

### Group 4: Supporting Components

- [x] P1: Hoisted `<SignInModal>` to render unconditionally
- [x] P1: Guarded entire CelebrationEffect timer cleanup block
- [x] P1: Toast now uses "last mount wins" (StrictMode-safe)
- [x] P2: Renamed `StakesBadge`/`StakesSelector` → `SafetyZoneBadge`/`SafetyZoneSelector`
- [x] P2: Extracted `useAuthActions` hook from Header
- [x] P2: Flattened Header to `renderAuthControls()` with single switch
- [x] P2: SignInModal clears error on reopen
- [x] P2: ShareButton accepts optional `url` prop
- [x] P3: Removed dead `SafetyZone` import
- [x] P3: Moved `LinkIcon` to `src/components/icons.tsx`

## Batch 2 (after Batch 1)

### Group 5: Hooks

- [x] P1: Separated `skipNextWrite` into its own `useRef<boolean>`
- [x] P1: Wrapped `saveState` in try/catch for error handling
- [x] P1: Added stale-response guard to `usePublicProfile`
- [x] P2: Moved `SyncStatus` type to `types/skill-tree.ts`
- [x] P2: Exported standalone `resetState()` from `data/state.ts`
- [x] P2: Renamed `replaceState` → `setFullState`
- [x] P2: Extracted `performLoginSync` function from useSyncState
- [x] P3: Consolidated useClaimAnimation cleanup into single effect

### Group 6: Pages & App Shell

- [x] P1: Moved `useSkillState()` into `OwnerProfile` only; `ProfilePage` uses standalone `resetState`
- [x] P1: Restructured `VisitorProfile` — single `<Header>` render
- [x] P2: Fixed `displayName?.[0]?.toUpperCase() ?? '?'`
- [x] P2: Extracted `LandingContent` child component to avoid wasted hook work
- [x] P2: Renamed `onLogout` → `onOwnerSignOut`
- [x] P2: Owner concerns no longer leak into visitor path
- [x] P3: Hooks only run when `LandingContent` mounts

## Batch 3 (after Batch 2)

### Group 7: Unit Tests

- [x] P1: `MOCK_DB` now shared via `vi.hoisted()` — single reference
- [x] P1: Moved `readPublicProfile` tests to `src/data/__tests__/profile.test.ts`
- [x] P1: Toast test updated — verifies "last mount wins" instead of throw
- [x] P2: App.test.tsx already fixed in prior round (derives from data)
- [x] P2: Renamed "concurrently" → "called again before cleanup"
- [x] P2: Toast unmount test in own `describe` block
- [x] P2: Removed dead vitest imports from 3 files
- [x] P3: Renamed "renders without crashing" → "renders the app heading"
- [x] P3: StakesSelector test uses structural assertions, not UI copy

### Group 8: E2E Tests

- [x] P1: Added runtime guard for `testUserId` (throws if unset)
- [x] P1: Readonly assertion now expands node first
- [x] P1: Added `data-skill-name` attribute to SkillNode; steps use it
- [x] P1: Extracted `claimedNodeLocator` helper in `e2e/helpers/claim.ts`
- [x] P2: Renamed step to `I click the {string} action`
- [x] P2: Consolidated duplicate `I claim` step into `claim.ts`
- [x] P2: Generic pattern collision resolved by rename
- [x] P2: Canonical `I should see {string}` step in `common.ts`
- [x] P3: Removed `createTestUser` silent sign-in fallback
- [x] P3: Uses `[data-quest-path]` selector instead of child count
