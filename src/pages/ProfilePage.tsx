import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import { DEFAULT_STATE } from '../data/state'
import { readPublicProfile, syncOnLogin, writeAssessment } from '../data/sync'
import type { PublicProfile } from '../data/sync'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SafetyZoneSelector from '../components/SafetyZoneSelector'
import SkillTree from '../components/SkillTree'
import { showToast } from '../components/Toast'
import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './ProfilePage.module.css'

function SafetyBadge({ zoneId }: { zoneId: SafetyZoneId }) {
  const zone = skillTreeData.safety.zones[zoneId]
  return (
    <div className={styles.safetyBadge}>
      <span className={styles.safetyDot} style={{ background: zone.color }} />
      <span className={styles.safetyLabel}>{zone.label}</span>
      <span className={styles.safetyDesc}>{zone.desc}</span>
    </div>
  )
}

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.uid === userId
  const wasOwner = useRef(false)

  // --- Owner mode state ---
  const { state, setState, handleClaim, handleUnclaim, handleSafetyZone } = useSkillState()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const prevUser = useRef<string | null>(null)
  const syncing = useRef(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // --- Visitor mode state ---
  const [visitorProfile, setVisitorProfile] = useState<PublicProfile | null>(null)
  const [visitorLoading, setVisitorLoading] = useState(true)
  const [visitorError, setVisitorError] = useState(false)

  function showSaved() {
    setSyncStatus('saved')
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSyncStatus('idle'), 3000)
  }

  // Redirect to landing when owner signs out
  useEffect(() => {
    if (isOwner) {
      wasOwner.current = true
    } else if (wasOwner.current && !loading) {
      wasOwner.current = false
      navigate('/', { replace: true })
    }
  }, [isOwner, loading, navigate])

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

  // Fetch public profile (visitor mode)
  useEffect(() => {
    if (isOwner || loading) return
    if (!userId) {
      setVisitorLoading(false)
      setVisitorError(true)
      return
    }
    setVisitorLoading(true)
    setVisitorError(false)
    readPublicProfile(userId)
      .then((profile) => {
        setVisitorProfile(profile)
        setVisitorLoading(false)
      })
      .catch(() => {
        setVisitorError(true)
        setVisitorLoading(false)
      })
  }, [userId, isOwner, loading])

  // While auth is resolving, show nothing (avoid flash)
  if (loading) return null

  // --- Visitor mode ---
  if (!isOwner) {
    if (visitorLoading) {
      return (
        <>
          <Header mode="visitor" />
          <div className={styles.visitorMessage}>
            <p>Loading profile...</p>
          </div>
        </>
      )
    }

    if (visitorError || !visitorProfile) {
      return (
        <>
          <Header mode="visitor" />
          <div className={styles.visitorMessage}>
            <h2>Profile not found</h2>
            <p>This profile doesn't exist or couldn't be loaded.</p>
            <Link to="/" className={styles.ctaLink}>
              Assess your own skills
            </Link>
          </div>
        </>
      )
    }

    return (
      <>
        <Header mode="visitor" />
        <div className={styles.profileBanner}>
          {visitorProfile.avatarUrl ? (
            <img
              src={visitorProfile.avatarUrl}
              alt=""
              className={styles.bannerAvatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.bannerAvatarFallback}>
              {visitorProfile.displayName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <h2 className={styles.bannerName}>{visitorProfile.displayName}</h2>
        </div>
        <Hero state={visitorProfile} visitorName={visitorProfile.displayName} />
        <SafetyBadge zoneId={visitorProfile.safetyZone} />
        <SkillTree state={visitorProfile} readonly />
      </>
    )
  }

  // --- Owner mode ---
  return (
    <>
      <Header syncStatus={syncStatus} mode="owner" />
      <Hero state={state} />
      <SafetyZoneSelector selected={state.safetyZone} onSelect={handleSafetyZone} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
    </>
  )
}
