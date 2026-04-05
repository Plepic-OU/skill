export type SafetyZoneId = 'sandbox' | 'normal' | 'hardcore' | 'impossible'
export type AxisId = 'autonomy' | 'parallelExecution' | 'skillUsage'

export interface Level {
  level: number
  name: string
  desc: string
  levelIcon: string
  verification?: string
  obstacles: string[]
  howToProgress: string[]
}

export interface Axis {
  name: string
  description: string
  icon: string
  color: string
  levels: Level[]
}

export interface SafetyZone {
  label: string
  icon: string
  hint: string
  color: string
  bg: string
  border: string
  desc: string
}

export interface SkillTreeData {
  axes: Record<AxisId, Axis>
  safety: {
    name: string
    description: string
    icon: string
    zones: Record<SafetyZoneId, SafetyZone>
  }
}

export interface SkillState {
  autonomy: number
  parallelExecution: number
  skillUsage: number
  safetyZone: SafetyZoneId
}
