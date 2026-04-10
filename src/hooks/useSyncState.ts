import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { syncOnLogin, writeAssessment } from '../data/sync'
import type { SkillState } from '../types/skill-tree'

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

export interface SyncResult {
  syncStatus: SyncStatus
  syncError: string | null
  clearSyncError: () => void
}

type SyncPhase =
  | { phase: 'initial' }
  | { phase: 'syncing'; userId: string }
  | { phase: 'ready'; userId: string; skipNextWrite: boolean }

export function useSyncState(
  state: SkillState,
  replaceState: (state: SkillState) => void,
): SyncResult {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const sync = useRef<SyncPhase>({ phase: 'initial' })
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Clean up timers on unmount
  useEffect(() => {
    return () => clearTimeout(savedTimer.current)
  }, [])

  const showSaved = useCallback(() => {
    setSyncStatus('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSyncStatus('idle'), 3000)
  }, [])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
  }, [])

  // Sync on login
  useEffect(() => {
    if (!user) return
    const s = sync.current
    if (s.phase !== 'initial' && s.userId === user.uid) return
    sync.current = { phase: 'syncing', userId: user.uid }
    setSyncStatus('syncing')
    let stale = false
    syncOnLogin(user)
      .then((synced) => {
        if (stale) return
        sync.current = { phase: 'ready', userId: user.uid, skipNextWrite: true }
        replaceState(synced)
        setSyncStatus('idle')
      })
      .catch((err) => {
        if (stale) return
        console.error('Sync failed, keeping local state:', err)
        sync.current = { phase: 'ready', userId: user.uid, skipNextWrite: false }
        setSyncStatus('error')
        setSyncError('Couldn\u2019t sync \u2014 working offline')
      })
    return () => {
      stale = true
      // Reset phase so StrictMode's remount can retry the sync
      sync.current = { phase: 'initial' }
    }
  }, [user, replaceState])

  // Write to Firestore on state change
  useEffect(() => {
    const s = sync.current
    if (s.phase !== 'ready' || !user) return
    if (s.skipNextWrite) {
      s.skipNextWrite = false
      return
    }
    writeAssessment(user.uid, state)
      .then(() => showSaved())
      .catch((err) => {
        console.error('Failed to write assessment:', err)
        setSyncStatus('error')
        setSyncError('Couldn\u2019t save changes')
      })
  }, [state, user, showSaved])

  return { syncStatus, syncError, clearSyncError }
}
