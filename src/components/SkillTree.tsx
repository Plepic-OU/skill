import { useCallback, useEffect, useState } from 'react'
import { computeDefaultOpenPath } from '../data/progression'
import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import QuestPath from './QuestPath'
import styles from './SkillTree.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]
// Matches the desktop breakpoint in SkillTree.module.css — below this the tree
// is a single-column stack and the paths collapse into an accordion.
const DESKTOP_QUERY = '(min-width: 820px)'

interface SkillTreeProps {
  state: SkillState
  onClaim?: (axisId: AxisId, level: number) => void
  onUnclaim?: (axisId: AxisId, level: number) => void
  readonly?: boolean
}

const noop = () => {}

function useIsDesktop(): boolean {
  // jsdom (unit tests) doesn't implement matchMedia, so fall back to desktop
  // mode — accordion is a mobile affordance, unused in test render paths.
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia(DESKTOP_QUERY).matches
  })
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(DESKTOP_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function SkillTree({ state, onClaim, onUnclaim, readonly }: SkillTreeProps) {
  const isDesktop = useIsDesktop()
  // On mobile, exactly zero or one path is open (accordion). On desktop, the
  // 3-column grid shows everything, so this value is ignored by QuestPath.
  const [openPath, setOpenPath] = useState<AxisId | null>(() => computeDefaultOpenPath(state))

  const toggleOpenPath = useCallback((axisId: AxisId) => {
    setOpenPath((prev) => {
      const next = prev === axisId ? null : axisId
      if (next !== null) {
        // Let the accordion transition settle (CSS is 360ms) before scrolling,
        // so we land on the final offsetTop instead of a moving target.
        setTimeout(() => {
          document
            .querySelector(`[data-quest-path="${next}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 380)
      }
      return next
    })
  }, [])

  return (
    <main>
      <div id="questMap" className={styles.questMap} role="region" aria-label="Skill tree paths">
        {AXIS_IDS.map((id) => (
          <QuestPath
            key={id}
            axis={skillTreeData.axes[id]}
            axisId={id}
            claimedLevel={state[id]}
            onClaim={onClaim ?? noop}
            onUnclaim={onUnclaim ?? noop}
            readonly={readonly}
            canCollapse={!isDesktop}
            collapsed={!isDesktop && openPath !== id}
            onToggleCollapsed={toggleOpenPath}
          />
        ))}
      </div>
    </main>
  )
}
