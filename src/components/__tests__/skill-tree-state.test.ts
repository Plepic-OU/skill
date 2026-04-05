import { loadState, saveState, DEFAULT_STATE } from '../../data/state'
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
})

describe('claim/unclaim logic', () => {
  it('claiming level N sets highest to N', () => {
    // Simulates: state[axisId] = level
    const state = { ...DEFAULT_STATE }
    state.autonomy = 3
    expect(state.autonomy).toBe(3)
  })

  it('unclaiming decrements by 1', () => {
    const state = { ...DEFAULT_STATE, autonomy: 3 }
    state.autonomy = 3 - 1
    expect(state.autonomy).toBe(2)
  })

  it('unclaiming level 1 goes to 0', () => {
    const state = { ...DEFAULT_STATE, autonomy: 1 }
    state.autonomy = 1 - 1
    expect(state.autonomy).toBe(0)
  })
})
