import { loadState, saveState, DEFAULT_STATE } from '../state'
import type { SkillState } from '../../types/skill-tree'

beforeEach(() => {
  localStorage.clear()
})

describe('loadState', () => {
  it('returns default state when localStorage is empty', () => {
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns parsed state from localStorage', () => {
    const state: SkillState = {
      autonomy: 3,
      parallelExecution: 2,
      skillUsage: 4,
      safetyZone: 'hardcore',
    }
    localStorage.setItem('plepic-skill-state', JSON.stringify(state))
    expect(loadState()).toEqual(state)
  })

  it('returns default state for invalid JSON', () => {
    localStorage.setItem('plepic-skill-state', 'not json')
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state for wrong shape', () => {
    localStorage.setItem('plepic-skill-state', JSON.stringify({ foo: 'bar' }))
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state for out-of-range axis values', () => {
    localStorage.setItem(
      'plepic-skill-state',
      JSON.stringify({
        autonomy: 99,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'sandbox',
      }),
    )
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state for negative axis values', () => {
    localStorage.setItem(
      'plepic-skill-state',
      JSON.stringify({
        autonomy: -1,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'sandbox',
      }),
    )
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state for invalid safety zone', () => {
    localStorage.setItem(
      'plepic-skill-state',
      JSON.stringify({
        autonomy: 1,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'invalid',
      }),
    )
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state when stored value is null', () => {
    localStorage.setItem('plepic-skill-state', JSON.stringify(null))
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state when stored value is a string', () => {
    localStorage.setItem('plepic-skill-state', JSON.stringify('a string'))
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state when stored value is a number', () => {
    localStorage.setItem('plepic-skill-state', JSON.stringify(42))
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state when axis value is not a number', () => {
    localStorage.setItem(
      'plepic-skill-state',
      JSON.stringify({
        autonomy: 'not-a-number',
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'sandbox',
      }),
    )
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('returns default state when axis value exceeds maxLevel', () => {
    // autonomy has 6 levels, so 7 should be rejected
    localStorage.setItem(
      'plepic-skill-state',
      JSON.stringify({
        autonomy: 7,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'sandbox',
      }),
    )
    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('accepts value exactly at maxLevel', () => {
    // parallelExecution has 5 levels, autonomy 6, skillUsage 6
    const state: SkillState = {
      autonomy: 6,
      parallelExecution: 5,
      skillUsage: 6,
      safetyZone: 'sandbox',
    }
    localStorage.setItem('plepic-skill-state', JSON.stringify(state))
    expect(loadState()).toEqual(state)
  })

  it.each(['sandbox', 'normal', 'hardcore', 'impossible'] as const)(
    'accepts safety zone "%s"',
    (zone) => {
      const state: SkillState = {
        autonomy: 1,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: zone,
      }
      localStorage.setItem('plepic-skill-state', JSON.stringify(state))
      expect(loadState()).toEqual(state)
    },
  )

  it('accepts level 0 (unclaimed)', () => {
    const state: SkillState = {
      autonomy: 0,
      parallelExecution: 0,
      skillUsage: 0,
      safetyZone: 'sandbox',
    }
    localStorage.setItem('plepic-skill-state', JSON.stringify(state))
    expect(loadState()).toEqual(state)
  })
})

describe('saveState', () => {
  it('writes state to localStorage', () => {
    const state: SkillState = {
      autonomy: 2,
      parallelExecution: 3,
      skillUsage: 1,
      safetyZone: 'normal',
    }
    saveState(state)
    const stored = localStorage.getItem('plepic-skill-state')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored as string)).toEqual(state)
  })

  it('round-trips through loadState', () => {
    const state: SkillState = {
      autonomy: 4,
      parallelExecution: 2,
      skillUsage: 3,
      safetyZone: 'impossible',
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })
})
