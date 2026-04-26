import { useCallback, useEffect, useState } from 'react'
import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './PathNav.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]
// Above this width the skill tree renders three columns side-by-side, so a
// separate top nav is redundant. Matches the SkillTree grid breakpoint.
const DESKTOP_QUERY = '(min-width: 820px)'
// Sticky header (56px) + sticky PathNav (~50px) + breathing.
const STICKY_STACK = 120
// A section flips to "active" once its top has scrolled into the upper half
// of the viewport. Floored at the sticky-stack height so very short
// viewports still need the heading to clear the sticky bars before flipping.
function getScrollTrigger(): number {
  return Math.max(STICKY_STACK, window.innerHeight * 0.5)
}

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
 * scrolls to that path section. A scroll listener tracks which section's top
 * has most recently crossed the sticky-stack line and highlights the matching
 * tile. Plain scroll + getBoundingClientRect (rAF-throttled) is used over
 * IntersectionObserver because IO only fires on threshold crossings, leaving
 * the highlight stale while the user scrolls within an already-visible
 * section that overlaps the next one.
 *
 * Returns null on desktop rather than using display:none, so the tile text
 * doesn't shadow the QuestPath ribbon text in visibility queries.
 */
export default function PathNav({ state }: PathNavProps) {
  const isDesktop = useIsDesktop()
  const [activeAxis, setActiveAxis] = useState<AxisId>(AXIS_IDS[0])

  useEffect(() => {
    if (isDesktop) return
    const sections = AXIS_IDS.map((id) =>
      document.querySelector<HTMLElement>(`[data-quest-path="${id}"]`),
    ).filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      // Active = section whose top is the LARGEST value still <= the trigger
      // line. That's the latest section whose heading has scrolled into the
      // upper half of the viewport. If no section has crossed yet (we're
      // still above the first), keep the first axis as the default.
      const trigger = getScrollTrigger()
      let active: AxisId = AXIS_IDS[0]
      let bestTop = -Infinity
      for (const el of sections) {
        const top = el.getBoundingClientRect().top
        if (top <= trigger && top > bestTop) {
          bestTop = top
          const id = el.dataset.questPath as AxisId | undefined
          if (id) active = id
        }
      }
      setActiveAxis(active)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isDesktop])

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
