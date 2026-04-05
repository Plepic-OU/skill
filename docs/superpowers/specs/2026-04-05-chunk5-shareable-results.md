# Chunk 5: Shareable Results — Design Spec

## Overview

Add client-side routing so the profile URL is the shareable link. When logged in, the browser URL becomes `/profile/{uid}` — the same URL a friend would visit. The owner sees edit controls; visitors see read-only. A Share button provides a convenient way to copy the URL.

**Depends on:** Chunk 4 (Firebase Local) ✅

## Scope

### In scope

- React Router v7 with client-side routing
- GitHub Pages SPA routing (404.html trick)
- Three routes: `/` (landing), `/profile/:userId` (owner or visitor view), catch-all → `/`
- Single profile page that adapts: owner sees claim/unclaim, visitor sees read-only
- Redirect logged-in user from `/` to `/profile/{uid}`
- Firestore security rules: open reads on `users/{userId}` (any visitor can view)
- Share button: copies current URL to clipboard, prompts login if not authenticated
- E2E tests for share flow and public profile viewing
- Unit tests for new components and routing logic

### Out of scope

- Custom vanity URLs or usernames (potential future enhancement)
- Privacy toggle / profile visibility settings (MVP: all synced profiles are public)
- Social meta tags / Open Graph (requires server-side rendering — not possible with GitHub Pages SPA)
- Assessment history or versioning
- Production Firebase / Terraform (Chunk 6)

## URL Design Decision

**Firebase UID in the URL** — e.g. `skill.plepic.com/profile/abc123XYZ789def456`. Zero extra infrastructure. The URL is primarily shared via the Share button (copied, not typed), so length doesn't matter much.

### Deferred: Friendly URLs

Short IDs (`/p/k7x9m2`), vanity usernames (`/@joosep`), and any URL prettification are **explicitly postponed**. They add complexity (extra Firestore lookups, uniqueness constraints, username selection UI) with no functional benefit at this stage. The UID-based URL works, is stable, and is shareable. If user feedback shows demand for nicer URLs, it can be layered on without breaking existing links.

---

## Architecture

### Routing

Three routes via React Router v7 (`react-router`):

| Route              | What renders    | Notes                                                                                                                          |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`                | `LandingPage`   | Unauthenticated exploration + localStorage interaction. If logged in, redirects to `/profile/{uid}`.                           |
| `/profile/:userId` | `ProfilePage`   | **Single page, two modes.** If `:userId` matches logged-in user → owner mode (editable). Otherwise → visitor mode (read-only). |
| `*`                | Redirect to `/` | Catch-all for unknown routes.                                                                                                  |

**Key behavior:** When a user logs in (from `/` or from the sign-in modal), the app navigates to `/profile/{uid}` using `replace` (not push) so the back button doesn't loop between `/` and `/profile/{uid}`. Logging out navigates back to `/` (also `replace`).

**Auth loading guard:** Both `/` and `/profile/:userId` must gate their redirect/mode logic on `loading === false` from `AuthContext`. While auth is resolving, show a minimal loading state (e.g., just the header skeleton) — never flash the wrong mode. The `AuthContext` already exposes `loading: boolean`.

### SPA Routing on GitHub Pages

GitHub Pages doesn't support server-side rewrites. The standard trick:

1. Copy `index.html` to `404.html` in the build output (`web/`)
2. GitHub Pages serves `404.html` for any unknown path
3. React Router picks up the URL and renders the correct route

Implemented as a `postbuild` script in `package.json`: `"postbuild": "cp web/index.html web/404.html"`. Simple, explicit, no build plugin needed.

**Note:** GitHub Pages serves `404.html` with HTTP 404 status code. This means search engines won't index `/profile/:userId` URLs. Acceptable — this app is shared via links, not discovered via search.

### Component Structure

```
src/
  main.tsx            — BrowserRouter wrapping App
  App.tsx             — Routes definition + auth redirect logic
  pages/
    LandingPage.tsx   — Unauthenticated exploration (current App content, minus auth state)
    ProfilePage.tsx   — Unified owner/visitor profile view
  components/
    ShareButton.tsx   — Copy current URL to clipboard
    ... (existing components)
```

### Data Flow

**Owner viewing own profile (`/profile/{uid}`, logged in):**

```
User is logged in, URL is /profile/{uid}
  → ProfilePage detects: userId param === auth user uid → owner mode
  → State from localStorage + Firestore sync (existing logic)
  → Full interaction: claim/unclaim, safety zone, celebration effects
  → URL is already the shareable link
```

**Visitor viewing someone's profile (`/profile/{userId}`, not owner):**

```
Visitor navigates to /profile/{userId}
  → ProfilePage detects: userId param !== auth user (or not logged in) → visitor mode
  → Reads users/{userId} from Firestore (public read)
  → Renders read-only skill tree with user's progress
  → No localStorage interaction, no edit controls
```

**Share button:**

```
User clicks Share
  → If not logged in: open SignInModal (login will redirect to /profile/{uid})
  → If logged in: copy current URL to clipboard → toast "Link copied!"
```

## Firestore Rules Update

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Anyone can view profiles (public read)
      allow read: if true;

      // Only the owner can create/update their own document, with schema validation
      allow create, update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.keys().hasOnly(['displayName', 'avatarUrl', 'updatedAt', 'safetyZone', 'skills'])
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() <= 200
        && request.resource.data.avatarUrl is string
        && request.resource.data.avatarUrl.size() <= 500
        && request.resource.data.safetyZone in ['safe-zone', 'normal', 'hardcore', 'impossible']
        && request.resource.data.skills is map
        && request.resource.data.skills.keys().hasOnly(['autonomy', 'parallelExecution', 'skillUsage'])
        && request.resource.data.skills.autonomy is int
        && request.resource.data.skills.autonomy >= 0 && request.resource.data.skills.autonomy <= 6
        && request.resource.data.skills.parallelExecution is int
        && request.resource.data.skills.parallelExecution >= 0 && request.resource.data.skills.parallelExecution <= 5
        && request.resource.data.skills.skillUsage is int
        && request.resource.data.skills.skillUsage >= 0 && request.resource.data.skills.skillUsage <= 6;

      // Delete is intentionally denied (implicit)
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Changes from Chunk 4 rules:**

1. `allow read` goes from `request.auth.uid == userId` to `if true` — enables public profile viewing
2. **Field-level write validation** — enforces schema: only expected fields, correct types, bounded string lengths, valid enum values, skill ranges. Prevents a malicious client from injecting arbitrary data into publicly-readable documents.

**Risk:** Any visitor can read any user document if they know the UID. Acceptable for MVP — the document only contains display name, avatar URL, skill levels, and safety zone. No sensitive data.

## Components

### ProfilePage

Unified page at `/profile/:userId` — adapts based on whether the viewer is the owner.

**Mode detection:**

```typescript
const { userId } = useParams()
const { user } = useAuth()
const isOwner = user?.uid === userId
```

**Owner mode** (`isOwner === true`):

- Full Header with auth controls, sync status, Share button
- Editable skill tree: claim/unclaim, safety zone selector, celebration effects
- State management: same as current App.tsx (localStorage + Firestore sync)
- Hero with progress summary

**Visitor mode** (`isOwner === false`):

- Header: auth-aware — if the visitor is logged in, show their own avatar/auth controls + "View your profile" link to `/profile/{visitor-uid}`. If not logged in, show "Log in to save" (existing) + "Assess your own skills" CTA to `/`. Use `/frontend-design` and `/critique` skills during implementation to get the header right for all 3 states (landing, owner, visitor-logged-in/visitor-anonymous).
- Profile banner: display name + avatar from Firestore
- Read-only skill tree: expand/collapse details, but no claim/unclaim buttons
- Safety zone shown as a badge (not selectable)
- No celebration effects

**Visitor states:**

1. **Loading** — Fetching user document from Firestore. Show skeleton/spinner.
2. **Found** — Render visitor mode layout. If the profile owner has not claimed any skills, show the empty tree with a note like "No skills assessed yet."
3. **Not found / Error** — User document doesn't exist or Firestore read failed. Show friendly message ("Profile not found") with link to `/`. No separate error-with-retry state — keep it simple.

**Read-only SkillTree:** The existing `SkillTree` component gains a `readonly` prop. When `true`:

- Node click expands/collapses details (still interactive for browsing)
- No claim/unclaim buttons shown
- No celebration effects
- Indicators show claimed state but aren't clickable

### LandingPage

The unauthenticated experience at `/`. Extracted from current `App.tsx` but simplified:

- Full interactive skill tree with localStorage persistence (existing behavior)
- No Firestore sync (user isn't logged in)
- Header shows "Log in to save" button (existing)
- Share button in header prompts login (since there's no profile URL yet)
- On successful login → navigate to `/profile/{uid}`

### ShareButton

Appears in the Header.

**Behavior:**

1. If not logged in → opens SignInModal with message "Sign in to share your results"
2. If logged in → copies current URL (`window.location.href`) to clipboard
3. Shows toast: "Link copied!"

**Visual:** Small button with a share/link icon, next to the user's avatar in the header.

**Clipboard failure:** If `navigator.clipboard.writeText()` throws (e.g., page lacks focus), show an error toast "Couldn't copy link." No fallback mechanism needed.

## State Management Across Pages

The current `App.tsx` holds all state (localStorage load, Firestore sync, claim/unclaim handlers). After the split:

- **LandingPage** owns its own `useState(loadState)` with `saveState` on change — localStorage only, no Firestore. This is the existing logic minus the auth/sync parts.
- **ProfilePage (owner mode)** owns the same state pattern plus Firestore sync — the full current `App.tsx` logic.
- **State handoff on login:** When the user logs in on the LandingPage, the app navigates to `/profile/{uid}`. ProfilePage initializes by calling `loadState()` from localStorage (which LandingPage has been writing to), then `syncOnLogin` runs. This works because LandingPage flushes every state change to localStorage synchronously via `saveState()`. No shared context or state transfer needed.
- **ProfilePage (visitor mode)** has no local state — it fetches from Firestore and renders read-only.

## Firestore Read for Public Profiles

New function in `src/data/sync.ts`:

```typescript
export async function readPublicProfile(
  userId: string,
): Promise<(SkillState & { displayName: string; avatarUrl: string }) | null> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return null
  const data = snapshot.data() as FirestoreUserRead
  return {
    autonomy: data.skills.autonomy,
    parallelExecution: data.skills.parallelExecution,
    skillUsage: data.skills.skillUsage,
    safetyZone: data.safetyZone,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
  }
}
```

No auth required — relies on updated Firestore rules.

**Defensive note:** `writeAssessment` only includes `displayName`/`avatarUrl` when a `User` object is passed. If a document was somehow written without them, `readPublicProfile` should default to `"Anonymous"` / `""` rather than crashing. Add fallbacks:

```typescript
displayName: data.displayName ?? 'Anonymous',
avatarUrl: data.avatarUrl ?? '',
```

## E2E Tests

### New Gherkin scenarios

```gherkin
Feature: Shareable profile

  Scenario: Login redirects to profile URL and logout returns home
    Given I am on the landing page
    When I log in
    Then the URL changes to /profile/{my-uid}
    And I can still claim and unclaim skills
    When I sign out
    Then I am redirected to /

  Scenario: Share button copies profile link
    Given I am logged in with skills claimed
    When I click the share button
    Then the current URL is copied to clipboard
    And I see a "Link copied!" toast

  Scenario: View a shared profile (visitor)
    Given a user exists with skills claimed
    When I navigate to their profile URL
    Then I see their display name and avatar
    And I see their skill tree in read-only mode
    And I do not see claim or unclaim buttons
    And I see an "Assess your own skills" link

  Scenario: View a non-existent profile
    When I navigate to /profile/nonexistent-user-id
    Then I see a "Profile not found" message
    And I see a link to assess my own skills
```

### Testing notes

- **Clipboard:** Playwright needs `context.grantPermissions(['clipboard-read', 'clipboard-write'])` or a `page.evaluate` shim to intercept `navigator.clipboard.writeText`. Add a helper in `e2e/helpers/`.
- **Auth redirect timing:** Sign-in/sign-out steps need `await page.waitForURL()` after auth actions to avoid race conditions.
- **Firestore rules:** Verify `firebase.json` loads `firestore.rules` with the updated public-read rule. Consider a negative test: unauthenticated write to `/users/{userId}` should be denied.
- **Unit tests:** Add Vitest tests for `readPublicProfile` (null return, field mapping, missing fields) and `SkillTree` with `readonly` prop (no claim buttons rendered, no celebration effects).

### Existing tests

Existing E2E scenarios that operate on `/` continue to work — they test the unauthenticated landing experience. Auth-related scenarios that call sign-in will need `waitForURL` updates since login now redirects to `/profile/{uid}`.

## Implementation Steps

1. **Install React Router** — `pnpm add react-router`
2. **Add routing scaffold** — `BrowserRouter` in `main.tsx`, route definitions in `App.tsx`
3. **Extract LandingPage** — Move unauthenticated App.tsx content to `src/pages/LandingPage.tsx`
4. **Add auth redirect** — Login navigates to `/profile/{uid}`, logout navigates to `/`
5. **Add `readonly` prop to SkillTree** — Disable claim/unclaim when `true`
6. **Build ProfilePage** — Owner mode (editable) + visitor mode (read-only), with loading/not-found/error states. Use `/frontend-design` for the visitor layout and header states, then `/critique` to validate the result.
7. **Add `readPublicProfile`** — New Firestore read function in `src/data/sync.ts`
8. **Update Firestore rules** — Public reads (`allow read: if true`)
9. **Build ShareButton** — Copies current URL, or prompts login if unauthenticated
10. **Add 404.html trick** — Post-build copy in Vite config
11. **Write E2E tests** — New Gherkin scenarios + step definitions
12. **Update existing E2E tests** — Fix any that break due to auth redirect behavior
13. **Verify all quality gates** — `pnpm build && pnpm lint && pnpm typecheck && pnpm test:run && pnpm test:e2e:emulator`

## Implementation Notes

### Steps 1–4, 10: Routing + LandingPage extraction ✅

- Installed `react-router` v7.14.0
- `BrowserRouter` wraps the app in `main.tsx`; `App.tsx` defines three routes: `/`, `/profile/:userId`, `*` → redirect
- Extracted `LandingPage` from old `App.tsx` — localStorage-only, no Firestore sync
- Created `ProfilePage` with owner mode (full sync) and visitor mode stub
- Shared interaction logic (claim/unclaim/animation/safety-zone) extracted to `src/hooks/useSkillState.ts` to avoid duplication
- Auth redirect: login → `/profile/{uid}` with `replace: true`; auth loading returns `null` to prevent flash
- `postbuild` script in `package.json` copies `index.html` to `404.html` for GitHub Pages SPA routing
- All 34 unit tests pass, typecheck and lint clean

### Steps 5–9: ProfilePage + readonly SkillTree + ShareButton ✅

- Added `readonly` prop to SkillTree → QuestPath → SkillNode; hides claim/unclaim buttons
- `readPublicProfile()` in sync.ts: reads public Firestore docs, validates avatarUrl is HTTPS
- `FirestoreUserRead` interface marks displayName/avatarUrl as optional with fallbacks
- ProfilePage: owner mode with full Firestore sync, visitor mode with loading/found/not-found states
- Visitor mode shows profile banner (avatar + display name), read-only skill tree, safety zone badge
- Header supports 3 modes: landing, owner (sync status + share), visitor (view your profile link)
- ShareButton: copies current URL to clipboard via Clipboard API
- Firestore rules: public reads (`allow read: if true`), field-level write validation including HTTPS-only avatarUrl
- Security: avatarUrl validated at both Firestore rules level (regex) and client level (`isHttpUrl`)

### Steps 11–13: E2E + unit tests ✅

- 4 new E2E scenarios: login redirect, share button, visitor profile, non-existent profile
- 8 new unit tests: readPublicProfile (null, mapping, fallbacks, XSS rejection), SkillNode readonly (hide claim, hide unclaim, allow toggle)
- All 24 E2E tests pass (20 existing + 4 new)
- All 42 unit tests pass (34 existing + 8 new)

### Post-critique polish ✅

- Hero shows "[Name]'s Agentic Skills" for visitors instead of owner-directed "Map Your Agentic Skills"
- Safety zone badge shows colored dot + zone label + description (not bare jargon)
- Header visitor mode: "Assess your own skills" is primary CTA, "Sign in" is secondary
- Landing page header: "Share" button prompts sign-in for unauthenticated users
- Frontier nodes render as muted/future in readonly visitor view (no pulsing "Up next")
- Sign-out resets localStorage to defaults before redirecting to landing page
- New E2E scenario: "Sign-out resets skill tree to defaults"
- Final counts: 25 E2E scenarios, 42 unit tests
- Typecheck, lint, build all clean

## Risks and Mitigations

| Risk                                               | Mitigation                                                                                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase UID in URL leaks user identity            | UIDs are opaque strings, not personally identifiable. Document only contains display name + avatar (already chosen to be public by signing in with social auth).      |
| Public Firestore reads could be abused (scraping)  | Firebase rate limits apply. No listing endpoint — attacker would need to guess UIDs. Acceptable for MVP scale.                                                        |
| 404.html trick may cause brief flash of wrong page | React Router resolves fast enough that this is imperceptible. Skeleton state covers the transition.                                                                   |
| Existing E2E tests break with routing changes      | Auth-related steps need `waitForURL` updates. Unauthenticated tests on `/` should be unaffected.                                                                      |
| Clipboard API requires HTTPS or localhost          | Development runs on localhost (works). Production on skill.plepic.com (HTTPS via GitHub Pages). No issue.                                                             |
| Login from visitor page redirects away             | If viewing `/profile/xyz` and logging in, user is redirected to `/profile/{own-uid}`. Could be jarring. Acceptable for MVP — login from visitor page is an edge case. |
| `updatedAt` timestamp exposed in public reads      | Leaks when user last interacted. Minor — only visible via Firestore API, not rendered in UI.                                                                          |
