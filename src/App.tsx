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
import Toast, { showToast } from './components/Toast'
import { celebrate } from './components/CelebrationEffect'
import styles from './App.module.css'

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

export default function App() {
  const { user } = useAuth()
  const [state, setState] = useState<SkillState>(loadState)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const pendingClaim = useRef<{ axisId: AxisId; level: number } | null>(null)
  const prevUser = useRef<string | null>(null)
  const syncing = useRef(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function showSaved() {
    setSyncStatus('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSyncStatus('idle'), 3000)
  }

  // Sync on login
  useEffect(() => {
    if (user && prevUser.current !== user.uid) {
      prevUser.current = user.uid
      syncing.current = true
      setSyncStatus('syncing')
      syncOnLogin(user)
        .then((synced) => {
          setState(synced)
          showToast('Progress saved', 'success')
          showSaved()
        })
        .catch((err) => {
          console.error('Sync failed, keeping local state:', err)
          showToast('Couldn\u2019t sync \u2014 working offline', 'error')
          setSyncStatus('error')
        })
        .finally(() => {
          syncing.current = false
        })
    }
    if (!user && prevUser.current) {
      prevUser.current = null
      setState({ ...DEFAULT_STATE })
      setSyncStatus('idle')
    }
  }, [user])

  // Persist on state change
  useEffect(() => {
    saveState(state)
    if (user && !syncing.current) {
      writeAssessment(user.uid, state)
        .then(() => {
          showSaved()
        })
        .catch((err) => {
          console.error('Failed to write assessment:', err)
          showToast('Couldn\u2019t save changes', 'error')
          setSyncStatus('error')
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
    const indicator = nodes[level - 1] as HTMLElement | undefined
    if (indicator) {
      indicator.classList.add('just-claimed')
      setTimeout(() => indicator.classList.remove('just-claimed'), 600)
    }
  })

  const handleClaim = useCallback((axisId: AxisId, level: number) => {
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
      <Header syncStatus={syncStatus} />
      <Hero state={state} />
      <SafetyZoneSelector selected={state.safetyZone} onSelect={handleSafetyZone} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
      <footer className={styles.footer}>
        Built by <strong>Plepic</strong> &mdash; helping developers level up with AI
      </footer>
      <Toast />
    </div>
  )
}
