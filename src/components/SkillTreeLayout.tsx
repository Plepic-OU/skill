import { DEFAULT_STATE } from '../data/state'
import type { AxisId, SafetyZoneId, SkillState, SyncStatus } from '../types/skill-tree'
import FirstRunHint from './FirstRunHint'
import Header from './Header'
import Hero from './Hero'
import LevelCrest from './LevelCrest'
import PathNav from './PathNav'
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
  // Layout hierarchy:
  //   Landing  — Hero → (FirstRunHint) → Tree → Crest → Stakes
  //   Profile  — Hero → Crest → Tree → Stakes
  // Rationale: on landing, the crest is a payoff and sits after interaction.
  // On profile pages the crest IS the identity and belongs right below the
  // hero. Stakes is cosmetic (flavors the title only) and always sits after
  // the tree so it never competes with the primary interaction.
  const isLanding = headerMode === 'landing'
  const crest = <LevelCrest state={state} visitor={readOnly} />
  const stakes =
    readOnly || !onSafetyZone ? (
      <SafetyZoneBadge zoneId={state.safetyZone} />
    ) : (
      <SafetyZoneSelector selected={state.safetyZone} onSelect={onSafetyZone} />
    )
  // Whisper-light first-run nudge above the tree, visible only while state is
  // untouched. Any claim or stake change dismisses it naturally — no storage
  // needed, no user friction.
  const showFirstRunHint = isLanding && !readOnly && isPristineState(state)

  return (
    <>
      <Header syncStatus={syncStatus} mode={headerMode} state={state} />
      <Hero state={state} visitorName={visitorName} variant={isLanding ? 'landing' : 'profile'} />
      {!isLanding && crest}
      <PathNav state={state} />
      {showFirstRunHint && <FirstRunHint />}
      <SkillTree state={state} onClaim={onClaim} onUnclaim={onUnclaim} readonly={readOnly} />
      {isLanding && crest}
      {stakes}
    </>
  )
}
