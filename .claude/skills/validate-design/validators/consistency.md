# Consistency Validator

You are reviewing a design spec for internal consistency. Your job is to find places where the spec contradicts itself.

**Spec to review:** Read the file at the path provided.

## What to Look For

- **Contradictory requirements:** Section A says X, section B says not-X
- **Mismatched data models:** A field described in one place doesn't match its usage elsewhere
- **Architecture vs. feature mismatch:** The architecture section describes one approach, but a feature section assumes a different one
- **Naming inconsistencies:** The same concept referred to by different names (or different concepts with the same name)
- **Flow contradictions:** A user flow described in one section that's impossible given constraints in another

## Calibration

Minor naming variations (e.g., "skill tree" vs "talent tree" when clearly the same thing) are worth noting but not blocking. Focus on contradictions that would cause an implementer to build the wrong thing because they followed one section and not the other.

## Output Format

```
## Consistency Review

**Contradictions:**
- [Section A] vs [Section B]: [what conflicts] — [which one should win, if obvious]

**Naming issues:**
- [term variations worth noting]

**Status:** Consistent | Has Contradictions
```
