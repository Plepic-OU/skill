import { useCallback, useEffect, useRef, useState } from 'react'
import { skillTreeData } from '../data/skill-trees'
import { loadState, saveState } from '../data/state'
import { celebrate } from '../components/CelebrationEffect'
import type { AxisId, SafetyZoneId, SkillState } from '../types/skill-tree'

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']

export function useSkillState() {
  const [state, setState] = useState<SkillState>(loadState)
  const pendingClaim = useRef<{ axisId: AxisId; level: number } | null>(null)

  // Persist to localStorage on every change
  useEffect(() => {
    saveState(state)
  }, [state])

  // After render, animate the seal stamp on newly claimed node
  useEffect(() => {
    if (!pendingClaim.current) return
    const { axisId, level } = pendingClaim.current
    pendingClaim.current = null

    const axisIndex = AXIS_IDS.indexOf(axisId)
    const questPaths = document.querySelectorAll('#questMap > *')
    const path = questPaths[axisIndex]
    if (!path) return

    const nodes = path.querySelectorAll('[data-indicator]')
    const indicator = nodes[level - 1] as HTMLElement | undefined
    if (indicator) {
      indicator.classList.add('just-claimed')
      setTimeout(() => indicator.classList.remove('just-claimed'), 600)
    }
  })

  const handleClaim = useCallback((axisId: AxisId, level: number) => {
    const axisIndex = AXIS_IDS.indexOf(axisId)
    const questPaths = document.querySelectorAll('#questMap > *')
    const path = questPaths[axisIndex]
    if (path) {
      const indicators = path.querySelectorAll('[data-indicator]')
      const indicator = indicators[level - 1] as HTMLElement | undefined
      if (indicator) {
        celebrate(indicator, skillTreeData.axes[axisId].color)
      }
    }

    pendingClaim.current = { axisId, level }
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
