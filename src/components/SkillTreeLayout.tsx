import type { AxisId, SafetyZoneId, SkillState, SyncStatus } from '../types/skill-tree'
import Header from './Header'
import Hero from './Hero'
import SafetyZoneSelector from './SafetyZoneSelector'
import SafetyZoneBadge from './SafetyZoneBadge'
import SkillTree from './SkillTree'

interface SkillTreeLayoutProps {
  headerMode: 'landing' | 'owner' | 'visitor'
  syncStatus?: SyncStatus
  state: SkillState
  onClaim?: (axisId: AxisId, level: number) => void
  onUnclaim?: (axisId: AxisId, level: number) => void
  onSafetyZone?: (zone: SafetyZoneId) => void
  readOnly?: boolean
  visitorName?: string
}

export default function SkillTreeLayout({
  headerMode,
  syncStatus,
  state,
  onClaim,
  onUnclaim,
  onSafetyZone,
  readOnly,
  visitorName,
}: SkillTreeLayoutProps) {
  return (
    <>
      <Header syncStatus={syncStatus} mode={headerMode} />
      <Hero state={state} visitorName={visitorName} />
      {readOnly || !onSafetyZone ? (
        <SafetyZoneBadge zoneId={state.safetyZone} />
      ) : (
        <SafetyZoneSelector selected={state.safetyZone} onSelect={onSafetyZone} />
      )}
      <SkillTree state={state} onClaim={onClaim} onUnclaim={onUnclaim} readonly={readOnly} />
    </>
  )
}
