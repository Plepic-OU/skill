import { useEffect, useRef } from 'react'
import { celebrate } from '../components/CelebrationEffect'

/**
 * Animates a node indicator when it transitions to the 'claimed' state.
 * Adds a CSS class for the seal-stamp animation and fires the confetti effect.
 */
export function useClaimAnimation(
  indicatorRef: React.RefObject<HTMLDivElement | null>,
  color: string,
  claimed: boolean,
  justClaimedClass: string,
): void {
  const prevClaimed = useRef(claimed)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (!prevClaimed.current && claimed) {
      const el = indicatorRef.current
      if (el) {
        celebrate(el, color)
        el.classList.add(justClaimedClass)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => el.classList.remove(justClaimedClass), 600)
      }
    }
    prevClaimed.current = claimed
  }, [claimed, color, indicatorRef, justClaimedClass])
}
