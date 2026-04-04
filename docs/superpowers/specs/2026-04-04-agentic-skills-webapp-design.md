# Agentic Development Skills Webapp — Design Spec

## Overview

A gamified web application where software developers self-assess their agentic coding skills through an RPG-style skill tree interface. Users progress through levels on three skill axes, with the experience designed around exploration and engagement rather than form-filling.

**Target audience:** Software developers using AI-assisted coding tools.

**UX note:** The flows and layouts described here are preliminary and subject to refinement by a UX designer.

## Architecture

Single-page application, no server-side rendering.

```
┌─────────────────────────────────┐
│  GitHub Pages (skill.plepic.com)│
│  ┌───────────────────────────┐  │
│  │  React + Vite + TypeScript│  │
│  │  SPA                      │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ Firebase SDK (client-side)
┌──────────────┼──────────────────┐
│  Firebase                       │
│  - Auth (Google, GitHub)        │
│  - Firestore (user skill data)  │
│  - Security Rules               │
└─────────────────────────────────┘
```

- **Frontend:** React + Vite + TypeScript, deployed to GitHub Pages
- **Backend:** Firebase (Auth + Firestore), no custom API layer
- **Styling:** Plepic design system (CSS), mobile-first with desktop support
- **Infrastructure:** Terraform for Firebase provisioning

## Skill Tree Content

The skill tree content is defined in `docs/skill-trees.json` and ships as static data with the app bundle. Three axes:

- **Autonomy** (6 levels) — How much you delegate to AI and your verification strategy
- **Parallel Execution** (5 levels) — How many concurrent AI tasks you manage
- **Skill Usage** (6 levels) — How sophisticated your AI tooling is

Plus a **Safety Zone** dimension (safe-zone / normal / hardcore / impossible) — this describes the consequence level of your environment, not a skill progression. Selected separately.

Each level includes: name, description, verification strategy, obstacles, and how-to-progress guidance.

## Gamified UX

### RPG Skill Tree Interface

The core experience is an RPG talent tree:

- 3 visual paths (one per axis), each showing connected level nodes
- **Level 1 starts unlocked** on all axes
- Higher levels are visible but **locked/dimmed** — users can peek ahead
- Users click a node to expand details (description, obstacles, growth path)
- **"I've reached this level"** unlocks the node — this IS the assessment
- Users can also **level down** if they reassess
- Unlocked/claimed nodes get visual distinction (glow, badge, color)
- No separate assessment wizard — the tree IS the interaction

### Safety Zone

Separate selector alongside the skill tree — like choosing your "difficulty mode." Frames context but doesn't gate progression.

### Screens

1. **Skill Map (Landing + Profile)** — The full skill tree is the single main view. For unauthenticated users it's the browseable landing page. For authenticated users it shows their progress — same screen, same URL. Share button appears when progress exists.
2. **Node Detail** — Expanded view of a skill level: description, obstacles, how to progress. Inline or modal.
3. **Shared Profile** — Public read-only view at `/profile/{userId}`. Same tree visualization with the user's progress, no edit controls. No auth required to view.

### Navigation

Minimal. The skill tree map is the landing page. Top bar with login/profile in the standard top-right position.

## Auth & Persistence

### No auth required for interaction

- Users can level up/down freely, explore everything without logging in
- State lives in **localStorage** — progress survives page refreshes

### Auth for persistence and sharing

- **Login button** in top-right corner (standard placement). Shows avatar/name when logged in
- **"Share" button** near the profile/tree — prompts login if not authenticated (must persist to Firestore before generating shareable link)
- **"Login to save"** button also available separately

### Data sync

```
Interact with tree → localStorage (immediate)
                          │
            Login ────────┤
                          ▼
                    Sync to Firestore
                          │
            Share ────────┤
                          ▼
                    Public URL with userId
```

- Once logged in, localStorage state syncs to Firestore automatically
- On conflict (existing local + existing Firestore data), Firestore wins
- Experience stays snappy — no loading spinners for progression

## Data Model

### Static content (bundled with app)

`skill-trees.json` — axes, levels, descriptions, growth paths. Read-only, no Firestore.

### Firestore schema

```
users/{userId}
  ├── displayName: string
  ├── avatarUrl: string
  ├── shareEnabled: boolean
  └── assessments/
        └── {assessmentId}    // "latest" for MVP, timestamped for history
              ├── timestamp: Date
              ├── safetyZone: "safe-zone" | "normal" | "hardcore" | "impossible"
              ├── skills: {
              │     autonomy: 1-6,
              │     parallelExecution: 1-5,
              │     skillUsage: 1-6
              │   }
              └── notes: {       // optional free-text per axis
                    autonomy?: string,
                    parallelExecution?: string,
                    skillUsage?: string
                  }
```

- Safety zone is per-assessment (environment context, not skill)
- Skills stored as level numbers — meaning comes from static skill-trees.json
- `shareEnabled` controls public visibility
- Assessments subcollection allows history; MVP uses "latest"

## Style

- Plepic design system CSS
- Mobile-first, desktop support
- Playful > serious — RPG theme reinforces this
- Less is more — minimal chrome, the tree is the hero
- Main color: Plepic green. Orange used sparingly only.

## Testing & Quality

**Quality is a first-class concern.**

### Pre-commit hooks (Husky + lint-staged)

Deterministic, non-negotiable checks enforced on every commit:

- ESLint (strict TypeScript config)
- Prettier (formatting)
- `tsc --noEmit` (type-check)
- Unit tests on changed files

### Test layers

- **Unit (Vitest):** Component logic, skill tree state management, level progression rules
- **BDD/Gherkin (Cucumber):** Feature files covering core user flows:
  - Browse skill tree without auth
  - Level up/down on an axis
  - Login and Firestore sync
  - Share a profile
  - View a shared profile
- **E2E:** Run against Firebase emulator for auth + Firestore
- **CI (GitHub Actions):** Full lint + type-check + unit + E2E. Mirrors pre-commit but runs full suite.

## Implementation Chunks

Ordered for incremental delivery:

1. **Visual Prototype** — Static HTML/CSS mockups of all screens using Plepic design system. Skill tree visualization, nodes, progression states, profile views. Plain files, no build tooling.
2. **Foundation** — Project scaffold: React + Vite + TypeScript, pnpm, ESLint, Prettier, Husky pre-commit hooks, Plepic design system wired in.
3. **Component UI** — Turn prototype into React components with routing and local state (localStorage). Interactive skill tree works entirely client-side.
4. **Firebase Local** — Firebase emulator setup, auth (social login), Firestore persistence. Sync logic (localStorage ↔ Firestore). Full E2E/BDD tests against emulator.
5. **Shareable Results** — Shareable profile links, public read-only views. Still running against emulator.
6. **Terraform & Deploy** — Infrastructure as code for Firebase. Deploy SPA to GitHub Pages, connect to production Firebase.
