import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_STATE, loadState, saveState } from '../data/state'
import type { AxisId, SafetyZoneId, SkillState } from '../types/skill-tree'

export function useSkillState() {
  const [state, setState] = useState<SkillState>(loadState)

  // Persist to localStorage on every change
  useEffect(() => {
    saveState(state)
  }, [state])

  const handleClaim = useCallback((axisId: AxisId, level: number) => {
    setState((prev) => ({ ...prev, [axisId]: level }))
  }, [])

  const handleUnclaim = useCallback((axisId: AxisId, currentLevel: number) => {
    setState((prev) => ({ ...prev, [axisId]: currentLevel - 1 }))
  }, [])

  const handleSafetyZone = useCallback((zone: SafetyZoneId) => {
    setState((prev) => ({ ...prev, safetyZone: zone }))
  }, [])

  const resetState = useCallback(() => {
    setState({ ...DEFAULT_STATE })
  }, [])

  return { state, replaceState: setState, handleClaim, handleUnclaim, handleSafetyZone, resetState }
}
