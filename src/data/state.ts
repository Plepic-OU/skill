import type { AxisId, SafetyZoneId, SkillState } from '../types/skill-tree'

const STORAGE_KEY = 'plepic-skill-state'

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']
const MAX_LEVELS: Record<AxisId, number> = { autonomy: 6, parallelExecution: 6, skillUsage: 6 }
const SAFETY_ZONE_IDS: SafetyZoneId[] = ['sandbox', 'normal', 'hardcore', 'impossible']

export const DEFAULT_STATE: SkillState = {
  autonomy: 1,
  parallelExecution: 1,
  skillUsage: 1,
  safetyZone: 'sandbox',
}

function isValidState(data: unknown): data is SkillState {
  // Stryker disable next-line ConditionalExpression,LogicalOperator: defense-in-depth; downstream checks catch same inputs
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>

  for (const axisId of AXIS_IDS) {
    const val = obj[axisId]
    // Stryker disable next-line ConditionalExpression: defense-in-depth; range check below catches non-numbers
    if (typeof val !== 'number') return false
    const maxLevel = MAX_LEVELS[axisId]
    if (val < 0 || val > maxLevel || !Number.isInteger(val)) return false
  }

  if (!SAFETY_ZONE_IDS.includes(obj.safetyZone as SafetyZoneId)) return false

  return true
}

export function loadState(): SkillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Stryker disable next-line ConditionalExpression: JSON.parse(null) returns null which fails isValidState anyway
    if (!raw) return { ...DEFAULT_STATE }
    const parsed: unknown = JSON.parse(raw)
    if (isValidState(parsed)) return parsed
    return { ...DEFAULT_STATE }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: SkillState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetState(): void {
  saveState(DEFAULT_STATE)
}
