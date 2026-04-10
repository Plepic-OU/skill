import { useCallback, useEffect, useState } from 'react'
import { loadState, saveState } from '../data/state'
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

  const handleUnclaim = useCallback((axisId: AxisId, level: number) => {
    setState((prev) => ({ ...prev, [axisId]: level - 1 }))
  }, [])

  const handleStakes = useCallback((zone: SafetyZoneId) => {
    setState((prev) => ({ ...prev, safetyZone: zone }))
  }, [])

  return { state, setState, handleClaim, handleUnclaim, handleStakes }
}
