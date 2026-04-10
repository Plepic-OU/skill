import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { syncOnLogin, writeAssessment } from '../data/sync'
import type { SkillState, SyncStatus } from '../types/skill-tree'

export type { SyncStatus }

export interface SyncResult {
  syncStatus: SyncStatus
  syncError: string | null
  clearSyncError: () => void
}

type SyncPhase =
  | { phase: 'initial' }
  | { phase: 'syncing'; userId: string }
  | { phase: 'ready'; userId: string }

/** Core login-sync logic, extracted for clarity. */
async function performLoginSync(
  user: User,
  staleRef: { current: boolean },
  setFullState: (state: SkillState) => void,
  sync: React.MutableRefObject<SyncPhase>,
  skipNextWrite: React.MutableRefObject<boolean>,
  setSyncStatus: (status: SyncStatus) => void,
  setSyncError: (error: string | null) => void,
): Promise<void> {
  try {
    const synced = await syncOnLogin(user)
    if (staleRef.current) return
    sync.current = { phase: 'ready', userId: user.uid }
    skipNextWrite.current = true
    setFullState(synced)
    setSyncStatus('idle')
  } catch (err) {
    if (staleRef.current) return
    console.error('Sync failed, keeping local state:', err)
    sync.current = { phase: 'ready', userId: user.uid }
    skipNextWrite.current = false
    setSyncStatus('error')
    setSyncError('Couldn\u2019t sync \u2014 working offline')
  }
}

export function useSyncState(
  state: SkillState,
  setFullState: (state: SkillState) => void,
): SyncResult {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const sync = useRef<SyncPhase>({ phase: 'initial' })
  const skipNextWrite = useRef(false)
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
    const staleRef = { current: false }
    performLoginSync(user, staleRef, setFullState, sync, skipNextWrite, setSyncStatus, setSyncError)
    return () => {
      staleRef.current = true
      // Reset phase so StrictMode's remount can retry the sync
      sync.current = { phase: 'initial' }
    }
  }, [user, setFullState])

  // Write to Firestore on state change
  useEffect(() => {
    const s = sync.current
    if (s.phase !== 'ready' || !user) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
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
