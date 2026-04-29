import { useEffect, useRef, useState } from 'react'

const CELEBRATION_DURATION_MS = 900

/**
 * Returns true for ~900ms whenever `unifiedLevel` increases or `classIndex`
 * changes. Skips while `disabled` is true (e.g. visitor view, where the
 * milestone wasn't earned by the viewer). Initial render never fires.
 */
export function useLevelUpCelebration(
  unifiedLevel: number,
  classIndex: number,
  disabled: boolean,
): boolean {
  const [celebrate, setCelebrate] = useState(false)
  const prevLevelRef = useRef<number | null>(null)
  const prevClassRef = useRef<number | null>(null)

  useEffect(() => {
    const prevLevel = prevLevelRef.current
    const prevClass = prevClassRef.current
    const levelledUp = prevLevel !== null && unifiedLevel > prevLevel
    const classChanged = prevClass !== null && classIndex !== prevClass
    prevLevelRef.current = unifiedLevel
    prevClassRef.current = classIndex
    if (disabled || (!levelledUp && !classChanged)) return
    setCelebrate(true)
    const t = setTimeout(() => setCelebrate(false), CELEBRATION_DURATION_MS)
    return () => clearTimeout(t)
  }, [unifiedLevel, classIndex, disabled])

  return celebrate
}
