import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import { DEFAULT_STATE } from '../data/state'
import { syncOnLogin, writeAssessment } from '../data/sync'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SafetyZoneSelector from '../components/SafetyZoneSelector'
import SkillTree from '../components/SkillTree'
import { showToast } from '../components/Toast'

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user, loading } = useAuth()
  const isOwner = user?.uid === userId
  const { state, setState, handleClaim, handleUnclaim, handleSafetyZone } = useSkillState()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const prevUser = useRef<string | null>(null)
  const syncing = useRef(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function showSaved() {
    setSyncStatus('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSyncStatus('idle'), 3000)
  }

  // Sync on login (owner mode)
  useEffect(() => {
    if (!isOwner) return
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
  }, [user, isOwner, setState])

  // Write to Firestore on state change (owner mode)
  useEffect(() => {
    if (!isOwner || !user || syncing.current) return
    writeAssessment(user.uid, state)
      .then(() => {
        showSaved()
      })
      .catch((err) => {
        console.error('Failed to write assessment:', err)
        showToast('Couldn\u2019t save changes', 'error')
        setSyncStatus('error')
      })
  }, [state, user, isOwner])

  // While auth is resolving, show nothing (avoid flash)
  if (loading) return null

  // Visitor mode (fully implemented in Chunk 2)
  if (!isOwner) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p>Visitor mode coming soon.</p>
        </div>
      </>
    )
  }

  // Owner mode
  return (
    <>
      <Header syncStatus={syncStatus} />
      <Hero state={state} />
      <SafetyZoneSelector selected={state.safetyZone} onSelect={handleSafetyZone} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
    </>
  )
}
