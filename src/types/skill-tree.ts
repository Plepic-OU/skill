export type SafetyZoneId = 'sandbox' | 'normal' | 'hardcore' | 'impossible'
export type AxisId = 'autonomy' | 'parallelExecution' | 'skillUsage'
export type NodeState = 'claimed' | 'frontier' | 'future'

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
  /** Fill color when this zone is selected; also the border accent when unselected. */
  color: string
  /** Text color on the selected-state fill (must clear WCAG AA on .color). */
  activeText: string
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

export type SkillLevels = Record<AxisId, number>

export interface SkillState {
  autonomy: number
  parallelExecution: number
  skillUsage: number
  safetyZone: SafetyZoneId
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'
