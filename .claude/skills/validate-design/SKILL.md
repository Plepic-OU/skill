---
name: validate-design
description: "Validate a design spec document by spawning parallel specialist reviewers. Use after writing or updating a spec in docs/superpowers/specs/."
---

# Validate Design Spec

Validate a design document by dispatching multiple specialist reviewers in parallel. Each reviewer examines the spec through a distinct lens and reports problems. The skill reports problems only — it does not fix or rewrite the spec.

## Usage

```
/validate-design [path-to-spec]
```

If no path is given, find the most recently modified spec in `docs/superpowers/specs/`.

## Process

1. **Read the spec** in full.
2. **Select validators.** Scan the spec content and pick relevant specialists from both rosters (domain + technology). Match validators to what the spec actually covers. Always include **Completeness** and **Simplifier**. Select 4-8 validators total.
3. **Dispatch validators in parallel** using the Agent tool. Each agent gets the specialist prompt from `validators/` plus the full spec path.
4. **Collect results.** Wait for all validators to finish.
5. **Synthesize a single report.** Merge all validator outputs into one structured summary. Categorize each finding as:
   - **Block** — must fix before implementation planning
   - **Warn** — worth addressing but doesn't block
   - **Note** — advisory, take or leave
6. **Check for conflicts.** If two validators contradict each other (e.g., one says a feature is over-scoped, another says it's incomplete), do NOT resolve the conflict yourself. Present both positions clearly and ask the user to decide.
7. **Present to the user.** Report problems only. Do not propose fixes, rewrites, or edits to the spec. The user decides what to do with the findings.

## Domain Validators

General-purpose validators that apply regardless of technology choices.

| Validator | Trigger Heuristic |
|-----------|-------------------|
| **completeness** | Always |
| **consistency** | Always when spec has 3+ sections |
| **scope** | Always when spec describes a system with multiple components |
| **security** | Spec mentions auth, user data, APIs, or persistence |
| **data-model** | Spec defines a data model, schema, or storage |
| **testability** | Spec describes testing strategy or has testable requirements |
| **ux-flow** | Spec describes user-facing screens, interactions, or navigation |
| **performance** | Spec mentions scale, latency, caching, or real-time behavior |
| **simplifier** | Always |

## Technology Validators

Specialists that check whether the spec uses a specific technology correctly and completely. Triggered when the spec names or implies the technology.

| Validator | Trigger Heuristic |
|-----------|-------------------|
| **tech-firebase** | Spec mentions Firebase, Firestore, Firebase Auth, or security rules |
| **tech-react-spa** | Spec mentions React, SPA, Vite, or client-side routing |
| **tech-infra** | Spec mentions Terraform, CI/CD, GitHub Actions, deployment, or hosting |
| **tech-css** | Spec mentions CSS, design system, responsive design, or styling approach |

Technology validators are only selected when the spec references their domain. A spec that uses Django + PostgreSQL wouldn't trigger tech-firebase or tech-react-spa.

"Always" means the validator runs on every spec. Other validators are triggered when their heuristic matches. Use judgment — the heuristics are guidelines, not rigid rules.

## Dispatching a Validator

For each selected validator:

1. Read `validators/<name>.md` to get the specialist prompt.
2. Spawn an Agent (subagent_type: general-purpose) with:
   - The specialist prompt
   - The spec file path
   - Instruction: read the spec, apply the review lens, return findings in the output format defined in the prompt. Report problems only — do not suggest fixes or rewrites.
3. All validators run in parallel — launch them in a single message with multiple Agent tool calls.

## Synthesizing Results

After all validators return:

- Group findings by spec section
- Deduplicate: if two validators flag the same issue, merge into one finding citing both lenses
- **Detect conflicts:** if validators disagree (one flags something as a problem, another considers it correct, or two validators recommend opposite directions), mark these as **Conflicts** and present both sides
- Assign severity (Block / Warn / Note) based on impact to implementation planning
- Order: Conflicts first (need user decision), then Blocks, then Warns, then Notes

## Output Format

```markdown
## Design Validation Report

**Spec:** <spec file path>
**Validators run:** <list>

### Conflicts (need your decision)
- [Section] **Conflict title** — Validator A says: ... / Validator B says: ... — Which direction do you want to go?

### Blockers
- [Section] **Issue title** — description (flagged by: validator-name)

### Warnings
- [Section] **Issue title** — description (flagged by: validator-name)

### Notes
- [Section] **Issue title** — description (flagged by: validator-name)

### Verdict
<Approved / Needs Revision / Needs Decisions> — <one-line summary>
```

If validators conflict, verdict is **Needs Decisions**. If there are blockers, verdict is **Needs Revision**. If clean, **Approved — spec is ready for implementation planning.**

## Key Principles

- **Report problems, not solutions.** The skill identifies issues. The user decides how to address them.
- **Never edit the spec.** Not even "minor" fixes. Report only.
- **Surface conflicts honestly.** When validators disagree, present both positions and let the user resolve.
- **Only flag issues that matter for implementation.** Stylistic preferences and minor wording are not issues.
- **Be specific.** "Section X is vague" is useless. "Section X says 'handle errors appropriately' but doesn't specify what happens on auth failure" is useful.
- **Respect the author's intent.** Validators challenge the spec, not rewrite it.
- **Simplifier is not a critic.** It proposes alternatives, not objections.
