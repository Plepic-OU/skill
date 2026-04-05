# Chunk 3: Component UI — Design Spec

## Overview

Turn the HTML prototype (`docs/prototypes/prototype-c2.html`) into React components with routing-free client-side interaction and localStorage persistence. At the end of this chunk the app renders a fully interactive skill tree — expand/collapse nodes, claim/unclaim levels, select safety zones, see progress — all persisted across page refreshes. No Firebase, no auth, no server.

**Depends on:** Chunk 2 (Foundation) ✅

## Scope

### In scope

- Enrich `docs/skill-trees.json` with `levelIcon` and Material Symbols axis icon fields
- TypeScript interfaces for skill tree data and app state
- 7 React components matching the prototype's visual design and interactions
- localStorage persistence (single JSON blob)
- Claim/unclaim with celebration effect (particle burst, ripple, seal stamp animation)
- Safety zone selector
- Progress summary chips in hero
- Keyboard accessibility (Tab, Enter/Space)
- `prefers-reduced-motion` support
- Scrollwork-specific CSS tokens in `index.css`
- CSS Modules for all component styles
- Unit tests (Vitest) for state logic, component interactions
- E2E tests (Playwright + playwright-bdd) with Gherkin feature files
- Pre-commit hook runs lint, typecheck, unit tests, and E2E tests

### Out of scope

- Routing (Chunk 5 — no React Router installed)
- Firebase SDK, auth, Firestore sync (Chunk 4)
- Shared profile view at `/profile/{userId}` (Chunk 5)
- CI/CD pipeline (Chunk 6)

## Data

### Enriching `skill-trees.json`

The canonical data file `docs/skill-trees.json` is enriched with fields from the prototype:

- Each axis `icon` field changes from emoji to Material Symbols name
- Each level gets a `levelIcon` field (Material Symbols name)

**Full icon mapping from the prototype:**

| Axis               | Icon         |
| ------------------ | ------------ |
| Autonomy           | `swap_horiz` |
| Parallel Execution | `bolt`       |
| Skill Usage        | `build`      |

| Axis               | Level                      | levelIcon       |
| ------------------ | -------------------------- | --------------- |
| Autonomy           | 1 Autocomplete             | `keyboard`      |
| Autonomy           | 2 Review Every Edit        | `rate_review`   |
| Autonomy           | 3 Review Per Session       | `checklist`     |
| Autonomy           | 4 Review Critical Only     | `shield`        |
| Autonomy           | 5 Review the Result        | `verified`      |
| Autonomy           | 6 Fully Automated          | `rocket_launch` |
| Parallel Execution | 1 Single Task              | `looks_one`     |
| Parallel Execution | 2 Manual Parallel          | `splitscreen`   |
| Parallel Execution | 3 Task Queue               | `queue`         |
| Parallel Execution | 4 Directed Orchestration   | `account_tree`  |
| Parallel Execution | 5 Autonomous Orchestration | `hub`           |
| Skill Usage        | 1 Built-in Only            | `inventory_2`   |
| Skill Usage        | 2 Third-Party Skills       | `extension`     |
| Skill Usage        | 3 MCP Services             | `cable`         |
| Skill Usage        | 4 Create Skills Manually   | `construction`  |
| Skill Usage        | 5 Create Skills with AI    | `auto_fix_high` |
| Skill Usage        | 6 Self-Improving Loop      | `all_inclusive` |

The prototype's inline data copy becomes obsolete — the app imports from the canonical JSON.

**Note:** Material Symbols Rounded font is already loaded in `index.html` from Chunk 2 (with params `opsz,wght,FILL,GRAD@24,400,1,0` — filled variant). No additional font setup needed.

### TypeScript Interfaces

```typescript
// src/types/skill-tree.ts

export type SafetyZoneId = 'safe-zone' | 'normal' | 'hardcore' | 'impossible'
export type AxisId = 'autonomy' | 'parallelExecution' | 'skillUsage'

export interface Level {
  level: number
  name: string
  desc: string
  levelIcon: string // Material Symbols icon name
  verification?: string // Autonomy axis has this
  obstacles: string[]
  howToProgress: string[]
}

export interface Axis {
  name: string
  description: string
  icon: string // Material Symbols icon name
  color: string
  levels: Level[]
}

export interface SafetyZone {
  label: string
  color: string
  bg: string
  border: string
  desc: string
}

export interface SkillTreeData {
  axes: Record<AxisId, Axis>
  safety: {
    name: string
    description: string
    icon: string
    zones: Record<SafetyZoneId, SafetyZone>
  }
}

export interface SkillState {
  autonomy: number
  parallelExecution: number
  skillUsage: number
  safetyZone: SafetyZoneId
}
```

### Data Module

```typescript
// src/data/skill-trees.ts
import rawData from '../../docs/skill-trees.json'
import type { SkillTreeData } from '../types/skill-tree'

export const skillTreeData: SkillTreeData = rawData as SkillTreeData
```

Typed re-export. Single import point for all components.

## State Management

### Approach: useState in App, prop-drill

The state is 4 fields. The component tree is 4 levels deep. No Context, no external library. Props pass down, callbacks pass up.

### State Shape

```typescript
const DEFAULT_STATE: SkillState = {
  autonomy: 1,
  parallelExecution: 1,
  skillUsage: 1,
  safetyZone: 'safe-zone',
}
```

Level 1 starts claimed on all axes (matching the parent design spec: "Level 1 starts unlocked on all axes"). On first visit, level 1 is claimed and level 2 is the frontier.

### localStorage Sync

- **Key:** `plepic-skill-state`
- **On mount:** read key, parse JSON, validate shape, fall back to `DEFAULT_STATE` on any error
- **On state change:** `JSON.stringify` and write. No debounce — writes happen on discrete user clicks.
- **Validation:** check that each axis value is a number within range, safetyZone is a valid ID. Invalid data → default state.

### Claim/Unclaim Logic

- `claimLevel(axisId, level)` — sets `state[axisId] = level`. Claiming level N implicitly claims all levels below (the state stores the highest claimed level, not individual flags). Celebration fires once, on the clicked node only.
- `unclaimLevel(axisId, level)` — sets `state[axisId] = level - 1`. Only the highest claimed node shows the "Not here yet" button. Lower claimed nodes show no action button when expanded — this prevents confusing mid-stack unclaims.

**Note on Firestore compatibility:** localStorage stores the highest claimed level (1-6). This matches the Firestore schema range (1-6). Default state is 1 on all axes. The sync logic in Chunk 4 maps directly.

### Derived Node State

For each node, derived from `claimedLevel = state[axisId]`:

- `level <= claimedLevel` → **claimed** (unfurled scroll, wax seal)
- `level === claimedLevel + 1` → **frontier** (pulsing indicator, "Up next")
- `level > claimedLevel + 1` → **future** (dimmed, rolled-up scroll)

## Project Structure

```
src/
├── main.tsx                    # React entry (unchanged)
├── App.tsx                     # Root: state, layout, localStorage sync
├── App.module.css              # Root layout styles
├── index.css                   # Global resets + Scrollwork tokens + parchment texture
├── vite-env.d.ts               # (unchanged)
├── test-setup.ts               # (unchanged)
├── data/
│   └── skill-trees.ts          # Typed re-export of docs/skill-trees.json
├── types/
│   └── skill-tree.ts           # TypeScript interfaces
├── components/
│   ├── Header.tsx
│   ├── Header.module.css
│   ├── Hero.tsx
│   ├── Hero.module.css
│   ├── SafetyZoneSelector.tsx
│   ├── SafetyZoneSelector.module.css
│   ├── SkillTree.tsx
│   ├── SkillTree.module.css
│   ├── QuestPath.tsx
│   ├── QuestPath.module.css
│   ├── SkillNode.tsx
│   ├── SkillNode.module.css
│   ├── CelebrationEffect.ts    # Plain TS — imperative DOM, no JSX
│   └── __tests__/
│       ├── App.test.tsx
│       ├── SkillNode.test.tsx
│       ├── SafetyZoneSelector.test.tsx
│       └── skill-tree-state.test.ts
e2e/                            # At project root, not inside src/
├── features/
│   ├── browse-skill-tree.feature
│   ├── claim-level.feature
│   ├── safety-zone.feature
│   ├── persistence.feature
│   └── keyboard-navigation.feature
└── steps/
    ├── browse-skill-tree.ts
    ├── claim-level.ts
    ├── safety-zone.ts
    ├── persistence.ts
    └── keyboard-navigation.ts
```

## Components

### Header

Sticky top bar with glassmorphic backdrop blur (`rgba(250, 247, 242, 0.94)` + `backdrop-filter: blur(16px)`).

- Left: "P" logo icon (green square with white P) + "Agentic Skills" text in Zilla Slab
- Right: "Log in to save" button — **shows a "Coming soon" tooltip on click** (Chunk 4 wires up actual auth). Tooltip is a brief, dismissible message or CSS-only tooltip.
- Height: 56px, sticky top, z-index 100

### Hero

- Title: "Map Your Agentic Skills" with gradient text effect (ink → green-dark) and decorative flourish underline
- Subtitle: "Where are you on the path to agentic development mastery? Claim the levels you've reached and see what's next."
- Progress summary: row of chips, one per axis. Each chip shows colored dot + axis name + "level/max" in mono font (max derived from `axis.levels.length`). On first visit (default state), chips show "1/6", "1/5", "1/6". Chips update live on claim/unclaim.

### SafetyZoneSelector

- Label: "What's at stake in your environment?"
- 4 buttons in a row (flex, wrapping on small screens)
- `role="radiogroup"` with `aria-checked` on each button
- Active button fills with zone color, inactive shows bordered outline
- Zone description text below, updates on selection
- Colors from `skill-trees.json` safety zone data

### SkillTree

- 3-column grid on desktop (`min-width: 820px`), single column on mobile
- Maps over `axes` object, renders a `QuestPath` for each
- Sets `--node-color` CSS custom property per path via inline style

### QuestPath

- **Ribbon banner header:** axis icon (Material Symbols) + axis name in colored ribbon with fold effects. Subtitle with axis description below.
- **Node list:** vertical flex column, max-width 360px centered
- **Trail connectors** between nodes (not a separate component — rendered inline):
  - `solid` vine/rope between two claimed nodes
  - `dashed` between last claimed and frontier
  - `faded` between frontier/future nodes
  - Connectors use `--node-color` for tinting
- **Meandering path:** nodes alternate slight left/right offset (`translateX(±3-4%)`) on desktop for the winding trail feel. Disabled on mobile.

### SkillNode

The most complex component. Three visual states driven by props:

**Claimed node (unfurled scroll):**

- Parchment gradient background
- Wax seal indicator: radial gradient with embossed shadow, colored per axis
- Level label shows "You are here" for highest claimed, "Level N" for others
- Name in bold ink color, description preview (2-line clamp)

**Frontier node (partially unrolled):**

- Subtle color-tinted parchment background
- Pulsing dashed indicator ring (`sealPulse` keyframe animation)
- Level label shows "Up next"
- Thicker, color-tinted border with glow

**Future node (rolled-up scroll):**

- Dimmed (opacity 0.55), minimal padding
- Plain parchment indicator, no description preview
- Subtle rolled-scroll shadow at bottom

**All node states are expandable** — including future nodes. Clicking a future node reveals its full description, obstacles, and a "This is me" button to claim it.

**Expand/collapse behavior:**

- Click or Enter/Space toggles expansion. SkillNode renders as a `<div>` with `role="button"` and an explicit `keydown` handler for Enter/Space (not relying on browser click synthesis for divs).
- Only one node expanded per QuestPath at a time (accordion). **Accordion state is local to QuestPath** (`useState` inside QuestPath), not part of App state — it's ephemeral UI state, not persisted.
- Expanded view slides open via `max-height` transition (0 → 1200px, cubic-bezier). Using 1200px to accommodate long content on narrow mobile viewports.
- Expanded content: full description, verification strategy (if exists), "What makes this hard" list, "How to get here" list, action button

**Action buttons (inside expanded detail):**

- **Frontier or future node (not claimed):** "This is me" (gradient colored button) → calls `onClaim(axisId, level)`, triggers CelebrationEffect
- **Highest claimed node:** "Not here yet" (outline button) → calls `onUnclaim(axisId, level)`
- **Lower claimed nodes (below highest):** no action button shown — prevents confusing mid-stack unclaims
- Clicking action button does NOT toggle expansion (event propagation stopped)

**Accessibility:**

- `tabindex="0"`, `role="button"`, `aria-expanded`, explicit `keydown` handler for Enter/Space
- `aria-label` includes level number, name, and state (reached/up next/not yet reached)
- `focus-visible` outline in axis color
- **Skip link:** an `<a href="#questMap">Skip to skill tree</a>` renders before the Header in the DOM (visually hidden until focused). Positioned absolutely, shown on `:focus`.

### CelebrationEffect

Exported function, not a React component:

```typescript
export function celebrate(element: HTMLElement, color: string): void
```

Called by SkillNode when a level is claimed. Creates:

1. **Particle burst** — 16 particles (sparks, dots, rings) radiating outward from the element center. CSS animation via custom properties `--tx`/`--ty`.
2. **Ripple ring** — expanding circle border, fades out.
3. **Center flash** — radial gradient glow, scales up and fades.
4. **Seal stamp animation** — adds `just-claimed` class to the indicator for a bounce-rotate effect.

All elements auto-removed after 900ms. Respects `prefers-reduced-motion: reduce` — returns immediately without creating effects.

## Styling

### Scrollwork Tokens

Added to `src/index.css` `:root` block:

```css
:root {
  --parchment: #f5f0e6;
  --parchment-dark: #e8dece;
  --parchment-edge: #d4c8b4;
  --ink: #3d3222;
  --seal-shadow: rgba(80, 40, 10, 0.3);
}
```

### Parchment Texture

The `body::before` (aged parchment gradients) and `body::after` (linen grain) pseudo-elements from the prototype move into `src/index.css` as global styles.

### CSS Modules

Every component gets a `.module.css` file. Styles are scoped automatically by Vite.

Per-axis coloring flows through `--node-color` CSS custom property, set on `QuestPath` root element and inherited by all children via DOM inheritance (CSS Modules do not create shadow DOM, so custom properties flow normally). This enables `color-mix()` expressions in CSS without JavaScript.

### Global CSS (not in Modules)

CelebrationEffect injects DOM elements imperatively and adds a `just-claimed` class to node indicators. These styles **cannot** go in CSS Modules (the hashed class names wouldn't match). Instead, celebration-related styles go in `src/index.css` as global CSS:

- `.claim-celebration`, `.claim-particle`, `.claim-ripple`, `.claim-flash` — particle and effect styles
- `.just-claimed` — seal stamp bounce animation (the `sealStamp` keyframe)
- `@keyframes particleBurst`, `rippleExpand`, `flashGlow`, `sealStamp`
- `@media (prefers-reduced-motion: reduce)` override for all celebration animations

### Z-index Stack

| Layer                 | Z-index | Elements                            |
| --------------------- | ------- | ----------------------------------- |
| Parchment texture     | 0       | `body::before`, `body::after`       |
| Content               | 1       | Hero, SafetyZone, SkillTree, Footer |
| Sticky header         | 100     | Header                              |
| Celebration flash     | 998     | `.claim-flash`                      |
| Celebration ripple    | 999     | `.claim-ripple`                     |
| Celebration particles | 1000    | `.claim-celebration`                |

### Responsive Breakpoints

- `>= 820px`: 3-column grid, path meandering enabled
- `< 820px`: single column (max-width 440px centered), no meandering, smaller indicators/ribbons
- `< 380px`: further reduced sizes for safety buttons, progress chips, node padding

### Additional Global Styles

Add to `src/index.css`:

- `overflow-x: hidden` on `body` to prevent horizontal scrollbar from node meandering `translateX` offsets
- Header background note: `rgba(250, 247, 242, 0.94)` is the alpha-modified form of `--bg: #faf7f2`. CSS cannot do `rgba(var(--bg), 0.94)`, so this value is hardcoded. If `--bg` changes in the design system, update the header background manually.

## Testing

### Unit Tests (Vitest)

| Test file                     | What it verifies                                                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.test.tsx`                | Renders without crashing, loads default state when localStorage empty                                                                                                                                                        |
| `SkillNode.test.tsx`          | Expand/collapse toggle, claim calls handler, unclaim calls handler, correct ARIA attributes per state. Mock `CelebrationEffect.celebrate` to avoid imperative DOM in jsdom.                                                  |
| `SafetyZoneSelector.test.tsx` | Zone selection calls handler, active zone has correct aria-checked, description updates                                                                                                                                      |
| `skill-tree-state.test.ts`    | Pure logic: localStorage read/write/validation, default state fallback, invalid JSON handling, out-of-range values → default state. Also: claimLevel sets highest, unclaimLevel decrements, unclaiming level 1 → 0 boundary. |

### E2E Tests (Playwright + playwright-bdd)

Gherkin feature files covering core user flows:

**browse-skill-tree.feature:**

```gherkin
Feature: Browse skill tree

  Scenario: View all three skill axes
    Given I open the skill tree page
    Then I should see the "Autonomy" path
    And I should see the "Parallel Execution" path
    And I should see the "Skill Usage" path

  Scenario: Expand a node to see details
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    Then I should see the node detail with "How to get here"

  Scenario: Collapse an expanded node
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    And I click on the "Autocomplete" node again
    Then the node detail should be hidden

  Scenario: Only one node expanded per path at a time
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    And I click on the "Review Every Edit" node
    Then the "Autocomplete" node detail should be hidden
    And the "Review Every Edit" node detail should be visible
```

**claim-level.feature:**

```gherkin
Feature: Claim and unclaim levels

  Scenario: Claim a level on an axis
    Given I open the skill tree page
    When I expand the "Autocomplete" node
    And I click "This is me"
    Then the "Autocomplete" node should be claimed

  Scenario: Claiming a level updates the progress summary
    Given I open the skill tree page
    When I claim the "Autocomplete" level
    Then the Autonomy progress chip should show "1/6"

  Scenario: Unclaim a level on an axis
    Given I open the skill tree page
    And the "Autocomplete" level is claimed
    When I expand the "Autocomplete" node
    And I click "Not here yet"
    Then the "Autocomplete" node should not be claimed

  Scenario: Claiming level 3 marks levels 1 and 2 as claimed
    Given I open the skill tree page
    When I expand the "Review Per Session" node
    And I click "This is me"
    Then the "Autocomplete" node should be claimed
    And the "Review Every Edit" node should be claimed
    And the "Review Per Session" node should be claimed
```

**safety-zone.feature:**

```gherkin
Feature: Safety zone selection

  Scenario: Default safety zone is safe-zone
    Given I open the skill tree page
    Then the "Safe-zone" button should be active

  Scenario: Select a different safety zone
    Given I open the skill tree page
    When I click the "Hardcore" safety zone button
    Then the "Hardcore" button should be active
    And the "Safe-zone" button should not be active
    And I should see the hardcore zone description
```

**persistence.feature:**

```gherkin
Feature: State persistence

  Scenario: Progress survives page reload
    Given I open the skill tree page
    And I claim the "Autocomplete" level
    When I reload the page
    Then the "Autocomplete" node should be claimed

  Scenario: Safety zone survives page reload
    Given I open the skill tree page
    And I select the "Normal" safety zone
    When I reload the page
    Then the "Normal" button should be active
```

**keyboard-navigation.feature:**

```gherkin
Feature: Keyboard navigation

  Scenario: Navigate and expand nodes with keyboard
    Given I open the skill tree page
    When I tab to the first skill node
    And I press Enter
    Then the node detail should be visible
    When I tab to the claim button
    And I press Enter
    Then the node should be claimed
```

### E2E Setup

- **`playwright.config.ts`** at project root (outside `src/` — not type-checked by the main `tsconfig.json`)
- **`tsconfig.e2e.json`** — separate TypeScript config for E2E files, includes `e2e/` and `playwright.config.ts`
- `webServer` option starts `pnpm dev` automatically
- Tests in `e2e/` directory (outside `src/`)
- Step definitions in `e2e/steps/` matching feature files
- `pnpm test:e2e` script runs Playwright with playwright-bdd

**Note on `resolveJsonModule`:** `tsconfig.json` already has `resolveJsonModule: true` from Chunk 2. The import `../../docs/skill-trees.json` from `src/data/skill-trees.ts` resolves correctly — Vite bundles the JSON into the JS output at build time, so the `docs/` directory does not need to be deployed.

### Pre-commit Hook

Updated `.husky/pre-commit`:

```bash
pnpm exec lint-staged
pnpm exec tsc --noEmit
pnpm test:run
pnpm test:e2e
```

All quality gates enforced on every commit: lint, format, typecheck, unit tests, E2E tests. No untested code lands.

## Dependencies

### New Production Dependencies

None. React and ReactDOM already installed.

### New Development Dependencies

| Package            | Purpose                                |
| ------------------ | -------------------------------------- |
| `@playwright/test` | E2E test runner and browser automation |
| `playwright-bdd`   | Gherkin/BDD support for Playwright     |

### Package Scripts

New/updated scripts in `package.json`:

```json
{
  "test:e2e": "playwright test"
}
```

## Verification Criteria

Chunk 3 is done when:

1. `pnpm dev` shows the full interactive skill tree matching the prototype visually
2. All 3 axes render with correct levels, icons, and descriptions from enriched `skill-trees.json`
3. Clicking a node expands its detail; clicking again collapses; only one expanded per path
4. "This is me" claims the level with celebration effect; "Not here yet" unclaims
5. Safety zone selector works with visual feedback and description updates
6. Progress chips in hero update live on claim/unclaim
7. State persists across page refresh via localStorage
8. Mobile layout (single column) works at < 820px viewport
9. Keyboard navigation works (Tab, Enter/Space to toggle and claim)
10. `prefers-reduced-motion` disables celebration animations
11. `pnpm test:run` passes all unit tests
12. `pnpm test:e2e` passes all E2E/Gherkin tests
13. `pnpm build` succeeds
14. `pnpm lint` and `pnpm typecheck` pass
15. Pre-commit hook blocks commits with failing tests

## Risks and Mitigations

| Risk                                                                          | Mitigation                                                                                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| CSS from prototype is ~1200 lines — porting may introduce visual regressions  | Use Chrome DevTools MCP to visually compare against prototype during implementation                                                   |
| `color-mix()` CSS function has limited browser support in older browsers      | Acceptable — target audience is developers on modern browsers. `color-mix()` has 95%+ global support.                                 |
| Playwright E2E in pre-commit adds commit latency                              | Tests should run in <10s against the dev server. If too slow, can switch to running only on changed feature areas.                    |
| `max-height` animation for expand/collapse causes layout jank on slow devices | Using `cubic-bezier(0.16, 1, 0.3, 1)` easing and 900px max-height. Acceptable trade-off for CSS-only animation without measuring DOM. |
| CelebrationEffect creates DOM elements outside React's control                | Elements auto-cleanup after 900ms. No memory leak risk. React doesn't need to know about them.                                        |

## Implementation Chunks

Suggested order for incremental delivery within this chunk:

1. **Data & Types** — Enrich `skill-trees.json`, create TypeScript interfaces, create data module
2. **Scrollwork Tokens & Global Styles** — Update `index.css` with tokens and parchment texture
3. **Header + Hero** — Static components, progress chips wired to state
4. **SafetyZoneSelector** — Interactive, wired to state
5. **SkillTree + QuestPath** — Grid layout, ribbon banners, trail connectors
6. **SkillNode** — Three states, expand/collapse, claim/unclaim
7. **CelebrationEffect** — Particle burst, ripple, seal stamp
8. **localStorage Persistence** — Read on mount, write on change, validation
9. **Unit Tests** — State logic, component interaction tests
10. **E2E Tests** — Playwright + playwright-bdd setup, Gherkin features, step definitions
11. **Pre-commit Hook Update** — Add test:run and test:e2e to hook
