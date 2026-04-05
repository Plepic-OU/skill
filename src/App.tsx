import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { skillTreeData } from './data/skill-trees'
import { DEFAULT_STATE, loadState, saveState } from './data/state'
import { syncOnLogin, writeAssessment } from './data/sync'
import type { AxisId, SafetyZoneId, SkillState } from './types/skill-tree'
import Header from './components/Header'
import Hero from './components/Hero'
import SafetyZoneSelector from './components/SafetyZoneSelector'
import SkillTree from './components/SkillTree'
import { celebrate } from './components/CelebrationEffect'
import styles from './App.module.css'

export default function App() {
  const { user } = useAuth()
  const [state, setState] = useState<SkillState>(loadState)
  const pendingClaim = useRef<{ axisId: AxisId; level: number } | null>(null)
  const prevUser = useRef<string | null>(null)
  const syncing = useRef(false)

  // Sync on login
  useEffect(() => {
    if (user && prevUser.current !== user.uid) {
      prevUser.current = user.uid
      syncing.current = true
      syncOnLogin(user)
        .then((synced) => {
          setState(synced)
        })
        .catch((err) => {
          console.error('Sync failed, keeping local state:', err)
        })
        .finally(() => {
          syncing.current = false
        })
    }
    if (!user && prevUser.current) {
      // Sign-out: reset to defaults, clear localStorage
      prevUser.current = null
      setState({ ...DEFAULT_STATE })
    }
  }, [user])

  // Persist on state change
  useEffect(() => {
    saveState(state)
    if (user && !syncing.current) {
      writeAssessment(user.uid, state).catch((err) => {
        console.error('Failed to write assessment:', err)
      })
    }
  }, [state, user])

  // After render, animate the seal stamp on newly claimed node
  useEffect(() => {
    if (!pendingClaim.current) return
    const { axisId, level } = pendingClaim.current
    pendingClaim.current = null

    // Find the claimed node's indicator via data attribute
    const axisIndex = (['autonomy', 'parallelExecution', 'skillUsage'] as AxisId[]).indexOf(axisId)
    const questPaths = document.querySelectorAll('#questMap > *')
    const path = questPaths[axisIndex]
    if (!path) return

    const nodes = path.querySelectorAll('[data-indicator]')
    // The indicator for the claimed level (0-indexed: level-1)
    const indicator = nodes[level - 1] as HTMLElement | undefined
    if (indicator) {
      indicator.classList.add('just-claimed')
      setTimeout(() => indicator.classList.remove('just-claimed'), 600)
    }
  })

  const handleClaim = useCallback((axisId: AxisId, level: number) => {
    // Fire celebration on the clicked node's indicator
    const axisIndex = (['autonomy', 'parallelExecution', 'skillUsage'] as AxisId[]).indexOf(axisId)
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

  const handleSafetyZone = useCallback((zone: SafetyZoneId) => {
    setState((prev) => ({ ...prev, safetyZone: zone }))
  }, [])

  return (
    <div className={styles.app}>
      <a href="#questMap" className="skip-link">
        Skip to skill tree
      </a>
      <Header />
      <Hero state={state} />
      <SafetyZoneSelector selected={state.safetyZone} onSelect={handleSafetyZone} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
      <footer className={styles.footer}>
        Built by <strong>Plepic</strong> &mdash; helping developers level up with AI
      </footer>
    </div>
  )
}
