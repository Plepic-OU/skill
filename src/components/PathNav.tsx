import { useCallback, useEffect, useState } from 'react'
import { skillTreeData } from '../data/skill-trees'
import { useActiveAxis } from '../hooks/useActiveAxis'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './PathNav.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]
// Above this width the skill tree renders three columns side-by-side, so a
// separate top nav is redundant. Matches the SkillTree grid breakpoint.
const DESKTOP_QUERY = '(min-width: 820px)'

interface PathNavProps {
  state: SkillState
}

function useIsDesktop(): boolean {
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

/**
 * Sticky top nav — three tiles, one per skill path. Clicking a tile smooth-
 * scrolls to that path section. The active tile follows scroll via
 * `useActiveAxis`, the same hook that drives the active-card skin so tile
 * and card stay in sync.
 *
 * Returns null on desktop rather than using display:none, so the tile text
 * doesn't shadow the QuestPath ribbon text in visibility queries.
 */
export default function PathNav({ state }: PathNavProps) {
  const isDesktop = useIsDesktop()
  const activeAxis = useActiveAxis()

  const handleTileClick = useCallback((axisId: AxisId) => {
    const section = document.querySelector<HTMLElement>(`[data-quest-path="${axisId}"]`)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (isDesktop) return null

  return (
    <nav className={styles.nav} aria-label="Skill paths">
      <ul className={styles.tiles}>
        {AXIS_IDS.map((id) => {
          const axis = skillTreeData.axes[id]
          const levelMax = axis.levels.length
          const isActive = activeAxis === id
          const tileClasses = [styles.tile, isActive ? styles.tileActive : '']
            .filter(Boolean)
            .join(' ')
          return (
            <li key={id} className={styles.tileItem}>
              <button
                type="button"
                className={tileClasses}
                data-axis={id}
                onClick={() => handleTileClick(id)}
                aria-current={isActive ? 'location' : undefined}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.name}>{axis.name}</span>
                <span className={styles.level}>
                  {state[id]}/{levelMax}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
