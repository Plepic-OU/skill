import type { SafetyZoneId, SkillState } from '../types/skill-tree'
import { isValidState } from './state'

// A shareable result is the three path levels and the stakes, nothing else:
// no name, no email, no user id. The code reads `3-2-4-normal`.
const SHARE_CODE = /^(\d)-(\d)-(\d)-([a-z]+)$/

export function encodeShareCode(state: SkillState): string {
  return `${state.autonomy}-${state.parallelExecution}-${state.skillUsage}-${state.safetyZone}`
}

export function decodeShareCode(code: string): SkillState | null {
  const match = SHARE_CODE.exec(code)
  if (!match) return null
  const candidate = {
    autonomy: Number(match[1]),
    parallelExecution: Number(match[2]),
    skillUsage: Number(match[3]),
    safetyZone: match[4] as SafetyZoneId,
  }
  return isValidState(candidate) ? candidate : null
}

export function shareUrl(origin: string, state: SkillState): string {
  return `${origin}/shared/${encodeShareCode(state)}`
}
