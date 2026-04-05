import { skillTreeData } from './skill-trees'
import type { AxisId, SafetyZoneId, SkillState } from '../types/skill-tree'

const STORAGE_KEY = 'plepic-skill-state'

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']
const SAFETY_ZONE_IDS: SafetyZoneId[] = ['safe-zone', 'normal', 'hardcore', 'impossible']

export const DEFAULT_STATE: SkillState = {
  autonomy: 1,
  parallelExecution: 1,
  skillUsage: 1,
  safetyZone: 'safe-zone',
}

function isValidState(data: unknown): data is SkillState {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>

  for (const axisId of AXIS_IDS) {
    const val = obj[axisId]
    if (typeof val !== 'number') return false
    const maxLevel = skillTreeData.axes[axisId].levels.length
    if (val < 0 || val > maxLevel || !Number.isInteger(val)) return false
  }

  if (!SAFETY_ZONE_IDS.includes(obj.safetyZone as SafetyZoneId)) return false

  return true
}

export function loadState(): SkillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
