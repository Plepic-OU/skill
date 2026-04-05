---
name: implement-plan
description: 'Execute an implementation plan in validated chunks. Implements code, spawns dynamic validators after each chunk, updates docs, and commits. Use when you have a spec and want to build it.'
---

# Implement Plan

Execute an implementation plan by working through it in logical chunks. After each chunk, spawn AI-selected validators to catch issues early. Update documentation and commit after each validated chunk.

## Usage

```
/implement-plan [path-to-spec-or-plan]
```

If no path is given, find the most recently modified spec in `docs/superpowers/specs/`.

## Process Overview

```
Read spec/plan
    ↓
Break into chunks (if not already chunked)
    ↓
┌─ For each chunk: ─────────────────────┐
│  1. Implement the chunk               │
│  2. Run build/lint/typecheck/tests     │
│  3. Select & spawn validators          │
│  4. Triage validator findings          │
│  5. Fix issues                         │
│  6. Update docs if needed              │
│  7. Commit the chunk                   │
└────────────────────────────────────────┘
    ↓
Final summary
```

## Step 1: Read and Understand

1. Read the spec/plan document in full.
2. Read `CLAUDE.md` for project conventions, tech stack, and build commands.
3. Read `.impeccable.md` if it exists (design context).
4. Identify the implementation chunks — use the spec's own chunking if it defines one, otherwise break the work into logical, independently-committable units.

## Step 2: Plan Chunks

Present the chunks to the user before starting:

```
## Implementation Chunks

1. **<Chunk name>** — <what it does> (<estimated files>)
2. **<Chunk name>** — <what it does> (<estimated files>)
...

Starting with chunk 1. I'll validate after each chunk.
```

Each chunk should be:

- Small enough to reason about (3-10 files typically)
- Independently buildable (no broken intermediate states)
- Logically coherent (one concern per chunk)

## Step 3: Implement Each Chunk

For each chunk:

### 3a. Implement

- Write the code. Follow existing patterns and conventions.
- **Use context7** (`npx ctx7@latest`) when working with any third-party library — even familiar ones. Your training data may not reflect recent API changes. Run `npx ctx7@latest library <name> "<what you need>"` to find the right docs, then `npx ctx7@latest docs <id> "<question>"` for specifics.
- Run build/lint/typecheck after writing code. Fix any errors before proceeding to validation.
- Run existing tests. Fix any regressions.

### 3b. Select Validators

After the chunk builds cleanly, select validators dynamically based on what was just implemented. You are the selector — examine the chunk's changes and pick relevant validators.

**Always include:**

- **Security** — review for auth gaps, data exposure, input trust, XSS, injection
- **Simplifier** — challenge unnecessary complexity, over-engineering, premature abstractions

**Select technology specialists based on what was touched:**

| Trigger                            | Validator to spawn           |
| ---------------------------------- | ---------------------------- |
| React components, hooks, JSX       | **React/SPA specialist**     |
| CSS, styling, design tokens        | **CSS/Design specialist**    |
| Firebase, Firestore, auth          | **Firebase specialist**      |
| Terraform, CI/CD, deploy configs   | **Infra specialist**         |
| TypeScript types, generics, config | **TypeScript specialist**    |
| Testing code, test setup           | **Testing specialist**       |
| State management, data flow        | **Data flow specialist**     |
| Accessibility, ARIA, semantics     | **Accessibility specialist** |
| API calls, data fetching           | **API specialist**           |
| Routing, navigation                | **Routing specialist**       |
| Build config, bundler, Vite        | **Build tooling specialist** |

Technology validators **MUST use context7** to verify that the implementation follows current library APIs and best practices. Include this instruction in every technology validator prompt.

**Select 3-6 validators per chunk.** Don't over-validate trivial chunks (e.g., config-only changes may only need 2-3).

### 3c. Dispatch Validators

Spawn all selected validators **in parallel** using the Agent tool. Each validator agent gets:

1. **Role description** — what lens to review through (see Validator Prompt Template below)
2. **The chunk's changed files** — list of files that were added or modified
3. **Project context** — path to CLAUDE.md and the spec
4. **Instruction** — review the implementation, report findings, severity, and suggested fixes

### 3d. Triage Findings

When validators return:

- **P0 (Blocking):** Security vulnerabilities, broken functionality, data loss risks → fix immediately
- **P1 (Important):** Incorrect API usage, missing error handling at boundaries, accessibility failures → fix before commit
- **P2 (Minor):** Style suggestions, minor simplifications, non-critical improvements → fix if quick (<2 min), otherwise note for later
- **P3 (Informational):** Best practice suggestions, future considerations → log but don't act

Auto-fix P0 and P1 issues. Note P2/P3 in the commit message or a TODO if warranted.

### 3e. Commit the Chunk

After validation and fixes:

1. Run build/lint/typecheck/tests one final time to confirm everything passes.
2. **Update docs before committing.** This is mandatory, not optional:
   - **Update the spec** with an "Implementation Notes" section (or append to an existing one): deviations from spec, actual versions installed, decisions made during implementation. Mark the chunk's status as complete.
   - **Update `CLAUDE.md`** if the implementation changes project status, available commands, directory structure, or completion state of chunks.
   - If no docs need updating (rare — at minimum the spec should be marked complete), explicitly note that in your summary.
3. Stage the relevant files including doc updates (not `git add -A` — be specific).
4. Commit with a clear message describing what the chunk accomplished.

## Validator Prompt Template

Use this template when constructing validator agent prompts. Adapt the role and focus areas for each validator type.

```
You are a **[Role Name]** reviewing a code implementation for quality and correctness.

## Context
- Project: read CLAUDE.md at [path]
- Spec: [path to spec]
- Files changed in this chunk: [list of files]

## Your Review Focus
[Specific areas for this validator type]

## Instructions
1. Read each changed file carefully.
2. [For technology validators]: Use context7 (`npx ctx7@latest`) to verify API usage against current documentation. Run `npx ctx7@latest library <lib> "<question>"` then `npx ctx7@latest docs <id> "<specific check>"`.
3. Report findings with severity (P0/P1/P2/P3).
4. For each finding: file, line(s), issue description, suggested fix.
5. Be specific — "this is wrong" is useless; "line 42 passes unsanitized user input to innerHTML" is useful.
6. Only flag real issues. Don't nitpick style if a formatter/linter handles it.

## Output Format
### [Role Name] Review

**Findings:**
- **[P0-P3]** `file:line` — [issue description] → [suggested fix]

**Looks Good:**
- [Things done well, briefly]

**Status:** Clean | Has Issues
```

## After All Chunks

When all chunks are implemented and validated:

1. **Final integration check** — run full build, all tests, typecheck.
2. **Update spec** — if implementation diverged from the spec (common and fine), update the spec to reflect what was actually built. Note any deferred items.
3. **Summary** — present to user:

```markdown
## Implementation Complete

**Chunks completed:** <N>
**Commits:** <list with hashes>
**Validators run:** <count> across <chunk count> chunks
**Issues found and fixed:** <P0: N, P1: N, P2: N>
**Deferred:** <any P2/P3 items not addressed>

### What was built

<brief summary>

### Divergences from spec

<any changes made during implementation>
```

## Key Principles

- **Build → Validate → Fix → Commit.** Never commit unvalidated code.
- **Validators are dynamic.** Select them based on what changed, not a fixed list. A CSS-only chunk doesn't need a Firebase validator.
- **Use context7 liberally.** Both during implementation and in technology validators. Library APIs change — verify, don't assume.
- **Small commits.** Each chunk = one commit. Makes review and rollback easy.
- **Fix forward.** When a validator catches something, fix it in the current chunk. Don't defer P0/P1 issues.
- **No broken intermediate states.** Every commit should build, pass lint, and pass tests.
- **Security is non-negotiable.** The security validator runs on every chunk that touches application code.
- **Simplifier keeps you honest.** If you're writing something complex, there might be a simpler way.
- **Docs are part of the deliverable.** Every chunk commit must include doc updates (spec notes + CLAUDE.md). This is not a nice-to-have — it's a mandatory step before committing. Don't wait for the user to ask.
