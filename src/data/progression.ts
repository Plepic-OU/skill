import type { AxisId, SafetyZoneId, SkillState } from '../types/skill-tree'

export const XP_PER_SKILL = 100
export const XP_PER_UNIFIED_LEVEL = 300
export const CLASS_THRESHOLD = 4
export const MAX_UNIFIED_LEVEL = 6

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']

export type ClassIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ClassInfo {
  index: ClassIndex
  name: string
  tagline: string
}

export interface ProgressionSummary {
  completedSkills: number
  totalXp: number
  unifiedLevel: number
  xpIntoLevel: number
  xpForNextLevel: number
  isMaxLevel: boolean
  classInfo: ClassInfo
  stakesPrefix: string
  title: string
}

export const CLASS_TABLE: readonly ClassInfo[] = [
  { index: 0, name: 'Apprentice', tagline: 'Still learning the ropes across all dimensions' },
  { index: 1, name: 'Toolsmith', tagline: 'Deep tooling expertise, hands-on execution' },
  { index: 2, name: 'Swarm Wrangler', tagline: 'Runs many agents with basic tools' },
  { index: 3, name: 'Operator', tagline: 'Many agents, sophisticated tooling, reviews everything' },
  { index: 4, name: 'Sentinel', tagline: 'Careful delegator, one task at a time' },
  { index: 5, name: 'Architect', tagline: 'High trust plus custom tooling, focused execution' },
  { index: 6, name: 'Commander', tagline: 'Delegates and parallelizes with stock tools' },
  { index: 7, name: 'Overseer', tagline: 'Fully evolved across all dimensions' },
] as const

export const STAKES_PREFIX: Record<SafetyZoneId, string> = {
  sandbox: '',
  normal: 'Battle-tested',
  hardcore: 'Hardened',
  impossible: 'Legendary',
}

export function computeCompletedSkills(state: SkillState): number {
  return AXIS_IDS.reduce((sum, id) => sum + state[id], 0)
}

export function computeTotalXp(state: SkillState): number {
  return computeCompletedSkills(state) * XP_PER_SKILL
}

export function computeUnifiedLevel(state: SkillState): number {
  const level = Math.floor(computeTotalXp(state) / XP_PER_UNIFIED_LEVEL)
  return Math.min(level, MAX_UNIFIED_LEVEL)
}

export function computeClassIndex(state: SkillState): ClassIndex {
  const a = state.autonomy >= CLASS_THRESHOLD ? 1 : 0
  const p = state.parallelExecution >= CLASS_THRESHOLD ? 1 : 0
  const s = state.skillUsage >= CLASS_THRESHOLD ? 1 : 0
  return ((a << 2) | (p << 1) | s) as ClassIndex
}

export function computeClassInfo(state: SkillState): ClassInfo {
  return CLASS_TABLE[computeClassIndex(state)]
}

export function computeTitle(state: SkillState): string {
  const prefix = STAKES_PREFIX[state.safetyZone]
  const className = computeClassInfo(state).name
  return prefix ? `${prefix} ${className}` : className
}

export function computeProgression(state: SkillState): ProgressionSummary {
  const completedSkills = computeCompletedSkills(state)
  const totalXp = completedSkills * XP_PER_SKILL
  const unifiedLevel = Math.min(Math.floor(totalXp / XP_PER_UNIFIED_LEVEL), MAX_UNIFIED_LEVEL)
  const isMaxLevel = unifiedLevel >= MAX_UNIFIED_LEVEL
  const xpIntoLevel = isMaxLevel
    ? XP_PER_UNIFIED_LEVEL
    : totalXp - unifiedLevel * XP_PER_UNIFIED_LEVEL
  const classInfo = CLASS_TABLE[computeClassIndex(state)]
  const stakesPrefix = STAKES_PREFIX[state.safetyZone]
  const title = stakesPrefix ? `${stakesPrefix} ${classInfo.name}` : classInfo.name

  return {
    completedSkills,
    totalXp,
    unifiedLevel,
    xpIntoLevel,
    xpForNextLevel: XP_PER_UNIFIED_LEVEL,
    isMaxLevel,
    classInfo,
    stakesPrefix,
    title,
  }
}
