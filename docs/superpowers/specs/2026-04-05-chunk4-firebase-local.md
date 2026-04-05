# Chunk 4: Firebase Local — Design Spec

## Overview

Add Firebase Auth (Google + GitHub social login) and Firestore persistence, running against the Firebase Local Emulator Suite during development. At the end of this chunk the app supports sign-in, syncs skill state to Firestore, and all E2E tests run against emulators with no production Firebase project required.

**Depends on:** Chunk 3 (Component UI) ✅

## Scope

### In scope

- Firebase SDK setup (`firebase` npm package) with app initialization
- Firebase Auth: Google and GitHub sign-in (popup flow)
- Auth state management: `onAuthStateChanged` listener, user context
- Header UI: logged-out → "Log in to save" button; logged-in → avatar + name + sign-out
- Firestore persistence: read/write assessment data on `users/{userId}` document
- Sync logic: localStorage → Firestore on login; Firestore wins on conflict
- Firebase Local Emulator Suite setup (`firebase.json`, Auth + Firestore emulators)
- Firestore security rules (`firestore.rules`)
- Environment variable configuration (`.env.example`, `.env.local`)
- Emulator detection: connect to emulators in dev, production Firebase in prod
- E2E tests for auth flows and Firestore sync (against emulator)
- Unit tests for sync logic

### Out of scope

- React Router / client-side routing (Chunk 5)
- Shared profile view at `/profile/{userId}` (Chunk 5)
- Production Firebase project / Terraform provisioning (Chunk 6)
- CI/CD pipeline (Chunk 6)
- User notes per axis (deferred — not needed for MVP assessment)
- Assessment history (MVP uses `latest` document only)
- Offline Firestore persistence (unnecessary — localStorage already provides offline state)

## Architecture

### Firebase Init Module

```typescript
// src/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
```

**Key decisions:**

1. **`import.meta.env.DEV` for emulator detection** — Vite's built-in flag. In dev mode, connect to emulators. In production build, connect to real Firebase. No runtime hostname checks needed.
2. **`disableWarnings: true`** on auth emulator — suppresses the console banner about using emulator.
3. **Minimal config** — only `apiKey`, `authDomain`, `projectId` needed. No `storageBucket`, `messagingSenderId`, `appId` for this scope.

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

**Why Context here but not for skill state?** Auth state is consumed by Header (avatar/logout), App (sync trigger), and potentially future components. Threading it through props from App would add unnecessary coupling. The skill state (4 fields, 4-level tree) stays as prop-drilling per Chunk 3 — simple and explicit.

**Note:** Uses React 19's `<AuthContext value={...}>` syntax (the `Provider` subcomponent is deprecated in React 19).

### Auth Flow

**Sign-in (popup):**

```typescript
// src/data/auth.ts
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../firebase'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signInWithGitHub() {
  const provider = new GithubAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signOut() {
  return firebaseSignOut(auth)
}
```

**Why popup, not redirect?** Popup keeps the SPA state in memory during auth. Redirect navigates away, losing any unsaved state and requiring `getRedirectResult` handling on return. Popup is simpler for a single-page app where users may have unsaved localStorage changes.

### Firestore Sync Module

```typescript
// src/data/sync.ts
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import type { SkillState } from '../types/skill-tree'
import { loadState } from './state'

// Write shape — updatedAt is a sentinel at write time
interface FirestoreUserWrite {
  updatedAt: FieldValue
  safetyZone: SkillState['safetyZone']
  skills: {
    autonomy: number
    parallelExecution: number
    skillUsage: number
  }
  displayName?: string
  avatarUrl?: string
}

// Read shape — updatedAt resolves to Firestore Timestamp after write
interface FirestoreUserRead {
  updatedAt: Timestamp
  displayName: string
  avatarUrl: string
  safetyZone: SkillState['safetyZone']
  skills: {
    autonomy: number
    parallelExecution: number
    skillUsage: number
  }
}

export async function syncOnLogin(user: User): Promise<SkillState> {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    // Firestore wins — overwrite localStorage
    const data = snapshot.data() as FirestoreUserRead
    // Update profile info (may have changed since last login)
    await setDoc(
      userRef,
      {
        displayName: user.displayName ?? 'Anonymous',
        avatarUrl: user.photoURL ?? '',
      },
      { merge: true },
    )
    return {
      autonomy: data.skills.autonomy,
      parallelExecution: data.skills.parallelExecution,
      skillUsage: data.skills.skillUsage,
      safetyZone: data.safetyZone,
    }
  } else {
    // No Firestore data — create user document with localStorage state
    const local = loadState()
    await writeAssessment(user.uid, local, user)
    return local
  }
}

export async function writeAssessment(
  userId: string,
  state: SkillState,
  user?: User,
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const data: FirestoreUserWrite = {
    updatedAt: serverTimestamp(),
    safetyZone: state.safetyZone,
    skills: {
      autonomy: state.autonomy,
      parallelExecution: state.parallelExecution,
      skillUsage: state.skillUsage,
    },
    // Profile fields included on create, preserved on update via merge
    ...(user
      ? {
          displayName: user.displayName ?? 'Anonymous',
          avatarUrl: user.photoURL ?? '',
        }
      : {}),
  }
  await setDoc(userRef, data, { merge: true })
}
```

### Sync Logic in App

The sync logic integrates into `App.tsx`:

1. **On mount:** load from localStorage (unchanged from Chunk 3)
2. **On auth state change (login):** call `syncOnLogin(user)` → returns authoritative state → `setState(result)` to update React (the persist effect writes to localStorage)
3. **On state change while logged in:** `writeAssessment(user.uid, state)` alongside the existing `saveState(state)` to localStorage
4. **On sign-out:** keep current state in localStorage, stop writing to Firestore

```typescript
// In App.tsx — conceptual integration (not exact final code)
const { user } = useAuth()
const prevUser = useRef<string | null>(null)
const syncing = useRef(false)

// Sync on login
useEffect(() => {
  if (user && prevUser.current !== user.uid) {
    prevUser.current = user.uid
    syncing.current = true
    syncOnLogin(user)
      .then((synced) => {
        setState(synced)
      })
      .catch((err) => {
        console.error('Sync failed, keeping local state:', err)
        // On failure, keep localStorage state — don't overwrite anything
      })
      .finally(() => {
        syncing.current = false
      })
  }
  if (!user) {
    prevUser.current = null
  }
}, [user])

// Persist on state change
useEffect(() => {
  saveState(state)
  // Skip Firestore write while sync is in flight to avoid race condition:
  // syncOnLogin may be reading/writing Firestore simultaneously
  if (user && !syncing.current) {
    writeAssessment(user.uid, state).catch((err) => {
      console.error('Failed to write assessment:', err)
    })
  }
}, [state, user])
```

**Key guards:**

- **`syncing` ref** prevents the persist effect from writing stale state to Firestore while `syncOnLogin` is in flight. Without this, the `[state, user]` effect fires when `user` changes from null → User (before sync completes), causing a race between the stale localStorage write and the `syncOnLogin` read.
- **`.catch()` on both async paths** prevents unhandled promise rejections. On sync failure, the app falls back to localStorage state silently. On write failure, state is still in localStorage — the user doesn't lose progress.

**Conflict resolution: Firestore wins silently.** Per the parent design spec. If a user has local progress and also has Firestore data from a previous session, the Firestore version overwrites localStorage on login. No notification or merge UI.

### Debouncing Firestore writes

State changes happen on discrete user clicks (claim/unclaim/safety zone). These are infrequent enough that no debounce is needed — each click produces one Firestore write. If rapid clicking becomes a concern, a simple trailing debounce (500ms) can be added later.

## Firestore Schema

Simplified from the parent design spec — single flat document per user instead of a subcollection:

```
users/{userId}
  ├── displayName: string
  ├── avatarUrl: string
  ├── updatedAt: Timestamp (server)
  ├── safetyZone: "safe-zone" | "normal" | "hardcore" | "impossible"
  └── skills: {
        autonomy: 1-6,
        parallelExecution: 1-5,
        skillUsage: 1-6
      }
```

**Why flat instead of `assessments/latest` subcollection?** The parent spec defined a subcollection to support assessment history, but history is explicitly out of scope and may never ship. For MVP with a single assessment per user, a flat document is simpler: one read, one write, one security rule. If history is needed later, migrating to a subcollection is straightforward.

**No `notes` field for now** — the parent spec marks it as optional, and Chunk 4 doesn't introduce any notes UI.

## Security Rules

```
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      // Owner-only reads for now — opened to public in Chunk 5 when shared profiles ship
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only the user can create/update their own document (no delete)
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Why owner-only reads?** The parent spec says all synced profiles are publicly accessible, but the shared profile UI doesn't ship until Chunk 5. Principle of least privilege: keep reads restricted until the feature that needs public access exists. Chunk 5 will change `allow read` to `if true`.

## Firebase Emulator Setup

### `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### `firestore.indexes.json`

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

No composite indexes needed — MVP queries are single-document reads by ID.

### Firebase CLI

The Firebase CLI (`firebase-tools`) is added as a **pinned devDependency** to ensure all developers and the pre-commit hook use the same version. This avoids version drift from `npx` downloading arbitrary versions and removes network latency from the pre-commit hook.

**Running emulators:**

```bash
pnpm emulators          # uses firebase-tools from node_modules
```

### Java requirement

Firebase emulators require Java 11+ runtime. This is a system prerequisite, not managed by the project. Documented in the spec and `.env.example`.

## Environment Variables

Updated `.env.example`:

```bash
# Firebase config
# For local development with emulators, these values can be anything non-empty.
# The emulator doesn't validate API keys.
VITE_FIREBASE_API_KEY=fake-api-key-for-emulator
VITE_FIREBASE_AUTH_DOMAIN=plepic-skill-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=plepic-skill-dev
```

For local emulator development, the Firebase config values don't need to be real — the emulator accepts any project ID and API key. Real values are needed only for production (Chunk 6).

A `.env.local` file (gitignored) is created during setup with these same emulator-friendly values.

## UI Changes

### Header — Logged Out State (current)

No change to the visual design. The "Log in to save" button now opens a sign-in modal instead of showing "Coming soon."

### Sign-In Modal

A minimal modal/dropdown triggered by clicking "Log in to save":

- **"Sign in with Google"** button (Google icon + text)
- **"Sign in with GitHub"** button (GitHub icon + text)
- Clicking outside or pressing Escape closes the modal
- On successful sign-in, modal closes automatically
- **In-progress state:** When a provider button is clicked and the popup is open, both buttons become disabled (opacity 0.5, pointer-events none) to prevent duplicate popup attempts. Buttons re-enable if the popup is closed without completing auth.

**Styling:** Uses Plepic design system. Parchment-toned overlay. Buttons follow the existing button style with provider-specific icons. No third-party UI library.

**Implementation:** A `SignInModal` component rendered conditionally in Header. Uses a `<dialog>` element for built-in backdrop and Escape handling.

### Header — Logged In State

Replaces the login button with:

- User avatar (circular, 32px, from `user.photoURL`) with fallback initial
- User display name (truncated if long)
- "Sign out" text button

Layout: `[logo ... avatar name sign-out]`

### Header — Avatar Fallback

When `user.photoURL` is null (common with GitHub accounts), show a circular fallback with the first letter of `displayName` (or "?" if no name) in white on a `var(--green-brand)` background. Same 32px size as the avatar image.

### Header — Name Truncation

Display name is truncated with ellipsis (`text-overflow: ellipsis`) at 120px max-width. Full name shows on hover via `title` attribute.

### Loading State

While `AuthProvider.loading` is true (brief moment on app start while `onAuthStateChanged` resolves), the login button area shows nothing (empty space). This prevents a flash of "Log in to save" followed by the avatar for returning users. The loading period is typically <100ms with emulators and <500ms with production Firebase.

### Sync In-Progress State

While `syncOnLogin` is in flight (between auth resolving and Firestore data arriving), the skill tree remains visible with the current localStorage state. No spinner or disabled state — the sync is fast (<200ms against emulator, <1s against production) and the visual update when state changes is sufficient feedback. The `syncing` ref prevents stale writes during this window (see Sync Logic in App section).

### Error States

**Sign-in popup blocked:** If the browser blocks the popup, `signInWithPopup` rejects with `auth/popup-blocked`. The `SignInModal` catches this and shows an inline error message: "Popup blocked — please allow popups for this site." The modal stays open so the user can retry.

**Sign-in popup closed:** If the user closes the popup before completing auth, `signInWithPopup` rejects with `auth/popup-closed-by-user`. This is not an error — silently ignore it (the modal stays open).

**Account exists with different credential:** If a user tries GitHub after previously using Google with the same email, Firebase rejects with `auth/account-exists-with-different-credential`. The modal shows: "An account already exists with this email. Try signing in with Google instead." This is a known Firebase limitation and not worth building account-linking for in MVP.

**Sync failure:** If `syncOnLogin` fails (network error, Firestore unavailable), the app falls back to localStorage state silently. A `console.error` is logged. No user-visible error — the app works fine with localStorage, and Firestore will sync on next successful login.

**Write failure:** If `writeAssessment` fails while logged in, the error is logged to console. The user's state is still in localStorage and will sync on next page load or login. No toast or error indicator — failures are rare and self-healing.

## Project Structure

### New files

```
src/
├── firebase.ts                  # Firebase app init, emulator connection
├── contexts/
│   └── AuthContext.tsx           # Auth state context + provider
├── data/
│   ├── auth.ts                  # signInWithGoogle, signInWithGitHub, signOut
│   └── sync.ts                  # syncOnLogin, writeAssessment
├── components/
│   ├── SignInModal.tsx           # Google/GitHub sign-in buttons in dialog
│   └── SignInModal.module.css
firestore.rules                  # Firestore security rules (project root)
firestore.indexes.json           # Firestore indexes (project root)
firebase.json                    # Firebase project config + emulator ports
e2e/
├── features/
│   ├── auth.feature             # Auth flow scenarios
│   └── firestore-sync.feature   # Sync logic scenarios
├── steps/
│   ├── auth.ts                  # Auth step definitions
│   └── firestore-sync.ts        # Sync step definitions
└── helpers/
    └── emulator.ts              # Emulator REST API helpers
```

### Modified files

```
src/App.tsx                      # Wrap in AuthProvider, add sync effects
src/components/Header.tsx        # Auth-aware: login button vs avatar + sign-out
src/components/Header.module.css # Styles for avatar, sign-out, modal trigger
.env.example                     # Uncomment and update Firebase config vars
package.json                     # Add firebase dependency, emulator scripts
.husky/pre-commit                # Add emulator startup for E2E
```

**Note:** New E2E files (`e2e/helpers/`, `e2e/steps/`) are covered by the existing `tsconfig.e2e.json` from Chunk 3 (which includes the `e2e/` directory). The main `tsconfig.json` only covers `src/` — the pre-commit `tsc --noEmit` does not type-check E2E files, which is intentional (they're checked by Playwright's own TypeScript handling).

## Dependencies

### New Production Dependencies

| Package    | Purpose                           |
| ---------- | --------------------------------- |
| `firebase` | Firebase JS SDK (Auth, Firestore) |

### New Development Dependencies

| Package          | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `firebase-tools` | Firebase CLI (emulators, rules deployment) |

### Package Scripts

New/updated scripts in `package.json`:

```json
{
  "emulators": "firebase emulators:start",
  "test:e2e": "bddgen && playwright test",
  "test:e2e:emulator": "firebase emulators:exec 'pnpm test:e2e'"
}
```

All `firebase` commands resolve to the pinned devDependency version via pnpm.

- `pnpm emulators` — start emulators for manual dev (leave running)
- `pnpm test:e2e` — run E2E tests (assumes emulators already running)
- `pnpm test:e2e:emulator` — start emulators, run E2E, stop emulators (used in pre-commit hook)

## Testing

### Unit Tests (Vitest)

| Test file      | What it verifies                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync.test.ts` | `syncOnLogin`: returns Firestore data when exists, pushes localStorage when no Firestore data, handles errors gracefully. `writeAssessment`: writes correct shape. Uses mocked Firestore functions. |

No `auth.test.ts` — the auth functions (`signInWithGoogle`, `signInWithGitHub`, `signOut`) are thin one-liner wrappers around Firebase SDK calls. Testing them with mocks only verifies that the wrapper delegates correctly, which TypeScript type-checking already ensures. Auth flows are covered by E2E tests instead.

**Mocking strategy:** Unit tests mock `firebase/firestore` module entirely. No emulator needed for unit tests — they test the sync logic in isolation.

### E2E Tests (Playwright + playwright-bdd)

E2E tests run against the Firebase Emulator Suite.

**Emulator lifecycle for E2E:**

Use `firebase emulators:exec` to wrap the test command. This starts emulators, runs the command, and stops emulators when done — no custom process management, no PID tracking, no orphaned Java processes.

- **During development:** Run `pnpm emulators` in one terminal, `pnpm test:e2e` in another. Fast iteration, no emulator restart between runs.
- **In pre-commit hook:** `pnpm test:e2e:emulator` wraps with `firebase emulators:exec` which handles the full lifecycle atomically.
- **No `globalSetup`/`globalTeardown` for emulators** — custom process spawning with PID tracking is fragile across platforms and creates orphan process risks (the Firestore emulator spawns child Java processes). `emulators:exec` handles all of this.

**Auth in E2E tests:**

The Firebase Auth emulator provides a REST API for creating test users without going through OAuth:

```
POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken
```

Alternatively, use the emulator's `signInWithCredential` with a mock token. For E2E tests, the simplest approach is to use `firebase/auth`'s `signInWithEmailAndPassword` against the emulator (create a test user via the emulator REST API), bypassing the OAuth popup entirely.

**Emulator REST API for test user creation:**

```
POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key
Body: { "email": "test@example.com", "password": "testpassword", "returnSecureToken": true }
```

Then the step definition calls `page.evaluate()` to execute `signInWithEmailAndPassword` in the browser context (where the Firebase SDK is loaded). This authenticates the user against the emulator, triggering `onAuthStateChanged` in the React app. This avoids the complexity of mocking OAuth popups in headless browsers.

**"I sign in as a test user" step mechanism:**

1. Create test user via emulator REST API (Node context, in step definition)
2. `page.evaluate(({ email, password }) => { ... signInWithEmailAndPassword(auth, email, password) })` to sign in within the browser
3. Wait for header to show avatar (UI assertion confirms auth state propagated)

This is a **programmatic** sign-in that bypasses the SignInModal UI. The modal UI itself is tested separately in the "Sign in button opens sign-in modal" scenario via real button clicks.

### E2E Feature Files

**auth.feature:**

```gherkin
Feature: Authentication

  Scenario: Sign in button opens sign-in modal
    Given I open the skill tree page
    When I click "Log in to save"
    Then I should see the sign-in modal with Google and GitHub options

  Scenario: Sign in updates the header
    Given I open the skill tree page
    And I sign in as a test user
    Then I should see the user avatar in the header
    And I should see a "Sign out" button
    And I should not see "Log in to save"

  Scenario: Sign out returns to logged-out state
    Given I open the skill tree page
    And I sign in as a test user
    When I click "Sign out"
    Then I should see "Log in to save"
    And I should not see the user avatar
```

**firestore-sync.feature:**

```gherkin
Feature: Firestore sync

  Scenario: Local progress syncs to Firestore on first login
    Given I open the skill tree page
    And I claim the "Review Every Edit" level
    When I sign in as a test user
    Then the Firestore assessment should have autonomy level 2

  Scenario: Firestore data wins on conflict
    Given I open the skill tree page
    And the test user has autonomy level 4 in Firestore
    And I claim the "Review Every Edit" level locally
    When I sign in as a test user
    Then the "Review Critical Only" node should be claimed
    And the "Review Every Edit" node should be claimed

  Scenario: Changes persist to Firestore while logged in
    Given I open the skill tree page
    And I sign in as a test user
    When I claim the "Review Per Session" level
    Then the Firestore assessment should have autonomy level 3

  Scenario: Progress survives sign-out and sign-in
    Given I open the skill tree page
    And I sign in as a test user
    And I claim the "Manual Parallel" level
    When I sign out
    And I sign in as a test user
    Then the "Manual Parallel" node should be claimed
```

### E2E Helper: Emulator Interaction

Step definitions need helpers to interact with the emulator:

```typescript
// e2e/helpers/emulator.ts

const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'

export async function createTestUser(email: string, password: string) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  return res.json()
}

export async function clearEmulatorData() {
  // Clear Auth emulator
  await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/plepic-skill-dev/accounts`, {
    method: 'DELETE',
  })
  // Clear Firestore emulator
  await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/plepic-skill-dev/databases/(default)/documents`,
    { method: 'DELETE' },
  )
}

export async function setFirestoreAssessment(
  userId: string,
  skills: { autonomy: number; parallelExecution: number; skillUsage: number },
  safetyZone: string,
) {
  // Use Firestore REST API to seed test data
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/plepic-skill-dev/databases/(default)/documents/users/${userId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          displayName: { stringValue: 'Test User' },
          avatarUrl: { stringValue: '' },
          updatedAt: { timestampValue: new Date().toISOString() },
          safetyZone: { stringValue: safetyZone },
          skills: {
            mapValue: {
              fields: {
                autonomy: { integerValue: skills.autonomy },
                parallelExecution: { integerValue: skills.parallelExecution },
                skillUsage: { integerValue: skills.skillUsage },
              },
            },
          },
        },
      }),
    },
  )
}
```

**Emulator data clearing:** Call `clearEmulatorData()` in a playwright-bdd `BeforeEach` hook (in `e2e/steps/common.ts`) to ensure test isolation between scenarios. Also clear localStorage via `page.evaluate(() => localStorage.clear())` before each scenario.

### Pre-commit Hook

The pre-commit hook already runs E2E tests. The E2E tests now require emulators. The pre-commit script uses `emulators:exec` to wrap the E2E run:

```bash
#!/bin/sh
pnpm exec lint-staged
pnpm exec tsc --noEmit
pnpm test:run
pnpm test:e2e:emulator
```

`firebase emulators:exec` starts emulators, runs the command, and stops emulators when done. Clean and atomic. Adds ~5s startup overhead to each commit.

**Prerequisites:** Java 11+ required for emulators. Firebase CLI comes from the pinned `firebase-tools` devDependency — no global install needed. Java requirement documented in `.env.example`.

**Port conflicts:** If emulators are already running (e.g., from `pnpm emulators` in another terminal), `emulators:exec` will fail with a port-in-use error. The developer must stop the running emulators first. This is a known friction point but is acceptable — the error message from Firebase CLI is clear.

**Note:** This replaces the bare `pnpm test:e2e` in the pre-commit hook. The existing Chunk 3 E2E tests (which don't need emulators) will still pass — the emulator being available doesn't affect tests that don't use it.

## Verification Criteria

Chunk 4 is done when:

1. `pnpm emulators` starts Auth and Firestore emulators with UI at port 4000
2. `pnpm dev` with emulators running shows the app connecting to emulators (console log or DevTools network)
3. Clicking "Log in to save" opens the sign-in modal with Google and GitHub options
4. Signing in via the emulator Auth UI (or E2E test helper) updates the header to show avatar and display name
5. Signing out returns the header to the "Log in to save" state
6. With no prior Firestore data: claiming levels while logged out, then signing in → Firestore contains the local state
7. With existing Firestore data: signing in → local state overwritten by Firestore data
8. While logged in: claiming/unclaiming levels → Firestore document updates within seconds
9. Sign out → sign back in → Firestore state restored correctly
10. `pnpm test:run` passes all unit tests (existing + new sync/auth tests)
11. `pnpm test:e2e` passes all E2E tests (existing + new auth/sync features) against emulators
12. `pnpm build` succeeds (tree-shakes unused Firebase modules)
13. `pnpm lint` and `pnpm typecheck` pass
14. Pre-commit hook works with `firebase emulators:exec`
15. Firestore security rules allow owner-only reads and writes (public reads deferred to Chunk 5)

## Risks and Mitigations

| Risk                                                                                 | Mitigation                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase JS SDK is large (~150KB gzipped for Auth + Firestore)                       | Acceptable for MVP. Tree-shaking with modular imports (`firebase/auth`, not `firebase`) minimizes bundle. Can lazy-load auth module in Chunk 5 if needed.                                               |
| OAuth popup blocked by browser popup blockers                                        | User-initiated click handler avoids most blockers. If blocked, modal shows inline error with retry guidance (see Error States section).                                                                 |
| Firebase emulators require Java 11+                                                  | Documented prerequisite. Most developers have Java installed. CI (Chunk 6) will use a Docker image with Java pre-installed.                                                                             |
| E2E tests become slower with emulator startup                                        | `firebase emulators:exec` adds ~5s. Total E2E still under 20s. Acceptable.                                                                                                                              |
| `onAuthStateChanged` fires before sync completes, causing brief flash of stale state | `syncing` ref prevents stale Firestore writes during sync. Skill tree shows localStorage state briefly, then updates when sync completes. Acceptable — sync is fast.                                    |
| Token expiry during long session                                                     | Firebase SDK handles token refresh automatically. If refresh fails (rare), Firestore writes will reject — caught by `.catch()` in the persist effect, logged to console. State remains in localStorage. |
| Firestore writes on every state change could be excessive                            | State changes are discrete (click events), not continuous. Typical session: 5-10 writes. Well within free tier limits.                                                                                  |
| Production Firebase config leaked in `.env.local`                                    | `.env.local` is gitignored. `.env.example` has fake emulator values. Production values only in deployment config (Chunk 6).                                                                             |

## Implementation Chunks

Suggested order for incremental delivery within this chunk:

1. **Firebase Setup** — Install `firebase` + `firebase-tools` packages, create `firebase.ts`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `.env.local` with emulator values. Verify emulators start.
2. **Auth Module + Context** — Create `auth.ts`, `AuthContext.tsx`. Wrap App in `AuthProvider`. Verify `onAuthStateChanged` fires with emulator.
3. **Header Auth UI** — Replace "Coming soon" tooltip with `SignInModal`. Show avatar/name/sign-out when logged in. Verify visually with emulator Auth UI.
4. **Sync Module** — Create `sync.ts`. Wire sync effects into `App.tsx`. Verify localStorage ↔ Firestore sync via emulator Firestore UI.
5. **Unit Tests** — Mock-based tests for sync logic and auth functions.
6. **E2E Tests** — Auth and sync Gherkin scenarios against emulators. Update pre-commit hook to use `firebase emulators:exec`.

## Implementation Notes

**Status: Complete** (2026-04-05)

### Deviations from spec

1. **Firestore schema:** Used flat `users/{userId}` document as specified (not subcollection).
2. **Playwright workers:** Set to 1 (serial) because parallel workers share the Firebase emulator state and cause race conditions with `clearEmulatorData()`.
3. **E2E auth mechanism:** Exposed `window.__e2e_auth` and `window.__e2e_signInWithEmailAndPassword` on `window` in DEV mode so `page.evaluate()` can call Firebase auth directly. Dynamic `import('firebase/auth')` doesn't work in browser eval context.
4. **Emulator REST API:** Added `Authorization: Bearer owner` header to bypass security rules when reading Firestore data in E2E assertions.
5. **`.firebaserc`:** Added with `"default": "plepic-skill-dev"` to fix project ID mismatch warning from emulators.

### Versions installed

- `firebase`: ^12.11.0
- `firebase-tools`: ^15.13.0

### Test counts

- Unit tests: 34 (28 existing + 6 new sync tests)
- E2E scenarios: 20 (13 existing + 3 auth + 4 firestore-sync)

### Bundle size

- Production build: 560KB / 174KB gzipped (Firebase adds ~100KB gzipped). Acceptable per spec risk assessment.
