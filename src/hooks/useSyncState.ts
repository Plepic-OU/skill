import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { syncOnLogin, writeAssessment } from '../data/sync'
import { showToast } from '../components/Toast'
import type { SkillState } from '../types/skill-tree'

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

export function useSyncState(state: SkillState, setState: (state: SkillState) => void): SyncStatus {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const syncPhase = useRef<'initial' | 'syncing' | 'ready'>('initial')
  const prevUserId = useRef<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const skipNextWrite = useRef(false)

  // Clean up the "saved" badge timer on unmount
  useEffect(() => {
    return () => clearTimeout(savedTimer.current)
  }, [])

  function showSaved() {
    setSyncStatus('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSyncStatus('idle'), 3000)
  }

  // Sync on login
  useEffect(() => {
    if (!user || prevUserId.current === user.uid) return
    prevUserId.current = user.uid
    syncPhase.current = 'syncing'
    setSyncStatus('syncing')
    syncOnLogin(user)
      .then((synced) => {
        skipNextWrite.current = true
        setState(synced)
        syncPhase.current = 'ready'
        setSyncStatus('idle')
      })
      .catch((err) => {
        console.error('Sync failed, keeping local state:', err)
        showToast('Couldn\u2019t sync \u2014 working offline', 'error')
        syncPhase.current = 'ready'
        setSyncStatus('error')
      })
  }, [user, setState])

  // Write to Firestore on state change
  useEffect(() => {
    if (syncPhase.current !== 'ready' || !user) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    writeAssessment(user.uid, state)
      .then(() => showSaved())
      .catch((err) => {
        console.error('Failed to write assessment:', err)
        showToast('Couldn\u2019t save changes', 'error')
        setSyncStatus('error')
      })
  }, [state, user])

  return syncStatus
}
