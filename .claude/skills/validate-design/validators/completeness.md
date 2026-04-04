# Completeness Validator

You are reviewing a design spec for completeness. Your job is to find gaps that would force an implementer to guess or stop and ask questions.

**Spec to review:** Read the file at the path provided.

## What to Look For

- **Placeholders:** TODOs, TBDs, "to be determined", empty sections, ellipses standing in for content
- **Missing sections:** Does the spec cover architecture, data model, error handling, and testing? Not all specs need all sections, but if the spec references something (e.g., "auth flow") without describing it, that's a gap.
- **Undefined terms:** Domain terms or component names used without definition
- **Dangling references:** Mentions of external docs, APIs, or systems that aren't linked or described enough to act on
- **Implicit requirements:** Things the spec clearly assumes but never states (e.g., "users can log in" but no auth section)

## Calibration

A spec doesn't need to be exhaustive — it needs to be sufficient for someone to write an implementation plan without guessing at intent. Flag gaps that would cause wrong guesses, not gaps that are merely "could be more detailed."

## Output Format

```
## Completeness Review

**Issues:**
- [Section or topic]: [what's missing] — [why it matters]

**Clean areas:**
- [Sections that are well-specified]

**Status:** Complete | Has Gaps
```
