---
name: validate-design
description: 'Validate a design spec document by spawning parallel specialist reviewers. Use after writing or updating a spec in docs/superpowers/specs/.'
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
5. **Synthesize and triage.** Merge all validator outputs. For each finding, determine:
   - **Decision** — Conflicting validator opinions, ambiguous intent, or trade-offs where only the user can choose. These are presented to the user.
   - **Auto-fixable** — Clear problems with an obvious resolution (contradictions with one right answer, missing details that can be filled in, consistency fixes). These are fixed directly by the skill operator without asking.
6. **Fix auto-fixable issues.** Apply all obvious fixes to the spec immediately. List what was fixed in a summary so the user is aware, but don't ask permission for these.
7. **Present decisions to the user.** Show ONLY the items that require the user's judgment. For each decision, present the trade-off clearly and ask which direction to go. Do not present auto-fixable issues as questions.

## Domain Validators

General-purpose validators that apply regardless of technology choices.

| Validator        | Trigger Heuristic                                               |
| ---------------- | --------------------------------------------------------------- |
| **completeness** | Always                                                          |
| **consistency**  | Always when spec has 3+ sections                                |
| **scope**        | Always when spec describes a system with multiple components    |
| **security**     | Spec mentions auth, user data, APIs, or persistence             |
| **data-model**   | Spec defines a data model, schema, or storage                   |
| **testability**  | Spec describes testing strategy or has testable requirements    |
| **ux-flow**      | Spec describes user-facing screens, interactions, or navigation |
| **performance**  | Spec mentions scale, latency, caching, or real-time behavior    |
| **simplifier**   | Always                                                          |

## Technology Validators

Specialists that check whether the spec uses a specific technology correctly and completely. Triggered when the spec names or implies the technology.

| Validator          | Trigger Heuristic                                                        |
| ------------------ | ------------------------------------------------------------------------ |
| **tech-firebase**  | Spec mentions Firebase, Firestore, Firebase Auth, or security rules      |
| **tech-react-spa** | Spec mentions React, SPA, Vite, or client-side routing                   |
| **tech-infra**     | Spec mentions Terraform, CI/CD, GitHub Actions, deployment, or hosting   |
| **tech-css**       | Spec mentions CSS, design system, responsive design, or styling approach |

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
- **Detect conflicts:** if validators disagree, determine if one side is clearly correct (auto-fix) or if it's a genuine trade-off (decision for user)
- **Triage each finding:** Can this be resolved without user input? If yes → auto-fix. If no → decision.
- Auto-fix criteria: the fix is obvious, non-controversial, and doesn't change the spec's intent. Examples: fixing contradictions where one version is clearly wrong, adding missing details that are implied, correcting cross-document references.
- Decision criteria: genuine trade-offs, conflicting design philosophies, scope questions, or ambiguous intent where reasonable people would disagree.

## Output Format

```markdown
## Decisions for you (<count>)

1. **<Decision title>** — <Option A> vs <Option B>. <Why it matters.>
2. ...

## Auto-fixed (<count>)

- <Brief description of what was fixed>
- ...

## Verdict

<Ready / Needs Decisions> — <one-line summary>
```

If there are decisions, verdict is **Needs Decisions**. After the user resolves decisions, apply their choices and re-validate. If all decisions are resolved and auto-fixes applied, verdict is **Ready — spec is ready for implementation.**

## Key Principles

- **Fix the obvious, ask about the rest.** Auto-fix clear problems (contradictions, missing details, consistency). Only surface decisions that genuinely need the user's judgment.
- **Minimize user effort.** The user should see a short list of decisions, not a wall of findings. Everything else is handled silently.
- **Surface trade-offs honestly.** When validators disagree on a genuine trade-off, present both positions clearly and let the user choose.
- **Only flag issues that matter for implementation.** Stylistic preferences and minor wording are not issues.
- **Be specific.** "Section X is vague" is useless. "Section X says 'handle errors appropriately' but doesn't specify what happens on auth failure" is useful.
- **Respect the author's intent.** Auto-fixes should preserve intent. Decisions should clarify intent, not override it.
- **Simplifier is not a critic.** It proposes alternatives, not objections.
