import { DEFAULT_STATE } from '../data/state'
import type { AxisId, SafetyZoneId, SkillState, SyncStatus } from '../types/skill-tree'
import FirstRunHint from './FirstRunHint'
import Header from './Header'
import Hero from './Hero'
import LevelCrest from './LevelCrest'
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

function isPristineState(state: SkillState): boolean {
  return (
    state.autonomy === DEFAULT_STATE.autonomy &&
    state.parallelExecution === DEFAULT_STATE.parallelExecution &&
    state.skillUsage === DEFAULT_STATE.skillUsage &&
    state.safetyZone === DEFAULT_STATE.safetyZone
  )
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
  // On landing, the hero earns the first viewport — introducing the app. The
  // crest is a payoff that appears after the user has claimed something, so it
  // sits below the tree. On profile pages the crest *is* the identity and
  // belongs up top.
  const isLanding = headerMode === 'landing'
  const crest = <LevelCrest state={state} visitor={readOnly} />
  // Whisper-light first-run nudge above the tree, visible only while state is
  // untouched. Any claim or stake change dismisses it naturally — no storage
  // needed, no user friction.
  const showFirstRunHint = isLanding && !readOnly && isPristineState(state)

  return (
    <>
      <Header syncStatus={syncStatus} mode={headerMode} state={state} />
      <Hero state={state} visitorName={visitorName} variant={isLanding ? 'landing' : 'profile'} />
      {!isLanding && crest}
      {readOnly || !onSafetyZone ? (
        <SafetyZoneBadge zoneId={state.safetyZone} />
      ) : (
        <SafetyZoneSelector selected={state.safetyZone} onSelect={onSafetyZone} />
      )}
      {showFirstRunHint && <FirstRunHint />}
      <SkillTree state={state} onClaim={onClaim} onUnclaim={onUnclaim} readonly={readOnly} />
      {isLanding && crest}
    </>
  )
}
