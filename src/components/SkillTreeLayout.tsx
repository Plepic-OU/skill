import { hasAnyProgress } from '../data/state'
import type { AxisId, SafetyZoneId, SkillState, SyncStatus } from '../types/skill-tree'
import FirstRunHint from './FirstRunHint'
import Header from './Header'
import Hero from './Hero'
import LevelCrest from './LevelCrest'
import PathNav from './PathNav'
import SafetyZoneSelector from './SafetyZoneSelector'
import SafetyZoneBadge from './SafetyZoneBadge'
import SkillTree from './SkillTree'
import TrainingCTA from './TrainingCTA'

interface SkillTreeLayoutProps {
  headerMode: 'landing' | 'owner' | 'visitor'
  syncStatus?: SyncStatus
  state: SkillState
  onClaim?: (axisId: AxisId, level: number) => void
  onUnclaim?: (axisId: AxisId, level: number) => void
  onSafetyZone?: (zone: SafetyZoneId) => void
  readOnly?: boolean
  /** A levels-only result from a share link: nobody's name, nobody's profile. */
  shared?: boolean
  visitorName?: string
  visitorAvatarUrl?: string
}

function heroVariant(isLanding: boolean, shared?: boolean): 'landing' | 'profile' | 'shared' {
  if (shared) return 'shared'
  return isLanding ? 'landing' : 'profile'
}

export default function SkillTreeLayout({
  headerMode,
  syncStatus,
  state,
  onClaim,
  onUnclaim,
  onSafetyZone,
  readOnly,
  shared,
  visitorName,
  visitorAvatarUrl,
}: SkillTreeLayoutProps) {
  // Layout hierarchy:
  //   Claimable (landing + own profile) — Hero → Stakes → (FirstRunHint) → Tree → Crest → CTA
  //   Read-only (visitor, shared)       — Hero → Crest → Stakes → Tree → CTA
  // Rationale: the stakes are the context the answer is given in. The right
  // autonomy level depends on them (full autopilot on a hobby project and
  // every edit reviewed on a payment system are both good practice), so the
  // answerer picks them before rating, and a reader learns them right after
  // the crest, before the levels. The crest is a payoff, so wherever the tree
  // can be claimed it sits after the interaction that earns it; a reader came
  // to look, so for them the crest is the identity and leads.
  const isLanding = headerMode === 'landing'
  const crest = <LevelCrest state={state} visitor={readOnly} />
  const stakes =
    readOnly || !onSafetyZone ? (
      <SafetyZoneBadge zoneId={state.safetyZone} />
    ) : (
      <SafetyZoneSelector selected={state.safetyZone} onSelect={onSafetyZone} />
    )
  // Whisper-light first-run nudge above the tree, visible until the first
  // claim. Picking the stakes first must not dismiss it: no level has been
  // tapped yet.
  const showFirstRunHint = isLanding && !readOnly && !hasAnyProgress(state)
  // The bridge to a conversation follows the crest everywhere a result exists.
  // On the landing page that is once any level is claimed: before that there
  // is no result to level up from.
  const ctaVariant = shared ? 'shared' : headerMode
  const showCta = !isLanding || hasAnyProgress(state)

  return (
    <>
      <Header syncStatus={syncStatus} mode={headerMode} state={state} />
      <Hero
        state={state}
        visitorName={visitorName}
        visitorAvatarUrl={visitorAvatarUrl}
        variant={heroVariant(isLanding, shared)}
      />
      {readOnly && crest}
      {stakes}
      {showFirstRunHint && <FirstRunHint />}
      <PathNav state={state} />
      <SkillTree state={state} onClaim={onClaim} onUnclaim={onUnclaim} readonly={readOnly} />
      {!readOnly && crest}
      {showCta && <TrainingCTA variant={ctaVariant} state={state} />}
    </>
  )
}
