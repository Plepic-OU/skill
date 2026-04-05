# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gamified web app where developers self-assess agentic coding skills via an RPG-style skill tree. Hosted at skill.plepic.com. **Chunk 2 (Foundation) complete** — project scaffolded with full tooling and quality gates.

## Tech Stack

- **Frontend:** React + Vite + TypeScript SPA, deployed to GitHub Pages from `web/`
- **Backend:** Firebase (Auth with Google/GitHub, Firestore for user data) — no custom API
- **Styling:** Plepic design system ([HTML](https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.html), [CSS](https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.css)). Main color is green; orange used sparingly only
- **Infra:** Terraform for Firebase provisioning; Firebase CLI for security rules/indexes
- **Package manager:** pnpm (not npm)

## Build & Quality Commands

```bash
pnpm install          # install dependencies
pnpm dev              # local dev server (Vite)
pnpm build            # production build (typecheck + vite build → web/)
pnpm test             # run unit tests in watch mode (Vitest)
pnpm test:run         # run unit tests once
pnpm test <file>      # run a single test file
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # tsc --noEmit
```

Pre-commit hooks (Husky + lint-staged) enforce: ESLint, Prettier, and type-check on staged files. Vitest is not in the pre-commit hook yet (added in Chunk 3 when there are real tests).

## Key Directories

- `web/` — SPA deployment target (GitHub Pages serves from here)
- `docs/prototypes/prototype-c2.html` — **The reference prototype** (Quest Paths "Scrollwork"). Use this as the visual/interaction reference when building React components.
- `docs/` — Requirements, design specs, skill tree content
- `docs/superpowers/specs/` — Detailed design specifications
- `docs/skill-trees.json` — Static skill tree data (3 axes: autonomy, parallel execution, skill usage)
- `.impeccable.md` — Design context (brand personality, aesthetic direction, design principles)
- `.claude/skills/` — Custom Claude Code skills (validate-design, brainstorming, impeccable design suite)

## Architecture Decisions

- **No SSR** — pure client-side SPA. GitHub Pages 404.html trick for SPA routing
- **localStorage-first** — users interact without auth; state syncs to Firestore on login
- **Conflict resolution:** Firestore wins silently over localStorage
- **All synced profiles are public** — no sharing toggle for MVP
- **Skill tree data is static** — bundled from `docs/skill-trees.json`, not stored in Firestore
- **Firestore schema:** `users/{userId}/assessments/{assessmentId}` with skills as level numbers

## Implementation Order

The design spec defines 6 ordered chunks. See `docs/superpowers/specs/2026-04-04-agentic-skills-webapp-design.md` for details.

1. ~~Visual Prototype~~ ✅ (Chunk 1)
2. ~~Foundation~~ ✅ (Chunk 2) — `docs/superpowers/specs/2026-04-05-chunk2-foundation.md`
3. Component UI (Chunk 3) — next
4. Firebase Local (Chunk 4)
5. Shareable Results (Chunk 5)
6. Terraform & Deploy (Chunk 6)

## Development Practices

- Use context7 (`npx ctx7@latest`) when working with any third-party library for up-to-date docs
- Use chrome dev tools MCP for visual testing
- Gherkin/BDD tests for main user flows; Firebase emulator for E2E tests
- TypeScript with strong types throughout
- Mobile-first, playful > serious, less is more
