import { useCallback, useEffect, useState } from 'react'
import { skillTreeData } from '../data/skill-trees'
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
 * scrolls to that path section. An IntersectionObserver tracks which section
 * is most in view and highlights the matching tile.
 *
 * Returns null on desktop rather than using display:none, so the tile text
 * doesn't shadow the QuestPath ribbon text in visibility queries.
 */
export default function PathNav({ state }: PathNavProps) {
  const isDesktop = useIsDesktop()
  const [activeAxis, setActiveAxis] = useState<AxisId>(AXIS_IDS[0])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = AXIS_IDS.map((id) =>
      document.querySelector<HTMLElement>(`[data-quest-path="${id}"]`),
    ).filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the section closest to the top of the viewport among those
        // currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length === 0) return
        const top = visible[0].target as HTMLElement
        const axis = top.dataset.questPath as AxisId | undefined
        if (axis) setActiveAxis(axis)
      },
      {
        // Treat the band under the sticky header+nav as "the viewport".
        // Bottom margin keeps the switch happening near the top, not when a
        // section first appears at the bottom edge.
        rootMargin: '-120px 0px -45% 0px',
        threshold: 0,
      },
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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
