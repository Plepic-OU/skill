import { describe, it, expect } from 'vitest'
import type { SkillState } from '../../types/skill-tree'
import {
  CLASS_TABLE,
  STAKES_PREFIX,
  XP_PER_SKILL,
  XP_PER_UNIFIED_LEVEL,
  computeClassIndex,
  computeClassInfo,
  computeCompletedSkills,
  computeProgression,
  computeTitle,
  computeTotalXp,
  computeUnifiedLevel,
} from '../progression'

const state = (
  autonomy: number,
  parallelExecution: number,
  skillUsage: number,
  safetyZone: SkillState['safetyZone'] = 'sandbox',
): SkillState => ({ autonomy, parallelExecution, skillUsage, safetyZone })

describe('computeCompletedSkills', () => {
  it('sums axis levels', () => {
    expect(computeCompletedSkills(state(1, 1, 1))).toBe(3)
    expect(computeCompletedSkills(state(6, 6, 6))).toBe(18)
    expect(computeCompletedSkills(state(4, 3, 2))).toBe(9)
  })
})

describe('computeTotalXp', () => {
  it('multiplies completed skills by XP per skill', () => {
    expect(computeTotalXp(state(1, 1, 1))).toBe(300)
    expect(computeTotalXp(state(6, 6, 6))).toBe(1800)
    expect(computeTotalXp(state(5, 4, 3))).toBe(12 * XP_PER_SKILL)
  })
})

describe('computeUnifiedLevel', () => {
  it('floors total XP by level threshold', () => {
    expect(computeUnifiedLevel(state(1, 1, 1))).toBe(1) // 300 / 300
    expect(computeUnifiedLevel(state(2, 2, 2))).toBe(2) // 600 / 300
    expect(computeUnifiedLevel(state(5, 4, 3))).toBe(4) // 1200 / 300
    expect(computeUnifiedLevel(state(6, 6, 6))).toBe(6) // 1800 / 300
  })

  it('caps at max unified level', () => {
    const maxed = state(6, 6, 6)
    expect(computeUnifiedLevel(maxed)).toBe(6)
    expect(computeTotalXp(maxed) / XP_PER_UNIFIED_LEVEL).toBe(6)
  })
})

describe('computeClassIndex', () => {
  it('returns 0 (Apprentice) when no axis reaches threshold', () => {
    expect(computeClassIndex(state(1, 1, 1))).toBe(0)
    expect(computeClassIndex(state(3, 3, 3))).toBe(0)
  })

  it('bitmasks autonomy=high-bit, parallel=mid-bit, skill=low-bit', () => {
    expect(computeClassIndex(state(1, 1, 4))).toBe(1) // Toolsmith
    expect(computeClassIndex(state(1, 4, 1))).toBe(2) // Swarm Wrangler
    expect(computeClassIndex(state(1, 4, 4))).toBe(3) // Operator
    expect(computeClassIndex(state(4, 1, 1))).toBe(4) // Sentinel
    expect(computeClassIndex(state(4, 1, 4))).toBe(5) // Architect
    expect(computeClassIndex(state(4, 4, 1))).toBe(6) // Commander
    expect(computeClassIndex(state(4, 4, 4))).toBe(7) // Overseer
  })

  it('treats the threshold as an inclusive boundary', () => {
    expect(computeClassIndex(state(3, 3, 3))).toBe(0)
    expect(computeClassIndex(state(4, 4, 4))).toBe(7)
  })
})

describe('computeClassInfo', () => {
  it('returns the class entry for a state', () => {
    expect(computeClassInfo(state(5, 4, 3)).name).toBe('Commander')
    expect(computeClassInfo(state(1, 1, 1)).name).toBe('Apprentice')
    expect(computeClassInfo(state(6, 6, 6)).name).toBe('Overseer')
  })
})

describe('computeTitle', () => {
  it('returns the bare class name in sandbox', () => {
    expect(computeTitle(state(5, 4, 3, 'sandbox'))).toBe('Commander')
  })

  it('prefixes with stakes name', () => {
    expect(computeTitle(state(5, 4, 3, 'normal'))).toBe('Battle-tested Commander')
    expect(computeTitle(state(5, 4, 3, 'hardcore'))).toBe('Hardened Commander')
    expect(computeTitle(state(6, 6, 6, 'impossible'))).toBe('Legendary Overseer')
  })
})

describe('computeProgression', () => {
  it('matches the spec example', () => {
    const summary = computeProgression(state(5, 4, 3, 'hardcore'))
    expect(summary.completedSkills).toBe(12)
    expect(summary.totalXp).toBe(1200)
    expect(summary.unifiedLevel).toBe(4)
    expect(summary.classInfo.name).toBe('Commander')
    expect(summary.stakesPrefix).toBe('Hardened')
    expect(summary.title).toBe('Hardened Commander')
    expect(summary.isMaxLevel).toBe(false)
  })

  it('reports progress into the current unified level', () => {
    const summary = computeProgression(state(2, 2, 3)) // 7 skills = 700 XP, level 2
    expect(summary.unifiedLevel).toBe(2)
    expect(summary.xpIntoLevel).toBe(100)
    expect(summary.xpForNextLevel).toBe(300)
  })

  it('caps progress display at max level', () => {
    const summary = computeProgression(state(6, 6, 6))
    expect(summary.isMaxLevel).toBe(true)
    expect(summary.unifiedLevel).toBe(6)
    expect(summary.xpIntoLevel).toBe(summary.xpForNextLevel)
  })

  it('matches the minimum starting state', () => {
    const summary = computeProgression(state(1, 1, 1))
    expect(summary.unifiedLevel).toBe(1)
    expect(summary.completedSkills).toBe(3)
    expect(summary.classInfo.name).toBe('Apprentice')
    expect(summary.title).toBe('Apprentice')
  })
})

describe('CLASS_TABLE', () => {
  it('has 8 entries indexed in bitmask order', () => {
    expect(CLASS_TABLE).toHaveLength(8)
    CLASS_TABLE.forEach((entry, i) => {
      expect(entry.index).toBe(i)
    })
  })
})

describe('STAKES_PREFIX', () => {
  it('has a prefix entry for every safety zone', () => {
    expect(STAKES_PREFIX.sandbox).toBe('')
    expect(STAKES_PREFIX.normal).toBeTruthy()
    expect(STAKES_PREFIX.hardcore).toBeTruthy()
    expect(STAKES_PREFIX.impossible).toBeTruthy()
  })
})
