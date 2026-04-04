# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gamified web app where developers self-assess agentic coding skills via an RPG-style skill tree. Hosted at skill.plepic.com. Currently in **early design phase** — no implementation code yet.

## Tech Stack (Planned)

- **Frontend:** React + Vite + TypeScript SPA, deployed to GitHub Pages from `web/`
- **Backend:** Firebase (Auth with Google/GitHub, Firestore for user data) — no custom API
- **Styling:** Plepic design system ([HTML](https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.html), [CSS](https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.css)). Main color is green; orange used sparingly only
- **Infra:** Terraform for Firebase provisioning; Firebase CLI for security rules/indexes
- **Package manager:** pnpm (not npm)

## Build & Quality Commands (Once Scaffolded)

```bash
pnpm install          # install dependencies
pnpm dev              # local dev server (Vite)
pnpm build            # production build
pnpm test             # run unit tests (Vitest)
pnpm test <file>      # run a single test file
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # tsc --noEmit
```

Pre-commit hooks (Husky + lint-staged) enforce: ESLint, Prettier, type-check, and unit tests on changed files.

## Key Directories

- `web/` — SPA deployment target (GitHub Pages serves from here)
- `docs/` — Requirements, design specs, skill tree content
- `docs/superpowers/specs/` — Detailed design specifications
- `docs/skill-trees.json` — Static skill tree data (3 axes: autonomy, parallel execution, skill usage)
- `.claude/skills/` — Custom Claude Code skills (validate-design, brainstorming)

## Architecture Decisions

- **No SSR** — pure client-side SPA. GitHub Pages 404.html trick for SPA routing
- **localStorage-first** — users interact without auth; state syncs to Firestore on login
- **Conflict resolution:** Firestore wins silently over localStorage
- **All synced profiles are public** — no sharing toggle for MVP
- **Skill tree data is static** — bundled from `docs/skill-trees.json`, not stored in Firestore
- **Firestore schema:** `users/{userId}/assessments/{assessmentId}` with skills as level numbers

## Implementation Order

The design spec defines 6 ordered chunks: Visual Prototype → Foundation → Component UI → Firebase Local → Shareable Results → Terraform & Deploy. See `docs/superpowers/specs/2026-04-04-agentic-skills-webapp-design.md` for details.

## Development Practices

- Use context7 (`npx ctx7@latest`) when working with any third-party library for up-to-date docs
- Use chrome dev tools MCP for visual testing
- Gherkin/BDD tests for main user flows; Firebase emulator for E2E tests
- TypeScript with strong types throughout
- Mobile-first, playful > serious, less is more
