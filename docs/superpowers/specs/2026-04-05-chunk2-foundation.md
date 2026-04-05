# Chunk 2: Foundation — Design Spec

## Overview

Scaffold the React + Vite + TypeScript project with full tooling, quality gates, and the Plepic design system wired in. At the end of this chunk the app renders a "Hello World" page styled with Plepic fonts and CDN tokens, and every commit is guarded by ESLint, Prettier, and type-check.

**Depends on:** Chunk 1 (Visual Prototype) ✅

## Scope

This chunk is purely scaffolding and tooling. No application logic, no components beyond a smoke-test `<App />`, no routing, no state management.

### In scope

- Vite + React + TypeScript project at project root (SPA output to `web/`)
- pnpm as package manager (lockfile committed)
- ESLint (strict TypeScript config)
- Prettier (formatting)
- Husky + lint-staged pre-commit hooks (lint + format + typecheck only — no test runner in hook)
- Vitest + React Testing Library (with a passing smoke test, run manually / in CI)
- Plepic design system integrated (CDN CSS + font imports)
- GitHub Pages build output configured (`web/` as deploy target)
- `tsconfig.json` with strict mode
- `.env` convention established (`.env.example`, `.gitignore` rules)
- CSS Modules as the component styling methodology

### Out of scope

- Application components, routing, state (Chunk 3)
- Local design tokens in `src/index.css` — deferred to Chunk 3 when components need them. This chunk relies on the CDN stylesheet for all tokens.
- Firebase SDK or auth (Chunk 4)
- CI/CD pipeline (Chunk 6)
- BDD/Gherkin/Cucumber setup (Chunk 4)
- Vitest in pre-commit hook (Chunk 3 — when there are real tests worth guarding)

## Project Structure

```
skill/                          # repo root
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Minimal root component
│   ├── App.module.css          # Smoke-test component styles (CSS Modules)
│   ├── App.test.tsx            # Smoke test (renders without crashing)
│   ├── index.css               # Minimal global styles (resets, body defaults)
│   └── test-setup.ts           # Testing Library jest-dom setup
├── index.html                  # Vite entry HTML (loads src/main.tsx)
├── public/                     # Static assets (favicon, etc.)
├── web/                        # Build output (vite.config `outDir: 'web'`)
├── docs/
│   └── prototypes/             # Prototype moved here from web/prototypes/
│       └── prototype-c2.html
├── .env.example                # Template for env vars (VITE_ prefix convention)
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── eslint.config.js            # Flat config (ESLint 9+)
├── .prettierrc
├── .prettierignore
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── .husky/
│   └── pre-commit
└── .lintstagedrc.json
```

### Key structural decisions

1. **Source code at `src/`**, not `web/src/`. The `web/` directory is the build output for GitHub Pages, not the source root. Vite's `outDir` points to `web/`. This keeps source and deploy artifacts cleanly separated.

2. **Prototype moved to `docs/prototypes/`.** Previously at `web/prototypes/`. Moving it out of the build output directory means Vite can use `emptyOutDir: true` (default) — no custom clean script needed. The prototype is a reference document, not a deployed artifact. Accessible during development via direct file path or a simple Vite dev server alias if needed.

3. **`index.html` at repo root** (Vite convention). Vite serves it as the entry point in dev and copies it to `web/` on build.

4. **`base: '/'` is intentionally omitted** (Vite default). The site is served from the domain root at `skill.plepic.com`. If hosting ever moves to a subpath (e.g., `user.github.io/skill/`), this must be updated.

5. **CSS Modules for component styles.** Files named `*.module.css` are automatically scoped by Vite. This prevents class name collisions with the Plepic design system CDN stylesheet. Global styles go in `index.css` only.

6. **No local design tokens in this chunk.** The CDN stylesheet provides all CSS custom properties. Local token definitions will be added in Chunk 3 if components need overrides or Scrollwork-specific tokens (`--parchment`, `--ink`, etc.).

## Tooling Configuration

### Vite (`vite.config.ts`)

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'web',
  },
  server: {
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
```

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

### TypeScript Node (`tsconfig.node.json`)

For Vite config and other Node-side files:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

Note: `tsc --noEmit` in the pre-commit hook uses the root `tsconfig.json`, which covers `src/` only. `vite.config.ts` is type-checked by the IDE via `tsconfig.node.json` but not by the pre-commit hook. This is acceptable — Vite config changes are infrequent and caught immediately by `pnpm dev` or `pnpm build`.

### ESLint (`eslint.config.js`)

Flat config (ESLint 9+):

- `@eslint/js` recommended
- `typescript-eslint` strict config
- `eslint-plugin-react-hooks` rules
- `eslint-plugin-react-refresh` (warn on non-exportable components)
- Globals: browser

No `eslint-plugin-react` (the base plugin) — `react-hooks` and `react-refresh` are sufficient. The base plugin's JSX rules are redundant with TypeScript checking.

### Prettier (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

Matches common Plepic/community conventions. `.prettierignore` excludes `web/`, `node_modules/`, `pnpm-lock.yaml`.

### Husky + lint-staged

**Pre-commit hook** runs lint-staged then typecheck:

**`.lintstagedrc.json`:**

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,html}": ["prettier --write"]
}
```

The `.husky/pre-commit` script:

```bash
pnpm exec lint-staged
pnpm exec tsc --noEmit
```

Vitest is **not** in the pre-commit hook for this chunk. With only one smoke test, the overhead isn't justified. Tests run via `pnpm test:run` manually and will be added to the hook in Chunk 3.

### Vitest

Configured in the `test` block of `vite.config.ts` (shown above). `src/test-setup.ts` imports `@testing-library/jest-dom` for DOM matchers.

Note: the jsdom test environment does not load `index.html` or external CDN stylesheets. CSS custom properties from the CDN will not resolve in tests. This is acceptable — smoke tests verify React rendering, not styling. Visual verification of design system integration is manual (criterion 2).

### Package scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "typecheck": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

### Environment variables

`.env.example` establishes the `VITE_` prefix convention for client-side env vars:

```bash
# Firebase config (Chunk 4)
# VITE_FIREBASE_API_KEY=
# VITE_FIREBASE_PROJECT_ID=
# VITE_FIREBASE_AUTH_DOMAIN=
```

`.gitignore` includes `.env.local` and `.env*.local` to prevent credential leaks. `.env.example` is committed as documentation.

## Plepic Design System Integration

### CSS import strategy

The Plepic design system CSS is loaded from the CDN, pinned to a specific commit:

```html
<!-- index.html -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/Plepic-OU/public-web@1fbf2e0/design-system.css"
/>
```

Pinned to commit `1fbf2e0` (2026-04-05) instead of `@main` to prevent silent style changes from upstream pushes. Update the hash deliberately when design system changes are adopted.

### Font loading

Google Fonts loaded in `index.html` `<head>` with `display=swap` to prevent FOIT:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Zilla+Slab:ital,wght@0,400;0,600;0,700;1,400&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0&display=swap"
  rel="stylesheet"
/>
```

Fonts:

- Zilla Slab (display/headings)
- Plus Jakarta Sans (body/UI)
- JetBrains Mono (code/labels)
- Material Symbols Rounded (icons)

### No local token definitions (this chunk)

The CDN stylesheet provides all CSS custom properties (colors, spacing, fonts, transitions). No `:root` token block in `src/index.css` for this chunk.

In Chunk 3, when React components are built, local tokens will be added as needed — including Scrollwork-specific tokens (`--parchment`, `--parchment-dark`, `--parchment-edge`, `--ink`, `--seal-shadow`) that are defined in the prototype but not in the Plepic design system CDN.

### `src/index.css` (minimal)

```css
/* Global resets and body defaults. Design tokens come from CDN stylesheet. */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  line-height: 1.7;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}
```

### Smoke-test app

`App.tsx` renders a minimal page to verify the design system CDN is wired correctly:

- Background inherits `var(--bg)` from body
- Heading in Zilla Slab using `var(--font-display)`
- Body text in Plus Jakarta Sans (inherited)
- A green accent element using `var(--green-brand)`

This is throwaway UI — replaced in Chunk 3. Its purpose is to prove fonts load, CDN tokens apply, and the build pipeline works. Verified visually (criterion 2), not programmatically.

### Smoke test (`App.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders without crashing', () => {
  render(<App />)
  expect(screen.getByRole('heading')).toBeInTheDocument()
})
```

Verifies React + Vitest + RTL integration. Does not test styling (jsdom limitation, see Vitest notes above).

## Dependencies

### Production

| Package     | Purpose       |
| ----------- | ------------- |
| `react`     | UI library    |
| `react-dom` | DOM rendering |

### Development

| Package                       | Purpose                                  |
| ----------------------------- | ---------------------------------------- |
| `vite`                        | Build tool + dev server                  |
| `@vitejs/plugin-react`        | React Fast Refresh + JSX                 |
| `typescript`                  | Type system                              |
| `@types/react`                | React type definitions                   |
| `@types/react-dom`            | ReactDOM type definitions                |
| `eslint`                      | Linting                                  |
| `@eslint/js`                  | ESLint base config                       |
| `typescript-eslint`           | TypeScript ESLint integration            |
| `eslint-plugin-react-hooks`   | Hooks rules                              |
| `eslint-plugin-react-refresh` | Fast Refresh compat checks               |
| `globals`                     | Browser/node global type defs for ESLint |
| `prettier`                    | Code formatting                          |
| `husky`                       | Git hooks                                |
| `lint-staged`                 | Run linters on staged files              |
| `vitest`                      | Test runner                              |
| `jsdom`                       | DOM environment for tests                |
| `@testing-library/react`      | React test utilities                     |
| `@testing-library/jest-dom`   | DOM assertion matchers                   |

No additional CSS framework, no Tailwind, no styled-components. CSS Modules for component styles, CDN for design system tokens.

## Build Output

`pnpm build` produces:

```
web/
├── index.html          # SPA entry
└── assets/
    ├── index-[hash].js  # Bundled app
    └── index-[hash].css # Bundled styles
```

The `web/` directory is what GitHub Pages serves. Vite uses `emptyOutDir: true` (default) since prototypes have been moved to `docs/prototypes/`. The 404.html trick (copy index.html to 404.html for SPA routing) is not needed yet — that's a Chunk 6 concern.

## Verification Criteria

This chunk is done when:

1. `pnpm install` succeeds cleanly
2. `pnpm dev` starts a dev server showing the smoke-test page with Plepic fonts and design system tokens visually applied
3. `pnpm build` produces output in `web/`
4. `pnpm test:run` passes the smoke test
5. `pnpm lint` passes with zero errors
6. `pnpm typecheck` passes
7. A commit with intentionally broken code (e.g., unused variable) is blocked by the pre-commit hook
8. The prototype is accessible at `docs/prototypes/prototype-c2.html`

## Risks and Mitigations

| Risk                                          | Mitigation                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Plepic design system CDN changes silently     | Pinned to commit hash `1fbf2e0`. Update deliberately.                                                      |
| ESLint flat config compatibility              | Using ESLint 9+ flat config which is the current standard. All plugins listed support it.                  |
| CDN tokens unavailable in jsdom tests         | Accepted. Smoke test verifies React rendering only. Visual verification is manual.                         |
| `tsc --noEmit` doesn't cover `vite.config.ts` | Acceptable — Vite config is covered by IDE via `tsconfig.node.json` and caught by `pnpm dev`/`pnpm build`. |

## Implementation Steps

1. Move prototype: `git mv web/prototypes/ docs/prototypes/`
2. Initialize project: `pnpm init`, install all dependencies
3. Create `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
4. Create `eslint.config.js`, `.prettierrc`, `.prettierignore`
5. Create `.env.example`, update `.gitignore` with `.env.local` rules
6. Create `index.html` with pinned CDN CSS + font imports (with `display=swap`)
7. Create `src/main.tsx`, `src/App.tsx`, `src/App.module.css`, `src/index.css`, `src/App.test.tsx`, `src/test-setup.ts`
8. Set up Husky + lint-staged: `pnpm exec husky init`, configure `.lintstagedrc.json`, edit `.husky/pre-commit`
9. Run all verification criteria
10. Commit
