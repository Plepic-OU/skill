import { useEffect, useState } from 'react'
import { skillTreeData } from '../data/skill-trees'
import type { AxisId } from '../types/skill-tree'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]
// Sticky header (56px) + sticky PathNav (~50px) + breathing.
const STICKY_STACK = 120

function getScrollTrigger(): number {
  // A section flips to "active" once its top has scrolled into the upper
  // half of the viewport. Floored at the sticky-stack height so very short
  // viewports still need the heading to clear the sticky bars before flipping.
  return Math.max(STICKY_STACK, window.innerHeight * 0.5)
}

/**
 * Tracks which QuestPath section is currently dominating the viewport based
 * on scroll position. Both the mobile PathNav (tile highlight) and the
 * SkillTree (active-card skin on touch devices, where :hover doesn't fire)
 * read this so the entire UI stays in sync as the user scrolls.
 *
 * Active = the section whose top is the LARGEST value still <= the trigger.
 * That's the most recently crossed heading. If no section has crossed yet
 * (we're above the first), the first axis is the default.
 */
export function useActiveAxis(): AxisId {
  const [activeAxis, setActiveAxis] = useState<AxisId>(AXIS_IDS[0])

  useEffect(() => {
    const sections = AXIS_IDS.map((id) =>
      document.querySelector<HTMLElement>(`[data-quest-path="${id}"]`),
    ).filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
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
  }, [])

  return activeAxis
}
