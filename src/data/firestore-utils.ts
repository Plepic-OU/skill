import type { SafetyZoneId, SkillLevels, SkillState } from '../types/skill-tree'

const VALID_SAFETY_ZONES: SafetyZoneId[] = ['sandbox', 'normal', 'hardcore', 'impossible']

export interface FirestoreUserRead {
  displayName?: string
  avatarUrl?: string
  safetyZone: SkillState['safetyZone']
  skills: SkillLevels
}

export function hasValidUserData(data: Record<string, unknown>): boolean {
  const skills = data.skills
  if (
    typeof skills !== 'object' ||
    skills === null ||
    typeof (skills as Record<string, unknown>).autonomy !== 'number' ||
    typeof (skills as Record<string, unknown>).parallelExecution !== 'number' ||
    typeof (skills as Record<string, unknown>).skillUsage !== 'number'
  ) {
    return false
  }

  if (!VALID_SAFETY_ZONES.includes(data.safetyZone as SafetyZoneId)) {
    return false
  }

  return true
}

export function toSkillState(data: {
  skills: SkillLevels
  safetyZone: SkillState['safetyZone']
}): SkillState {
  return {
    autonomy: data.skills.autonomy,
    parallelExecution: data.skills.parallelExecution,
    skillUsage: data.skills.skillUsage,
    safetyZone: data.safetyZone,
  }
}
